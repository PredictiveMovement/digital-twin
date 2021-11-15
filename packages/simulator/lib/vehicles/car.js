const Vehicle = require("./vehicle")

class Car extends Vehicle {
  constructor(args) {
    super(args)
    this.type = 'car'
  }
}

module.exports = Car