import React, { useState, useEffect } from 'react';
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
import graph from './Images/graph.png'
import Dropdown from 'react-dropdown'
import 'react-dropdown/style.css'

//console.log('connected: ' + connected)

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
  client.subscribe('Kettle/Connected', { qos: 2 })
  client.subscribe('Kettle/State', { qos: 2 })
  client.subscribe('Kettle/Temperature', { qos: 2 })
  client.subscribe('Kettle/Weight', { qos: 2 })
})

const App = () => {
  const [currTemp, setCurrTemp] = useState(0)
  const [weight, setWeight] = useState(0)
  const [toHeat, setToHeat] = useState(0)
  // states = on, off, ready, boiling
  const [state, setState] = useState('Off')
  const [song, setSong] = useState(0)
  const green = () => setToHeat(80)
  const black = () => setToHeat(100)
  const white = () => setToHeat(70)
  const coffee = () => setToHeat(94)
  const oolong = () => setToHeat(85)
  const manualTemp = () => {
    var manTemp = prompt("Enter the temperature: ")
    if (parseInt(manTemp) > currTemp && manTemp <= 100) {
      setToHeat(manTemp)
    } else if (manTemp < currTemp) {
      alert("The entered temperature is lower than the current water temperature")
    } else if (parseInt(manTemp) > 100) {
      setToHeat(100)
    }
  }

  const songOptions = [
    'Default', 'FF Victory', 'Song of Time', 'Super Mario Theme'
  ];
  const defaultOption = songOptions[0];

  useEffect(() => {
    const listener = (topic, message) => {
      switch (topic) {
        case 'Kettle/Connected':
          return handleKettleConnected(message)
        case 'Kettle/State':
          return handleKettleState(message)
        case 'Kettle/Temperature':
          return handleKettleTemp(message)
        case 'Kettle/Weight':
          return handleKettleWeight(message)

        default:
          console.log('No handler for topic %s', topic)
      }
    }

    client.on('message', listener)
    return () => {
      client.removeListener('message', listener)
    }
  });


  function handleKettleWeight(message) {
    if (parseInt(message) !== weight && state !== 'Off') {
      console.log('kettle weight received %s', parseInt(message), weight)
      setWeight(parseInt(message))
    }
  }

  function handleKettleTemp(message) {
    if (currTemp !== parseInt(message) && state !== 'Off') {
      console.log('kettle temp received %s', parseInt(message), currTemp)
      setCurrTemp(parseInt(message))
    }
  }

  function handleKettleConnected(message) {
    if (parseInt(message) === 1) {
      setState('On')
    } else if (parseInt(message) === 0) {
      setState('Off')
    }
    console.log('kettle connected status %s', state)
  }

  function handleKettleState(message) {
    if (parseInt(message) === 1) {
      setState('Boiling')
    } else {
      setState('On')
    }
    console.log('kettle state update to %s', message)
  }

  const onChange = option => {
    setSong(songOptions.indexOf(option.value, 0))
    console.log('song choice %d', song)
  }

  const startKettle = () => {
    if (state !== 'Off') {
      if (state === 'Boiling') {
        alert("The kettle is already heating!")
      } else {
        if ((toHeat > currTemp) && (weight > 10)) {
          setState('Ready')
          if (window.confirm("Are you sure you wish to heat the water to " + toHeat + "°C?")) {
            client.publish('Kettle/HeatTemp', toHeat.toString())
            client.publish('Kettle/Song', song.toString())
            console.log('song %d', song)
            console.log('start kettle')
          }
        } else if (toHeat <= currTemp) {
          alert("The water temperature is currently higher than the temperature you wish to heat the water to!")
        } else if (weight < 1430 && weight > 1275) {
          alert("There currently isn't enough water in the kettle to safely heat")
        } else if (weight < 1260) {
          alert("The kettle isn't on the base!")
        }
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
      <State text='Kettle state' value={state} />
      <Temperature text='Current temp' value={currTemp} scale='°C' />
      <Temperature text='Set temp' value={toHeat} scale='°C' />
      <Water text='Water Level' value={weight} />
      <b>Choose song: </b><br />
      <Dropdown options={songOptions} onChange={onChange} value={defaultOption} placeholder="Choose Song" /><br />
      <Button handleClick={startKettle} text='Start' image={start} />
      <p align="left">--Telemetry--<br />
        <a href='https://iot-kettle.herokuapp.com/telemetry'
          rel="noopener noreferrer" target="_blank"><img src={graph} alt="Telemetry"></img></a></p>
    </div>

  );
}

export default App;
