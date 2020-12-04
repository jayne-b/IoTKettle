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
import Water from './Components/Water'
import start from './Images/start.png'

const mqtt = require('mqtt');
const options = {
  protocol: 'mqtts',
  clientId: 'numpties',
  username: 'iot kettle',
  password: 'iconic'
};
const client = mqtt.connect('mqtt://mqtt.beebotte.com:8883',
  { username: 'token:token_ZDqPMfay586vK53E', password: '' });

// states = on, off, ready, boiling
var kettleState = ''
var connected = false

const App = () => {
  const [currTemp, setCurrTemp] = useState(10)
  const [weight, setWeight] = useState(0)
  const [toHeat, setToHeat] = useState(0)
  const green = () => setToHeat(80)
  const black = () => setToHeat(100)
  const white = () => setToHeat(70)
  const coffee = () => setToHeat(94)
  const oolong = () => setToHeat(85)
  const manualTemp = () => {
    var manTemp = prompt("Enter the temperature: ")
    if (manTemp > currTemp && manTemp <= 100) {
      setToHeat(manTemp)
    } else if (manTemp < currTemp) {
      alert("The entered temperature is lower than the current water temperature")
    } else if (manTemp > 100) {
      setToHeat(100)
    }
  }


  client.on('connect', () => {
    client.subscribe('kettle/connected')
    client.subscribe('kettle/state')
    client.subscribe('kettle/temp')
    client.subscribe('kettle/weight')
  })

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
    setWeight(message)
  }

  function handleKettleTemp(message) {
    console.log('kettle temp received %s', message)
    setCurrTemp(message)
  }

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
      client.publish('kettle/temp', 'true')
    }
  }

  function getWeight() {
    // can only get weight if we're connected to mqtt and kettle isn't off
    if (connected && kettleState !== 'off') {
      // Ask the kettle to send weight
      client.publish('kettle/weight', 'true')
    }
  }

  const startKettle = () => {
    // can only start the kettle if we're connected to mqtt and kettle is ready
    if (kettleState !== 'ready') {
      setWeight(getWeight())
      setCurrTemp(getTemp())
      if ((toHeat > currTemp) && (weight > 10)) {
        kettleState = 'ready'
      } else if (toHeat <= currTemp) {
        alert("The water temperature is currently higher than the temperature you wish to heat the water to!")
      } else if (weight < 10) {
        alert("There currently isn't enough water in the kettle to safely heat")
      }
    }
    if (connected && kettleState === 'ready') {
      // Ask the kettle to start
      if (window.confirm("Are you sure you wish to heat the water to %s?", toHeat)) {
        client.publish('kettle/start', '%s', toHeat)
        client.publish('kettle/start', 'true')
        console.log('start kettle')
      }
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
      <Temperature text='Current temp' value={currTemp} scale='°C' />
      <Temperature text='Set temp' value={toHeat} scale='°C' />
      <Water text='Water Level' value={weight} />
      <Button handleClick={startKettle} text='Start' image={start} />
    </div>
  );
}

export default App;
