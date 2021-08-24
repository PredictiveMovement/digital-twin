const perlin = require('perlin-noise')
const scaler = require('minmaxscaler');
const _chunk = require('lodash/chunk')
const _mean = require('lodash/mean')
const _sum = require('lodash/sum')
const _round = require('lodash/round')

const { from, shareReplay } = require('rxjs')

/**
 * Distributes a total number of orders over a number of given days.
 *
 * The distribution is based on perlin-noise, which then is simple used as 
 * the percentage for the distribution of the total orders over the given 
 * number of days.
 *
 * @param {Number} numberOfDays   Days to assign a number of orders
 * @param {Number} totalOrders    Number of orders to distribute over the number of days
 * @param {Object} perlinNoiseOpt Perlin-Noise options to influence the distribution
 *
 * @return {Array} Number of orders for each day
 */
function distributeNumberOfBookingsOverDays(numberOfDays, totalOrders, perlinNoiseOpt) {

    // TODO You can avoid many steps if you make sure that the lenght of the Perlin-Noise
    // array is = numberOfDays. I left all the code because of 'historical' reasons...

    var perlinNoise = perlin.generatePerlinNoise(
        perlinNoiseOpt.width,
        perlinNoiseOpt.height,
        perlinNoiseOpt.options)
    // TODO perlinNoise.length must be >= numberOfDays
    //console.log(`Perlin-Noise values:`)
    //console.log(perlinNoise)

    // perlinNoise.lenght needs to be = numberOfDays
    // instead of splicing, taking average of chunks and then splice the rest
    var chunkSize = Math.floor(perlinNoise.length / numberOfDays)
    perlinNoise = _chunk(perlinNoise, chunkSize)
    perlinNoise = perlinNoise.splice(0, numberOfDays)
    perlinNoise = Array.from(perlinNoise, (value, index) => _mean(value))
    //console.log(`Perlin-Noise values flatten to number of days:`)
    //console.log(perlinNoise)

    // it feels like min-max-scale reduces the rounding issue and get's closer to totalOrders
    perlinNoise = scaler.fit_transform(perlinNoise);
    //console.log(`Perlin-Noise values min-max scaled:`)
    //console.log(perlinNoise)

    // get number of orders for each day based on 'perlin percentages'
    const one_order = _sum(perlinNoise) / totalOrders
    // TODO Rounding can be an issue if too many roundings going in one direction (up or down).
    // Then the result will be far away from the total number. In practice, it seems okay and 
    // gives some kind of randomness in the total number.
    var orderDistribution = perlinNoise.map(x => _round(x / one_order))
    //console.log(`Orders based on the 'perlin percentages':`)
    //console.log(orderDistribution)
    //console.log(`Orders total: ${totalOrders} vs. distributed ${_sum(orderDistribution)} = ${_sum(orderDistribution) - totalOrders} `)

    return orderDistribution
}

/*
// play around with these options to influence the distribution
const numberOfDays = 265
const totalOrders = 1302332
const perlinNoiseOpt = {
    width: 45,
    height: 6,
    options: {
        amplitude: 0.9,
        octaveCount: 1,
        persistence: 0.1,
    }
}

const orderDistribution = distributeNumberOfBookingsOverDays(numberOfDays, totalOrders, perlinNoiseOpt)
const current_working_day = 3
console.log(orderDistribution[current_working_day])
// TODO The output should be plotted and analyzed to see if the distribution does make any sense.
*/

module.exports = {
    distributeNumberOfBookingsOverDays
}