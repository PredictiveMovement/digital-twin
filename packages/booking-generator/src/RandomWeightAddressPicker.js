/**
 * Randomly selects a pickup and delivery address from the weight interval.
 */
export class RandomWeightAddressPicker {

    weights = null;
    pickup = null;
    delivery = null;

    constructor(fakeAddressStore) {
        this.fakeAddressStore = fakeAddressStore

        this.initWeights();
        this.setRandomPickupAddress();
        this.setRandomDeliveryAddress();
    }

    initWeights() {
        this.weights = Object.keys(this.fakeAddressStore.addresses)
            .map(key => this.fakeAddressStore.addresses[key].weight_scaled);
        //console.log(this.weights);
    }

    setRandomPickupAddress() {
        let random_interval = this.getRandomInterval();
        let random_index = this.getIndexFromInterval(random_interval);
        this.pickup = this.fakeAddressStore.addresses[random_index];
    }

    setRandomDeliveryAddress() {
        // TODO avoid same address for pick-up and delivery 
        let random_interval = this.getRandomInterval();
        let random_index = this.getIndexFromInterval(random_interval);
        this.delivery = this.fakeAddressStore.addresses[random_index];
    }

    getRandomInterval() {
        let random_interval = Math.random();
        return random_interval;
    }

    /**
     * Find the index value for the random interval. It's the next higher value in 
     * the list for the given interval value.
     * 
     * @param {float} random_interval 
     * @returns index of weight/street
     */
    getIndexFromInterval(random_interval) {
        //console.log("Search index for: " + random_interval)
        let random_index;

        for (let i = 0; i < this.weights.length; i++) {
            //console.log(i + ": " + this.weights[i])
            if (random_interval <= this.weights[i]) {
                random_index = i;
                //console.log("found index/value: " + random_index + ": " + this.weights[random_index])
                return random_index;
            }
        }
    }
}