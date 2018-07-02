import matplotlib
matplotlib.use('Agg')

from flask import Flask, render_template, request, session
from flask_socketio import SocketIO, join_room, emit

import control
import numpy as np

import eventlet
eventlet.monkey_patch()

from threading import Lock

# store a list of clients
clients = {}

# initialize Flask
app = Flask(__name__)
socketio = SocketIO(app, async_mode='eventlet')

@app.route('/')
def index():
    """Serve the index HTML"""
    return render_template('index.html')

@socketio.on('increase')
def increaseAction():
    clients[request.sid]['data']['action'] += 1

@socketio.on('decrease')
def decreaseAction():
    clients[request.sid]['data']['action'] -= 1

@socketio.on('update_tf')
def updateTf(data):
    # Set up request id and transfer function system
    sid = request.sid
    sys = control.tf(data[0], data[1])
    clients[sid]['data']['sys'] = sys

    print('Update TF: ', data[0], data[1])
    emit('process', 'Updated TF')
    clients[sid]['data']['reset'] = False

    clients[sid]['data']['thread'] = socketio.start_background_task(background_thread, request.sid, sys)
    emit('process', 'Starting simulator...')

@socketio.on('connect', namespace='/')
def connect():
    room = request.sid
    clients.setdefault(room, {})
    clients[room]['data'] = {}

    join_room(request.sid)
    emit('room_response', {'message': room}, room=room)
    print('Client Connected: ', room)

class Process:
    def __init__(self, sys, sid):
        self.sid   = sid
        self.sys   = sys
        self.time  = [0,1,2,3,4,5]
        self.u     = [0,0,0,0,0,0]
        self.count = len(self.time)
        T, yout, _ = control.forced_response(self.sys, self.time, self.u)
        socketio.emit('process', {'T': T.tolist(), 'yout': yout.tolist(), 'uout': self.u}, room=self.sid)       

    def inc_count(self):
        self.count += 1

    def dec_count(self):
        self.count -= 1

    def reset_system(self, sys):
        self.__init__(sys)

    # The action and the system
    def step(self, action, sys):
        # Update time and action vectors
        self.time.append(self.count)
        self.u.append(action)

        # Evaluate and send response
        T, yout, uout = control.forced_response(self.sys, self.time, self.u)
        socketio.emit('process', {'T': T[-1].tolist(), 'yout': yout[-1].tolist(), 'uout': self.u[-1]}, room=self.sid)
        self.inc_count()

def background_thread(sid, sys):
    # Global variables for resets and actions
    clients[sid]['data']['reset']    = False
    clients[sid]['data']['action']   = 0
    clients[sid]['data']['sys']      = sys
    clients[sid]['data']['process']  = Process(clients[sid]['data']['sys'], sid)

    counter = 0
    MAX_STEP_LIMIT = 1000

    # Step through the process
    while True and (counter <= MAX_STEP_LIMIT):
        if (clients[sid]['data']['reset'] == False):
            clients[sid]['data']['process'].step(clients[sid]['data']['action'], clients[sid]['data']['sys'])
            socketio.sleep(0.5)
            counter += 1
        else:
            clients[sid]['data']['process'].reset_system(clients[sid]['data']['sys'])
            clients[sid]['data']['action'] = 0
            clients[sid]['data']['reset']  = False
            counter = 0

if __name__ == '__main__':
    socketio.run(app, debug=True)