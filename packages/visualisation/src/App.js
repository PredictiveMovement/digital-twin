import React, { useState, useEffect } from 'react'
import { useSocket } from './hooks/useSocket.js'
import Map from './Map.js'
import PlaybackOptions from './components/PlaybackOptions/index.js'
import Loading from './components/Loading/index.js'
import styled from 'styled-components'
import ResetIcon from './icons/svg/resetIcon.svg'
import TransparentButton from './components/TransparentButton/index.js'
import SideMenu from './components/SideMenu/index.js'
import WelcomeBox from './components/WelcomeBox/index.js'

const Wrapper = styled.div`
  position: absolute;
  z-index: 2;
  bottom: 3rem;
  left: 11.3rem;
`

const App = () => {
  const [activeCar, setActiveCar] = useState(null)
  const [reset, setReset] = useState(false)
  const [speed, setSpeed] = useState(60)
  const [time, setTime] = useState(-3600000) // 00:00
  const [carLayer, setCarLayer] = useState(true)
  const [busLayer, setBusLayer] = useState(true)
  const [taxiLayer, setTaxiLayer] = useState(true)
  const [busStopLayer, setBusStopLayer] = useState(true)
  const [passengerLayer, setPassengerLayer] = useState(true)
  const [postombudLayer, setPostombudLayer] = useState(false)
  const [measureStationsLayer, setMeasureStationsLayer] = useState(false)
  const [commercialAreasLayer, setCommercialAreasLayer] = useState(false)
  const [busLineLayer, setBusLineLayer] = useState(true)
  const [kommunLayer, setKommunLayer] = useState(true)
  const [newParameters, setNewParameters] = useState({})
  const [currentParameters, setCurrentParameters] = useState({})

  const { socket } = useSocket()

  const activeLayers = {
    carLayer,
    setCarLayer,
    busLayer,
    setBusLayer,
    postombudLayer,
    setPostombudLayer,
    measureStationsLayer,
    setMeasureStationsLayer,
    taxiLayer,
    setTaxiLayer,
    passengerLayer,
    setPassengerLayer,
    busStopLayer,
    setBusStopLayer,
    commercialAreasLayer,
    setCommercialAreasLayer,
    kommunLayer,
    setKommunLayer,
    setBusLineLayer,
    busLineLayer,
  }

  const newExperiment = (object) => {
    socket.emit('experimentParameters', newParameters)
  }

  useSocket('reset', () => {
    console.log('received reset')
    setBookings([])
    setPassengers([])
    setCars([])
    setKommuner([])
    setPostombud([])
    setMeasureStations([])
    setBusStops([])
    setLineShapes([])
    socket.emit('speed', speed) // reset speed on server
  })

  function upsert(array, object, idProperty = 'id', deep = false) {
    const currentIndex = array.findIndex(
      (k) => k[idProperty] === object[idProperty]
    )
    let new_arr = [...array]

    if (currentIndex >= 0) {
      if (deep) {
        new_arr[currentIndex] = { ...new_arr[currentIndex], ...object }
      } else {
        new_arr[currentIndex] = object
      }
    } else {
      new_arr.push(object)
    }
    return new_arr
  }

  const [cars, setCars] = React.useState([])
  useSocket('cars', (newCars) => {
    setReset(false)
    setCars((cars) => [
      ...cars.filter((car) => !newCars.some((nc) => nc.id === car.id)),
      ...newCars,
    ])
  })

  useSocket('time', (time) => {
    setTime(time)
  })

  const [bookings, setBookings] = React.useState([])
  useSocket('bookings', (newBookings) => {
    setReset(false)
    setBookings((bookings) => [
      ...bookings.filter(
        (booking) => !newBookings.some((nb) => nb.id === booking.id)
      ),
      ...newBookings.map(({ pickup, destination, ...rest }) => ({
        pickup: [pickup.lon, pickup.lat],
        destination: [destination.lon, destination.lat],
        ...rest,
      })),
    ])
  })

  const [postombud, setPostombud] = React.useState([])
  useSocket('postombud', (newPostombud) => {
    setReset(false)
    setPostombud((current) => [
      ...current,
      ...newPostombud.map(({ position, ...rest }) => ({
        position: [position.lon, position.lat],
        ...rest,
      })),
    ])
  })

  const [measureStations, setMeasureStations] = React.useState([])
  useSocket('measureStations', (newMeasureStations) => {
    setReset(false)
    setMeasureStations((current) => [
      ...current,
      ...newMeasureStations.map(({ position, ...rest }) => ({
        position: [position.lon, position.lat],
        count: 0,
        ...rest,
      })),
    ])
  })
  useSocket('measureStationUpdates', (stationUpdates) => {
    setMeasureStations((current) =>
      current.map((station) => {
        const stationIds = stationUpdates.map(({ stationId }) => stationId)
        if (stationIds.includes(station.id)) {
          return { ...station, count: station.count + 1 }
        }
        return station
      })
    )
  })

  const [busStops, setBusStops] = React.useState([])
  useSocket('busStops', (busStops) => {
    setReset(false)
    setBusStops(
      busStops.map(({ position, ...rest }) => ({
        position: [position.lon, position.lat].map((s) => parseFloat(s)),
        ...rest,
      }))
    )
  })

  const [lineShapes, setLineShapes] = React.useState([])
  useSocket('lineShapes', (lineShapes) => {
    setLineShapes(lineShapes)
  })

  const [kommuner, setKommuner] = React.useState([])
  useSocket('kommun', (kommun) => {
    setReset(false)
    setKommuner((current) => upsert(current, kommun, 'id', true))
  })

  useSocket('parameters', (currentParameters) => {
    console.log('new experimentId', currentParameters.id)

    setCurrentParameters(currentParameters)
    const layerSetFunctions = {
      buses: setBusLayer,
      cars: setCarLayer,
      busStops: setBusStopLayer,
      busLines: setBusLineLayer,
      passengers: setPassengerLayer,
      postombud: setPostombudLayer,
      measureStations: setMeasureStationsLayer,
      kommuner: setKommunLayer,
      commercialAreas: setCommercialAreasLayer,
    }

    Object.entries(layerSetFunctions).map(([emitterName, setStateFunction]) => {
      if (currentParameters.emitters.includes(emitterName)) {
        setStateFunction(true)
      } else {
        setStateFunction(false)
      }
    })

    setNewParameters(currentParameters)
  })
  const [passengers, setPassengers] = React.useState([])
  useSocket('passengers', (passengers) => {
    setPassengers((currentPassengers) => [
      ...currentPassengers.filter(
        (cp) => !passengers.some((p) => p.id === cp.id)
      ),
      ...passengers.map(({ position, ...p }) => ({
        ...p,
        position: [position.lon, position.lat].map((s) => parseFloat(s)),
      })),
    ])
  })

  const onPause = () => {
    socket.emit('pause')
    console.log('pause stream')
  }

  const onPlay = () => {
    setReset(false)
    socket.emit('play')
    console.log('play stream')
  }

  const onSpeedChange = (value) => {
    socket.emit('speed', value)
    setSpeed(value)
  }

  const resetSimulation = () => {
    setReset(true)
    socket.emit('reset')
    setBookings([])
    setPassengers([])
    setCars([])
    setActiveCar(null)
  }

  useEffect(resetSimulation, []) // Reset simulation on refresh

  return (
    <>
      <WelcomeBox />

      <Wrapper>
        <TransparentButton onClick={() => resetSimulation()}>
          <img src={ResetIcon} alt="Reset" />
        </TransparentButton>
      </Wrapper>
      <SideMenu
        activeLayers={activeLayers}
        currentParameters={currentParameters}
        newParameters={newParameters}
        newExperiment={newExperiment}
        setNewParameters={setNewParameters}
      />

      <PlaybackOptions
        onPause={onPause}
        onPlay={onPlay}
        onSpeedChange={onSpeedChange}
      />
      {(reset || !currentParameters.mapInitState) && <Loading />}
      {currentParameters.mapInitState && (
        <Map
          activeLayers={activeLayers}
          passengers={passengers}
          cars={cars}
          bookings={bookings}
          postombud={postombud}
          measureStations={measureStations}
          busStops={busStops}
          kommuner={kommuner}
          activeCar={activeCar}
          time={time}
          setActiveCar={setActiveCar}
          lineShapes={lineShapes}
          mapInitState={currentParameters.mapInitState}
        />
      )}
    </>
  )
}

export default App
