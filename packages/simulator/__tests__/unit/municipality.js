const Municipality = require('../../lib/Municipality')
const { from } = require('rxjs')
const { first, map } = require('rxjs/operators')
const Booking = require('../../lib/booking')
const { virtualTime } = require('../../lib/virtualTime')

const dispatch = require('../../lib/dispatch/dispatchCentral')

jest.mock('../../lib/dispatch/dispatchCentral')

describe('A municipality', () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }
  const squares = from([])
  let fleets
  let municipality

  let testBooking = new Booking({
    pickup: arjeplog,
    destination: ljusdal,
  })

  beforeEach(() => {
    virtualTime.setTimeMultiplier(Infinity)
    fleets = [
      { name: 'postnord', marketshare: 1, numberOfCars: 1, hub: arjeplog },
    ]
    jest.clearAllMocks()
  })

  afterEach(() => {
    // municipality.dispose()
  })

  it('should initialize correctly', function (done) {
    municipality = new Municipality({ name: 'stockholm', squares, fleets })
    expect(municipality.name).toBe('stockholm')
    done()
  })

  it('dispatches handled bookings', function () {
    municipality = new Municipality({ name: 'stockholm', squares, fleets })
    municipality.handleBooking(testBooking)

    expect(dispatch.dispatch.mock.calls.length).toBe(1)
  })

  it.only('handled bookings are dispatched', function (done) {
    dispatch.dispatch.mockImplementation((cars, bookings) =>
      bookings.pipe(
        map((booking) => ({
          booking,
          car: { id: 1 },
        }))
      )
    )

    municipality = new Municipality({ name: 'stockholm', squares, fleets })
    municipality.handleBooking(testBooking)

    municipality.dispatchedBookings.pipe(first()).subscribe(({ booking }) => {
      expect(booking.fleet.name).toBe('bring')
      expect(booking.id).toBe(testBooking.id)
      done()
    })
  })
})
