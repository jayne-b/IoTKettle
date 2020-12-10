import React from 'react'

const clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8)

const host = 'wss://broker.emqx.io:8084/mqtt'
require('events').EventEmitter.defaultMaxListeners = 0

const options = {
    keepalive: 60,
    clientId: clientId,
    protocolId: 'MQTT',
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
    will: {
        topic: 'kettle/connected',
        payload: false,
        qos: 0,
        retain: false
    },
}
const mqtt = require('mqtt')
console.log('Connecting mqtt client')
const client = mqtt.connect(host, options)

client.on('error', (err) => {
    console.log('Connection error: ', err)
    client.end()
})

client.on('reconnect', () => {
    console.log('Reconnecting...')
})

var state = 'On'

client.on('connect', () => {
    client.subscribe('kettle/start', { qos: 0 })
    client.subscribe('kettle/heatTemp', { qos: 0 })
    client.subscribe('kettle/getWeight', { qos: 0 })
    client.subscribe('kettle/getTemp', { qos: 0 })
    client.publish('kettle/connected', 'true')
    client.publish('kettle/state', 'On')
    sendStateUpdate()
})

client.on('message', (topic, message) => {
    console.log('received message %s %s', topic, message)
    switch (topic) {
        case 'kettle/getTemp':
            return handleTempRequest(message)
        case 'kettle/getWeight':
            return handleWeightRequest(message)
        case 'kettle/start':
            return handleStartRequest(message)
        case 'kettle/heatTemp':
            return handleHeatTemp(message)
    }
})

function sendStateUpdate() {
    console.log('sending state %s', state)
    client.publish('kettle/state', state)
} 

function handleHeatTemp(message) {
    //set temp to heat
}

function handleTempRequest(message) {
    if (message === 'true') {
        console.log('getting current temperature')

        //send kettle temp data
        client.publish('kettle/temp', 'temp')
    }
}

function handleWeightRequest(message) {
    if (state !== 'boiling' && message === 'true') {
        state = 'Ready'
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
