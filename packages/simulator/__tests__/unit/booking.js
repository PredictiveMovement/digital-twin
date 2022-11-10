const Booking = require('../../lib/models/booking')

describe('A booking', () => {
  const arjeplog = { lon: 17.886855, lat: 66.041054 }
  const ljusdal = { lon: 14.44681991219, lat: 61.59465992477 }
  const ljusdalToArjeplog = {
    pickup: {
      position: ljusdal,
    },
    destination: {
      position: arjeplog,
    },
  }
  let subject

  describe('should initialize correctly', function () {
    beforeEach(() => {
      subject = new Booking({id: 'b-1', ...ljusdalToArjeplog})
    })

    it('and have a correct id', () => {
      expect(subject.id).toBe('b-1')
    })

    it('and have a correct status', () => {
      expect(subject.status).toBe('New')
    })

    it('and have a correct position', () => {
      expect(subject.position).toBe(ljusdal)
    })

    it('and have a correct pickup', () => {
      expect(subject.pickup).toEqual(ljusdalToArjeplog.pickup)
    })

    it('and have a correct destination', () => {
      expect(subject.destination).toEqual(ljusdalToArjeplog.destination)
    })
  })
  describe('should validate initialization parameters', () => {
    it('and throw an error if pickup is missing', () => {
      expect(() => {
        new Booking({ id: 'b-1', destination: ljusdalToArjeplog.destination })
      }).toThrowError('Invalid booking - Missing pickup position')
    })

    it('and throw an error if destination is missing', () => {
      expect(() => {
        new Booking({ id: 'b-1', pickup: ljusdalToArjeplog.pickup })
      }).toThrowError('Invalid booking - Missing destination position')
    })
  })
})
