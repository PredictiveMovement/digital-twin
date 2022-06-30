class Taxi {
  id
  position
  heading

  constructor({ id, position }) {
    this.id = id
    this.position = position
    this.heading = null
  }
  canPickupBooking() {}
  handleBooking() {}
}

module.exports = Taxi
