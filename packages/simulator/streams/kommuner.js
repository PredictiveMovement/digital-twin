/**
 * TODO: Describe the stream that this file exports and what its data means
 */
const EventEmitter = require('events')
const { from, shareReplay, Subject, ReplaySubject, withLatestFrom } = require('rxjs')
const { map, first, filter, scan, reduce } = require('rxjs/operators')
const data = require('../data/kommuner.json')
const population = require('./population')
const packageVolumes = require('./packageVolumes')
const postombud = require('./postombud')
const inside = require('point-in-polygon')
const commercialAreas = from(require('../data/scb_companyAreas.json').features)


function getPopulationSquares({ geometry: { coordinates } }) {
  return population.pipe(
    filter(({ position: { lon, lat } }) =>
      coordinates.some((coordinates) => inside([lon, lat], coordinates))
    ),
    map(({ position, population }) => ({ position, population })), // only keep the essentials to save memory
    shareReplay()
  )
}

function getCommercialAreas(kommun) {
  return commercialAreas.pipe(
    filter(area => area.properties.KOMMUNKOD === kommun.id),
    shareReplay()
  )
}


function getPostombud(kommun) {
  return postombud.pipe(
    filter((ombud) => kommun.name.startsWith(ombud.kommun)),
    shareReplay()
  )
}

class Kommun extends EventEmitter {
  constructor({ geometry, name, id, email, zip, telephone }) {
    super()
    this.geometry = geometry
    this.name = name
    this.id = id
    this.email = email
    this.zip = zip
    this.telephone = telephone
    this.unhandledBookings = new Subject()
    this.cars = new ReplaySubject()
    this.bookings = new ReplaySubject()
    this.squares = getPopulationSquares(this)
    this.fleets = [
      {
        name: 'Postnord',
        market: 0.6
      },
      {
        name: 'Schenker',
        market: 0.18
      },
      {
        name: 'Bring',
        market: 0.06
      },
      {
        name: 'DHL',
        market: 0.06
      }
    ]
    // don't we want reduce here?
    this.population = this.squares.pipe(reduce((a, b) => a + b.population, 0))
    this.packageVolumes = packageVolumes.find(e => this.name.startsWith(e.name))
    this.postombud = getPostombud(this)
    this.commercialAreas = getCommercialAreas(this)
  }
}

function read() {
  return from(data).pipe(
    map(
      ({ geometry, namn, epost, postnummer, telefon, kod, pickupPositions }) =>
        new Kommun({
          geometry,
          name: namn,
          id: kod,
          email: epost,
          zip: postnummer,
          telephone: telefon,
          pickupPositions: pickupPositions || []
        })
    ),
    shareReplay()
  )
}

const kommuner = (module.exports = read())


// kommuner.pipe(filter((k) => k.name === 'Arjeplogs kommun')).subscribe((kommun) => console.dir(kommun, { depth: null }))
//population.pipe(take(50)).subscribe(p => console.dir(p,  { depth: null }))

//console.log('inside?', inside([17.1181455372, 58.6721047703], kommun))
