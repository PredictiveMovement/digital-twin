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

  useEffect(() => {
    socket.emit('carLayer', activeLayers.carLayer)
  }, [activeLayers.carLayer])

  useEffect(() => {
    socket.emit('taxiUpdatesToggle', activeLayers.taxiLayer)
  }, [activeLayers.taxiLayer])

  useEffect(() => {
    socket.emit('busUpdatesToggle', activeLayers.busLayer)
  }, [activeLayers.busLayer])

  useSocket('reset', () => {
    console.log('received reset')
    setBookings([])
    setTaxis([])
    setPassengers([])
    setCars([])
    setKommuner([])
    setPostombud([])
    setBusStops([])
    setLineShapes([])
    socket.emit('speed', speed) // reset speed on server
  })

  function upsert(array, object, idProperty = 'id') {
    const currentIndex = array.findIndex(
      (k) => k[idProperty] === object[idProperty]
    )
    let new_arr = [...array]

    if (currentIndex >= 0) {
      new_arr[currentIndex] = object
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
      ...newCars.map(
        ({
          id,
          co2,
          distance,
          heading,
          bearing,
          position,
          fleet,
          cargo,
          capacity,
          lineNumber,
          queue,
          vehicleType,
        }) => ({
          id,
          co2,
          distance,
          heading,
          bearing,
          position,
          fleet,
          cargo,
          capacity,
          lineNumber,
          queue,
          vehicleType,
        })
      ),
    ])
  })

  useSocket('time', (time) => {
    setTime(time)
  })

  const [bookings, setBookings] = React.useState([])
  useSocket('bookings', (newBookings) => {
    setBookings((bookings) => [
      ...bookings.filter(
        (booking) => !newBookings.some((nb) => nb.id === booking.id)
      ),
      ...newBookings.map(
        ({
          name,
          id,
          pickup,
          destination,
          status,
          isCommercial,
          deliveryTime,
          carId,
          co2,
          cost,
        }) => ({
          id,
          address: name,
          status,
          co2,
          cost,
          isCommercial,
          pickup: [pickup.lon, pickup.lat],
          destination: [destination.lon, destination.lat],
          carId,
          deliveryTime,
        })
      ),
    ])
  })

  const [postombud, setPostombud] = React.useState([])
  useSocket('postombud', (newPostombud) => {
    setPostombud((current) => [
      ...current,
      ...newPostombud.map(({ id, operator, position }) => ({
        position: [position.lon, position.lat],
        operator,
        id,
      })),
    ])
  })

  const [busStops, setBusStops] = React.useState([])
  useSocket('busStops', ({ position, name }) => {
    setBusStops((current) => [
      ...current,
      {
        name,
        position: [position.lon, position.lat].map((s) => parseFloat(s)),
      },
    ])
  })

  const [lineShapes, setLineShapes] = React.useState([])
  useSocket('lineShapes', ({ stops, lineNumber }) => {
    setLineShapes((current) => [
      ...current,
      {
        lineNumber,
        stops,
      },
    ])
  })

  const [kommuner, setKommuner] = React.useState([])
  useSocket('kommun', (kommun) => {
    setKommuner((current) => upsert(current, kommun, 'id'))
  })

  useSocket('parameters', (currentParameters) => {
    setCurrentParameters(currentParameters)
    setNewParameters(currentParameters)
  })
  const [passengers, setPassengers] = React.useState([])
  useSocket('passenger', ({ name, position, id, inCar, distance }) => {
    setPassengers((currentPassengers) =>
      upsert(
        currentPassengers,
        {
          id,
          distance,
          name,
          position: [position.lon, position.lat].map((s) => parseFloat(s)),
          inCar,
        },
        'id'
      )
    )
  })
  const [taxis, setTaxis] = React.useState([])
  useSocket('taxi', ({ name, position, id }) => {
    console.log({ name, position, id })
    setTaxis((currenttaxis) =>
      upsert(
        currenttaxis,
        {
          id,
          name,
          position,
        },
        'id'
      )
    )
  })

  const onPause = () => {
    socket.emit('pause')
    console.log('pause stream')
  }

  const onPlay = () => {
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
    setTaxis([])
    setCars([])
    setKommuner([])
    setPostombud([])
    setBusStops([])
    setActiveCar(null)
  }

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
      {reset && <Loading />}
      <Map
        activeLayers={activeLayers}
        passengers={passengers}
        taxis={taxis}
        cars={cars}
        bookings={bookings}
        hubs={postombud}
        busStops={busStops}
        kommuner={kommuner}
        activeCar={activeCar}
        time={time}
        setActiveCar={setActiveCar}
        lineShapes={lineShapes}
      />
    </>
  )
}

export default App
