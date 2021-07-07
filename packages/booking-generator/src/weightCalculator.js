import scaler from 'minmaxscaler';


/**
 * Calculates the sum of the weights for the addresses. It adds the sum as property 
 * 'weight' to the given addresses.
 * 
 * @param {FakeAddressStore} fakeAddressStore The addresses keeping s weight property.
 */
export function set_weight_sum(fakeAddressStore) {
    fakeAddressStore.addresses.forEach(function (address, index) {
        let weight_sum = 0;

        if (address.hasOwnProperty('weights')) {
            Object.keys(address.weights).forEach(function (weightKey, index) {
                let weightProperty = address.weights[weightKey];
                let weight = weightProperty.weight * weightProperty.factor;
                weight_sum = weight_sum + weight;
            });
        }

        address.weight = weight_sum;
    });
}


/**
 * Calculates the weights interval of for the addresses. It adds the interval as property 
 * 'weight_interval' to the given addresses.
 * 
 * @param {FakeAddressStore} fakeAddressStore The addresses keeping s weight property.
 */
export function set_weights_interval(fakeAddressStore) {
    let previous_weight_interval = 0;

    for (let index = 0; index < fakeAddressStore.addresses.length; ++index) {

        let weight = fakeAddressStore.addresses[index].weight;

        let weight_interval = previous_weight_interval + weight;
        fakeAddressStore.addresses[index].weight_interval = weight_interval

        previous_weight_interval = weight_interval;
    }
}


/**
 * Scale all weights to a range between 0-1. It adds the scaled weight as property 
 * 'weight_scaled' to the given addresses.
 * 
 * @param {FakeAddressStore} fakeAddressStore The addresses keeping a weight property.
 */
export function min_max_scale_weights_interval(fakeAddressStore) {

    let weights = []
    for (let index = 0; index < fakeAddressStore.addresses.length; ++index) {
        weights.push(fakeAddressStore.addresses[index].weight_interval)
    }

    // add 0 so that the first element has also a range from it's weight to 0
    weights.push(0);

    const weights_scaled = scaler.fit_transform(weights);

    for (let index = 0; index < fakeAddressStore.addresses.length; ++index) {
        fakeAddressStore.addresses[index].weight_scaled = weights_scaled[index]
    }
}
