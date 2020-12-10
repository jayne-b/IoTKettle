import React, { useState } from 'react';
import './App.css';
import greenTea from './Images/green tea.png'
import blackTea from './Images/black tea.png'
import coffeePic from './Images/coffee.png'
import whiteTea from './Images/white tea.png'
import oolongTea from './Images/oolong tea.png'
import manual from './Images/manual.png'
import Button from './Components/Button'
import Temperature from './Components/Temperature'
import State from './Components/State'
import Water from './Components/Water'
import start from './Images/start.png'

var connected = false
console.log('connected: ' + connected)

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
    topic: 'WillMsg',
    payload: 'Connection Closed abnormally..!',
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


client.on('connect', () => {
  console.log('Client connected:' + clientId)
  // Subscribe
  client.subscribe('kettle/connected', { qos: 0 })
  client.subscribe('kettle/state', { qos: 0 })
  client.subscribe('kettle/temp', { qos: 0 })
  client.subscribe('kettle/weight', { qos: 0 })
  client.publish('kettle/getTemp', 'true', { qos: 2 })
  client.publish('kettle/getWeight', 'true', { qos: 2 })
})

const App = () => {
  // states = on, off, ready, boiling
  const [kState, setKState] = useState('Off')
  const [currTemp, setCurrTemp] = useState(0)
  const [weight, setWeight] = useState(0)
  const [toHeat, setToHeat] = useState(0)
  const green = () => setToHeat(80)
  const black = () => setToHeat(100)
  const white = () => setToHeat(70)
  const coffee = () => setToHeat(94)
  const oolong = () => setToHeat(85)
  const manualTemp = () => {
    var manTemp = prompt("Enter the temperature: ")
    if (parseInt(manTemp) > currTemp && manTemp <= 100) {
      setToHeat(parseInt(manTemp))
    } else if (parseInt(manTemp) < currTemp) {
      alert("The entered temperature is lower than the current water temperature")
    } else if (parseInt(manTemp) > 100) {
      setToHeat(parseInt(100))
    }
  }

  client.on('message', (topic, message) => {
    switch (topic) {
      case 'kettle/connected':
        return handleKettleConnected(message)
      case 'kettle/state':
        return handleKettleState(message)
      case 'kettle/temp':
        return handleKettleTemp(message)
      case 'kettle/weight':
        return handleKettleWeight(message)
    }
    console.log('No handler for topic %s', topic)
  })

  function handleKettleWeight(message) {
    console.log('kettle weight received %s', message)
    setWeight(parseInt(message))
  }

  function handleKettleTemp(message) {
    console.log('kettle temp received %s', message)
    setCurrTemp(parseInt(message))
  }

  function handleKettleConnected(message) {
    connected = (message.toString() === 'true')
    console.log('kettle connected status %s', connected)
  }

  function handleKettleState(message) {
    setKState(message.toString())
    console.log('kettle state update to %s', message)
  }

  const startKettle = () => {
    if (connected) {
      if ((toHeat > currTemp) && (weight > 10)) {
        setKState('Ready')
        if (window.confirm("Are you sure you wish to heat the water to " + toHeat + "°C?")) {
          client.publish('kettle/heatTemp', toHeat.toString(), { qos: 2 })
          client.publish('kettle/start', 'true', { qos: 2 })
          console.log('start kettle')
        }
      } else if (toHeat <= currTemp) {
        alert("The water temperature is currently higher than the temperature you wish to heat the water to!")
      } else if (weight < 10) {
        alert("There currently isn't enough water in the kettle to safely heat")
      }
    } else {
      alert("No connection")
    }
  }


  return (
    <div className="App">
      <h1>IoT Kettle</h1>
      <Button handleClick={green} text='Green Tea' image={greenTea} />
      <Button handleClick={black} text='Black Tea' image={blackTea} />
      <Button handleClick={white} text='White Tea' image={whiteTea} />
      <Button handleClick={oolong} text='Oolong Tea' image={oolongTea} />
      <Button handleClick={coffee} text='Instant Coffee' image={coffeePic} />
      <Button handleClick={manualTemp} text='Set Temperature' image={manual} />
      <State text='Kettle state' value={kState} />
      <Temperature text='Current temp' value={currTemp} scale='°C' />
      <Temperature text='Set temp' value={toHeat} scale='°C' />
      <Water text='Water Level' value={weight} />
      <Button handleClick={startKettle} text='Start' image={start} />
    </div>
  );
}

export default App;
