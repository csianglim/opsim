var socket = io.connect('//' + document.domain + ':' + location.port);
// verify our websocket connection is established
socket.on('connect', function() {
    console.log('Websocket connected!');
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

    yAxis: [
    {  // Primary yAxis - 0
        title: {
            text: 'Process Data'
        },
        opposite: false
    }, { // Secondary yAxis - 1
        title: {
            text: 'Actions',
        },        
        opposite: true,
        min: -2,
        max: 2
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
        yAxis: 1
    }]
});

