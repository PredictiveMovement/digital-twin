const Car = require('./car')
const Drone = require('./drone')
const packagesPerPallet = 30 // this is a guesstimate

const vehicleTypes = {
  "tungLastbil": {
    weight: 26 * 1000,
    capacity: 48 * packagesPerPallet,
    profile: "small_truck",
    class: Car
  }, 
  "medeltungLastbil": {
    weight: 16.5 * 1000,
    capacity: 18 * packagesPerPallet,
    profile: "small_truck",
    class: Car
  }, 
  "lättLastbil": {
    weight: 3.5 * 1000,
    capacity: 8 * packagesPerPallet, // TODO: is this number of pallets reasonable?
    profile: "small_truck",
    class: Car
  }, 
  "bil": {
    weight: 1.5 * 1000,
    capacity: 25,
    profile: "small_truck",
    class: Car
  },
  "drönare": {
    weight: 5,
    capacity: 1,
    profile: "airplane",
    class: Drone
  }
}

module.exports = {vehicleTypes}