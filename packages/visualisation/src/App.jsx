import React, { useState } from 'react'
import 'jsoneditor-react/es/editor.min.css'
import { useSocket } from './hooks/useSocket.js'

import Map from './Map.jsx'
import Loading from './components/Loading'
import PlaybackOptions from './components/PlaybackOptions'
import ResetExperiment from './components/ResetExperiment'
import EditExperimentModal from './components/EditExperimentModal'
import Logo from './components/Logo'
import ExperimentDoneModal from './components/ExperimentDoneModal/index.jsx'
import { Snackbar, SnackbarContent } from '@mui/material'

import Slide from '@mui/material/Slide'

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
  const [recycleCollectionLayer, setRecycleCollectionLayer] = useState(false)
  const [commercialAreasLayer, setCommercialAreasLayer] = useState(false)
  const [busLineLayer, setBusLineLayer] = useState(true)
  const [municipalityLayer, setMunicipalityLayer] = useState(true)
  const [experimentParameters, setExperimentParameters] = useState({})
  const [currentParameters, setCurrentParameters] = useState({})
  const [fleets, setFleets] = useState({})
  const [latestLogMessage, setLatestLogMessage] = useState('')
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [showEditExperimentModal, setShowEditExperimentModal] = useState(false)
  const [showExperimentDoneModal, setShowExperimentDoneModal] = useState(false)
  const [previousExperimentId, setPreviousExperimentId] = useState(null)

  const [connected, setConnected] = useState(false)

  const { socket } = useSocket()

  const activeLayers = {
    carLayer,
    setCarLayer,
    busLayer,
    setBusLayer,
    postombudLayer,
    setPostombudLayer,
    recycleCollectionLayer,
    setRecycleCollectionLayer,
    taxiLayer,
    setTaxiLayer,
    passengerLayer,
    setPassengerLayer,
    busStopLayer,
    setBusStopLayer,
    commercialAreasLayer,
    setCommercialAreasLayer,
    municipalityLayer,
    setMunicipalityLayer,
    busLineLayer,
    setBusLineLayer,
  }

  const restartSimulation = () => {
    setShowEditExperimentModal(false)
    socket.emit('experimentParameters', experimentParameters)
  }

  useSocket('init', () => {
    console.log('Init experiment')
    setBookings([])
    setPassengers([])
    setCars([])
    setmunicipalities([])
    setPostombud([])
    setRecycleCollection([])
    setBusStops([])
    setLineShapes([])
    setLatestLogMessage('')
    socket.emit('speed', speed) // reset speed on server
  })

  useSocket('reset', () => {
    console.log('Reset experiment')
    setPreviousExperimentId(experimentParameters.id)
    setShowExperimentDoneModal(true)
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

  useSocket('log', (message) => {
    setLatestLogMessage(message)
    setSnackbarOpen(true)
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

  const [recycleCollectionPoints, setRecycleCollection] = React.useState([])
  useSocket('recycleCollection', (newRecycleCollectionPoints) => {
    setReset(false)
    setRecycleCollection((current) => [
      ...current,
      ...newRecycleCollectionPoints.map(({ position, ...rest }) => ({
        position: [position.lon, position.lat],
        ...rest,
      })),
    ])
  })

  useSocket('recycleCollectionUpdates', (recycleCollectionUpdates) => {
    setRecycleCollection((current) =>
      current.map((recycleCollectionPoint) => {
        const recycleCollectionIds = recycleCollectionUpdates.map(
          ({ recycleCollectionId }) => recycleCollectionId
        )
        if (recycleCollectionIds.includes(recycleCollectionPoint.id)) {
          return {
            ...recycleCollectionPoint,
            count: recycleCollectionPoint.count + 1,
          }
        }
        return recycleCollectionPoint
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

  const [municipalities, setmunicipalities] = React.useState([])
  useSocket('municipality', (municipality) => {
    setReset(false)
    setmunicipalities((current) => {
      console.log('Received municipality data:', municipality)
      return upsert(current, municipality, 'id', true)
    })
  })

  useSocket('parameters', (currentParameters) => {
    console.log('ExperimentId', currentParameters.id)

    if (!previousExperimentId) {
      setPreviousExperimentId(currentParameters.id)
    }

    setCurrentParameters(currentParameters)
    const layerSetFunctions = {
      buses: setBusLayer,
      cars: setCarLayer,
      busStops: setBusStopLayer,
      busLines: setBusLineLayer,
      passengers: setPassengerLayer,
      postombud: setPostombudLayer,
      recycleCollection: setRecycleCollectionLayer,
      municipalities: setMunicipalityLayer,
      commercialAreas: setCommercialAreasLayer,
    }

    Object.entries(layerSetFunctions).map(([emitterName, setStateFunction]) => {
      if (currentParameters.emitters.includes(emitterName)) {
        setStateFunction(true)
      } else {
        setStateFunction(false)
      }
    })

    setFleets(currentParameters.fleets)
    setExperimentParameters(currentParameters)

    console.log('Received parameters:', currentParameters)
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

  socket.on('disconnect', () => {
    setConnected(false)
  })

  socket.on('connect', () => {
    setConnected(true)
  })

  /**
   * Update the fleets part of the parameters.
   */
  const saveFleets = (updatedJson) => {
    setExperimentParameters({ ...experimentParameters, fleets: updatedJson })
  }

  return (
    <>
      <Logo />

      {/* Loader. */}
      {(!connected || reset || !cars.length || !bookings.length) && (
        <Loading
          connected={connected}
          passengers={passengers.length}
          cars={cars.length}
          bookings={bookings.length}
          busStops={busStops.length}
          municipalities={municipalities.length}
          lineShapes={lineShapes.length}
          parameters={currentParameters}
        />
      )}

      {/* Playback controls. */}
      <PlaybackOptions
        onPause={onPause}
        onPlay={onPlay}
        onSpeedChange={onSpeedChange}
      />

      {/* Reset experiment button. */}
      <ResetExperiment resetSimulation={resetSimulation} />

      {/* Edit experiment modal. */}
      <EditExperimentModal
        fleets={fleets}
        show={showEditExperimentModal}
        setShow={setShowEditExperimentModal}
        restartSimulation={restartSimulation}
        saveFleets={saveFleets}
      />

      {/* Experiment done modal. */}
      <ExperimentDoneModal
        experimentId={previousExperimentId}
        show={showExperimentDoneModal}
        setShow={setShowExperimentDoneModal}
      />

      {/* Map. */}
      {currentParameters.initMapState && (
        <Map
          activeLayers={activeLayers}
          passengers={passengers}
          cars={cars}
          bookings={bookings}
          postombud={postombud}
          recycleCollectionPoints={recycleCollectionPoints}
          busStops={busStops}
          municipalities={municipalities}
          activeCar={activeCar}
          time={time}
          setActiveCar={setActiveCar}
          lineShapes={lineShapes}
          showEditExperimentModal={showEditExperimentModal}
          setShowEditExperimentModal={setShowEditExperimentModal}
          experimentId={currentParameters.id}
          initMapState={currentParameters.initMapState}
        />
      )}

      <Snackbar
        sx={{ opacity: 0.8 }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        variant="filled"
        open={snackbarOpen}
        autoHideDuration={3000}
        TransitionComponent={TransitionDown}
        onClose={() => setSnackbarOpen(false)}
      >
        <SnackbarContent
          sx={{ backgroundColor: 'black', color: 'white' }}
          message={latestLogMessage}
        />
      </Snackbar>
    </>
  )
}

function TransitionDown(props) {
  return <Slide {...props} direction="down" />
}
export default App
