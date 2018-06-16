from flask import Flask, render_template
from flask_socketio import SocketIO, join_room, emit
from flask import copy_current_request_context

import control
import numpy as np

from threading import Lock
thread = None
thread_lock = Lock()
action = None
sys = None
reset = None
init = None

# initialize Flask
app = Flask(__name__)
socketio = SocketIO(app)
ROOMS = {} # dict to track active rooms

@app.route('/')
def index():
    """Serve the index HTML"""
    return render_template('index.html')

@socketio.on('increase')
def increaseAction():
    global action
    action += 1
    emit('process', {'action': action})

@socketio.on('decrease')
def decreaseAction():
    global action
    action -= 1
    emit('process', {'action': action})

@socketio.on('update_tf')
def updateTf(data):
    global sys
    sys = control.tf(data[0], data[1])
    print('Update TF: ', data[0], data[1])
    emit('process', 'Updated TF')

    global reset
    global init
    if (init == True):
        reset = False
        global thread
        with thread_lock:
            if thread is None:
                thread = socketio.start_background_task(target=background_thread)
        emit('process', 'Starting simulator...')
        init = False
    else:
        reset = True

@socketio.on('connect', namespace='/')
def connect():
    global init
    init = True
    print('Client Connected')

def singleton(cls):
    instances = {}
    def getinstance():
        if cls not in instances:
            instances[cls] = cls()
        return instances[cls]
    return getinstance

class Process:
    def __init__(self, sys):
        self.sys   = sys
        self.time  = [0,1,2,3,4,5]
        self.u     = [0,0,0,0,0,0]
        self.count = len(self.time)
        T, yout, _ = control.forced_response(self.sys, self.time, self.u)
        socketio.emit('process', {'T': T.tolist(), 'yout': yout.tolist(), 'uout': self.u}, namespace='/')       

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
        socketio.emit('process', {'T': T[-1].tolist(), 'yout': yout[-1].tolist(), 'uout': self.u[-1]}, namespace='/')
        self.inc_count()


def background_thread():
    # Global variables for resets and actions
    global reset
    global sys
    global action
    action = 0

    # Create the process
    proc = Process(sys)

    counter = 0
    MAX_STEP_LIMIT = 1000

    # Step through the process
    while True and (counter <= MAX_STEP_LIMIT):
        if (reset == False):
            proc.step(action, sys)
            socketio.sleep(0.25)
            counter += 1
        else:
            proc.reset_system(sys)
            action = 0
            counter = 0
            reset = False

if __name__ == '__main__':
    socketio.run(app, debug=True)