const Fleet = require('../../lib/fleet')
const { from, lastValueFrom } = require('rxjs')
const { first, take, toArray } = require('rxjs/operators')
const Booking = require('../../lib/models/booking')
const { virtualTime } = require('../../lib/virtualTime')

const dispatch = require('../../lib/dispatch/dispatchCentral')

jest.mock('../../lib/dispatch/dispatchCentral')

const range = (length) => Array.from({ length }).map((_, i) => i)

describe.skip('A fleet', () => {
  const arjeplog = { position: { lon: 17.886855, lat: 66.041054 } }
  const ljusdal = { position: { lon: 14.44681991219, lat: 61.59465992477 } }
  let fleet

  let arjeplogToLjusdal = new Booking({
    pickup: arjeplog,
    destination: ljusdal,
  })

  beforeEach(() => {
    dispatch.dispatch.mockImplementation((cars, bookings) => from([]))
    virtualTime.setTimeMultiplier(Infinity)
    jest.clearAllMocks()
  })

  afterEach(() => {
    // fleet.dispose()
  })

  it('should initialize correctly', function (done) {
    fleet = new Fleet({
      name: 'postnord',
      marketshare: 1,
      numberOfCars: 1,
      hub: arjeplog,
    })
    expect(fleet.name).toHaveLength(8)
    done()
  })

  it('dispatches handled bookings', function () {
    fleet = new Fleet({
      name: 'postnord',
      marketshare: 1,
      numberOfCars: 1,
      hub: arjeplog.position,
    })
    fleet.handleBooking(arjeplogToLjusdal)

    expect(dispatch.dispatch.mock.calls.length).toBe(1)
  })

  it('handled bookings are dispatched', function () {
    dispatch.dispatch.mockImplementation((cars, bookings) =>
      from([
        {
          booking: arjeplogToLjusdal,
          car: { id: 1 },
        },
      ])
    )

    fleet = new Fleet({
      name: 'postnord',
      marketshare: 1,
      numberOfCars: 1,
      hub: arjeplog.position,
    })
    fleet.handleBooking(arjeplogToLjusdal)

    fleet.dispatchedBookings.pipe(first()).subscribe(({ booking }) => {
      expect(booking.id).toBe(arjeplogToLjusdal.id)
    })
  })
})
