var socket = io.connect('//' + document.domain + ':' + location.port);

// Logging messages
socket.on('connect', function() {
    console.log('Websocket connected!');
});

// Log rooms
socket.on('room_response', function(data) {
    console.log(data.message);
});


function increaseAction() {
  socket.emit('increase');
}
function decreaseAction() {
  socket.emit('decrease');
}    

Highcharts.setOptions({
    global: {
        useUTC: false
    }
});

// Create the chart
Highcharts.stockChart('graph', {
    chart: {
        events: {
            load: function () {
                var socket = io.connect('//' + document.domain + ':' + location.port);
                var process_series = this.series[0];
                var action_series = this.series[1];
                socket.on('process', function (sample) {
                    //update chart data
                    process_series.addPoint([(new Date()).getTime(), sample.yout], true, false);
                    action_series.addPoint([(new Date()).getTime(), sample.uout], true, false);
                });
            }
        }
    },
    rangeSelector: {
        selected: 5
    },    
    title: {
        text: 'Process data'
    },
    exporting: {
        enabled: false
    },
    tooltip: {
        valueDecimals: 2
    },
    yAxis: [
    {  // Primary yAxis - 1
        title: {
            text: 'Process Data'
        },
        labels: {
            align: 'right',
            x: -3
        },        
        height: '65%',
        lineWidth: 2,
        resize: {
            enabled: true
        }
    }, { // Secondary yAxis - 0
        title: {
            text: 'Actions',
        },
        labels: {
            align: 'right',
            x: -3
        },        
        top: '70%',
        height: '35%',
        offset: 0,
        lineWidth: 2
    }],
    series: [{
        name: 'Process',
        data: [],
        marker : {
            enabled : true,
            radius : 4
        }
    },{
        name: 'Actions',
        data: [],
        step: 'left',
        yAxis: 1
    }]
});

