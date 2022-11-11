const Kommun = require('../../lib/Kommun')
const { from, lastValueFrom, ReplaySubject } = require('rxjs')
const { first, map } = require('rxjs/operators')
const Booking = require('../../lib/models/booking')
const { virtualTime } = require('../../lib/virtualTime')

const dispatch = require('../../lib/dispatch/dispatchCentral')

jest.mock('../../lib/dispatch/dispatchCentral')

const range = (length) => Array.from({ length }).map((_, i) => i)

describe('A kommun', () => {
  const arjeplog = { position: { lon: 17.886855, lat: 66.041054 } }
  const ljusdal = { position: { lon: 14.44681991219, lat: 61.59465992477 } }
  const squares = from([])
  let fleets
  let kommun

  let arjeplogToLjusdal = new Booking({
    pickup: arjeplog,
    destination: ljusdal,
  })

  beforeEach(() => {
    virtualTime.setTimeMultiplier(Infinity)
    fleets = [
      {
        name: 'postnord',
        marketshare: 1,
        numberOfCars: 1,
        hub: arjeplog,
        dispatchedBookings: new ReplaySubject(),
      },
    ]
    jest.clearAllMocks()
  })

  afterEach(() => {
    // kommun.dispose()
  })

  it('should initialize correctly', function (done) {
    kommun = new Kommun({ name: 'stockholm', squares, fleets })
    expect(kommun.name).toBe('stockholm')
    done()
  })

  it('dispatches handled bookings', function () {
    kommun = new Kommun({ name: 'stockholm', squares, fleets })
    kommun.handleBooking(arjeplogToLjusdal)

    expect(dispatch.dispatch.mock.calls.length).toBe(1)
  })

  it.only('handled bookings are dispatched', function (done) {
    kommun = new Kommun({ name: 'stockholm', squares, fleets })

    dispatch.dispatch.mockImplementation((cars, bookings) =>
      bookings.pipe(
        map((booking) => ({
          booking,
          car: { id: 1 },
        }))
      )
    )

    kommun.handleBooking(arjeplogToLjusdal)

    kommun.dispatchedBookings.pipe(first()).subscribe(({ booking }) => {
      expect(booking.fleet.name).toBe('bring')
      expect(booking.id).toBe(arjeplogToLjusdal.id)
      done()
    })
  })
})
