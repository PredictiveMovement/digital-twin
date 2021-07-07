
/*
 * Just some dummy functions to calculate different weights.
 * Weights calculation is very complex and can depend on many data sources.
 * This way it's possible to write any function for a weight calculator.
 */


export function calculate_weights_example_a(fakeAddressStore) {
    let factor = Math.floor(Math.random() * 3) + 1;

    fakeAddressStore.addresses.forEach(function (address, index) {

        if (!address.hasOwnProperty('weights')) {
            address.weights = {};
        }

        let weight = {
            "weight": Math.floor(Math.random() * 10),
            "factor": factor
        };
        address.weights['example_weight_a'] = weight;
    });
}


export function calculate_weights_example_b(fakeAddressStore) {
    let factor = 1;
    let counter = 0

    fakeAddressStore.addresses.forEach(function (address, index) {
        counter++;

        if (!address.hasOwnProperty('weights')) {
            address.weights = {};
        }

        let weight = {
            "weight": counter,
            "factor": factor
        };
        address.weights['example_weight_b'] = weight;
    });
}
