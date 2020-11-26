import React from 'react'

const mqtt = require('mqtt');
const options = {
    protocol: 'mqtts',
    // clientId uniquely identifies client
    // choose any string you wish
    clientId: 'numpties'
};
const client = mqtt.connect('mqtt://test.mosquitto.org:8081', options);

var kettleState = ''
var connected = false

client.on('connect', () => {
    client.subscribe('kettle/connected')
    client.subscribe('kettle/state')
})

client.on('message', (topic, message) => {
    switch (topic) {
        case 'kettle/connected':
            return handleKettleConnected(message)
        case 'kettle/state':
            return handleKettleState(message)
    }
    console.log('No handler for topic %s', topic)
})

function handleKettleConnected(message) {
    console.log('kettle connected status %s', message)
    connected = (message.toString() === 'true')
}

function handleKettleState(message) {
    kettleState = message
    console.log('kettle state update to %s', message)
}

function getTemp() {
    // can only get temp if we're connected to mqtt and kettle isn't off
    if (connected && kettleState !== 'off') {
        // Ask the kettle to send temp
        client.publish('garage/temp', 'true')
    }
}

function getWeight() {
    // can only get weight if we're connected to mqtt and kettle isn't off
    if (connected && kettleState !== 'off') {
        // Ask the kettle to send weight
        client.publish('kettle/weight', 'true')
    }
}

function startKettle() {
    // can only start the kettle if we're connected to mqtt and kettle is ready
    if (connected && kettleState === 'ready') {
        // Ask the kettle to start
        client.publish('kettle/start', 'true')
    }
}

//--- For Demo Purposes Only ----//

// simulate opening garage door
setTimeout(() => {
    console.log('open door')
    openGarageDoor()
}, 5000)

// simulate closing garage door
setTimeout(() => {
    console.log('close door')
    closeGarageDoor()
}, 20000)