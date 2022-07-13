const Vehicle = require('./vehicle')

class Car extends Vehicle {
  constructor(args) {
    super(args)
    this.vechicleType = 'car'
  }
}

module.exports = Car
