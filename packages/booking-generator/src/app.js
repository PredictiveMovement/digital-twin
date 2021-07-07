import { FakeAddressStore } from './FakeAddressStore.js';
import { calculate_weights_example_a, calculate_weights_example_b } from './weightProperties.js';
import { set_weight_sum, set_weights_interval, min_max_scale_weights_interval } from './weightCalculator.js';
import { RandomWeightAddressPicker } from './RandomWeightAddressPicker.js';


// TODO This is just some dummy code showing the idea. Depending on the needed performance 
// -e.g. millions of addresses- it has to be optimized (I guess).

console.log("A dummy example to generate the next booking based on weighted addresses.");



// --- read in and filter addresses you want to generate bookings for
let county;
//county = "Stockholms län";
county = "Norrbotten";

let fakeAddressStore = new FakeAddressStore().load_for_county(county);
//console.log(fakeAddressStore.addresses)



// --- calculate weights for addresses
// Here you can write any logic to give weights to addresses.
// Weights have influence on the probability where the next booking will be.
calculate_weights_example_a(fakeAddressStore)
calculate_weights_example_b(fakeAddressStore)

//console.log(fakeAddressStore.addresses)
//console.log(fakeAddressStore.addresses[0].weights)



// --- calculate the weights intervals
set_weight_sum(fakeAddressStore)
set_weights_interval(fakeAddressStore)
min_max_scale_weights_interval(fakeAddressStore);

console.log(fakeAddressStore.addresses)



// --- pick the next addresses to generate a booking for
let randomWeightAddressPicker = new RandomWeightAddressPicker(fakeAddressStore)
console.log("Pick-Up: \n", randomWeightAddressPicker.pickup)
console.log("Delivery: \n", randomWeightAddressPicker.delivery)



// --- generate a booking from the picked addresses
// TODO
