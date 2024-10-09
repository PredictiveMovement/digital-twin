const { firstValueFrom, mergeMap, map, toArray, pipe } = require('rxjs')
const assert = require('assert')
const config = require('./config').read()

console.log('Checking for preconditions...', config)

const pick = (key) =>
  pipe(
    map((obj) => obj[key]),
    toArray()
  )

const precheck = async () => {
  console.log('Checking regions...')
  const regions = require('./streams/regions')(config)
  console.log('✅ Regions:', await firstValueFrom(regions.pipe(pick('name'))))

  console.log('Checking municipalities...')
  const municipalities = regions.pipe(
    mergeMap((region) => region.municipalities)
  )
  const recievedMuns = await firstValueFrom(municipalities.pipe(pick('name')))
  assert(recievedMuns.length > 0, '❌ No municipalities found')
  console.log('✅ Municipalities:', recievedMuns.join(', '))

  console.log('Checking fleets...')
  const fleets = municipalities.pipe(
    mergeMap((municipality) => municipality.fleets)
  )
  const recievedFleets = await firstValueFrom(fleets.pipe(pick('name')))
  assert(recievedFleets.length > 0, '❌ No fleets found')
  console.log('✅ Fleets:', recievedFleets.join(', '))

  console.log('Checking bookings...')
  const bookings = regions.pipe(mergeMap((region) => region.dispatchedBookings))
  const recievedBookings = await firstValueFrom(bookings.pipe(pick('id')))
  assert(recievedBookings.length > 0, '❌ No bookings found')
  console.log('✅ Bookings:', recievedBookings)

  console.log('Checking cars...')
  const cars = regions.pipe(mergeMap((region) => region.cars))
  const recievedCars = await firstValueFrom(cars.pipe(pick('id')))
  assert(recievedCars.length > 0, '❌ No cars found')
  console.log('✅ Cars:', recievedCars)
}

precheck()
