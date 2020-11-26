import React from 'react'

const mqtt = require('mqtt');
const options = {
    protocol: 'mqtts',
    // clientId uniquely identifies client
    // choose any string you wish
    clientId: 'numpties'
};
const client = mqtt.connect('mqtt://test.mosquitto.org:8081', options);

var state = 'on'

client.on('connect', () => {
    client.subscribe('kettle/start')
    client.publish('kettle/connected', 'true')
    sendStateUpdate()
})

client.on('message', (topic, message) => {
    console.log('received message %s %s', topic, message)
    switch (topic) {
        case 'kettle/temp':
            return handleTempRequest(message)
        case 'kettle/weight':
            return handleWeightRequest(message)
        case 'kettle/start':
            return handleStartRequest(message)
    }
})

function sendStateUpdate() {
    console.log('sending state %s', state)
    client.publish('kettle/state', state)
}

function handleTempRequest(message) {
    if (state !== 'off' && message === 'true') {
        console.log('getting current temperature')
        state = 'on'
        sendStateUpdate()

        //send kettle temp data
        client.publish('kettle/temp', 'temp')
    }
}

function handleWeightRequest(message) {
    if (state !== 'off' && state !== 'boiling' && message === 'true') {
        state = 'ready'
        sendStateUpdate()

        //send kettle weight data
        client.publish('kettle/weight', 'weight')
    }
}

function handleStartRequest(message) {
    if (state === 'ready' && message === 'true') {
        state = 'boiling'
        sendStateUpdate()

        //start kettle boiling
    }
}

function handleAppExit(options, err) {
    if (err) {
        console.log(err.stack)
    }

    if (options.cleanup) {
        client.publish('kettle/connected', 'false')
    }

    if (options.exit) {
        process.exit()
    }
}

/**
 * Handle the different ways an application can shutdown
 */
process.on('exit', handleAppExit.bind(null, {
    cleanup: true
}))
process.on('SIGINT', handleAppExit.bind(null, {
    exit: true
}))
process.on('uncaughtException', handleAppExit.bind(null, {
    exit: true
}))