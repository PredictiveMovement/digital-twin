Booking engine proof of concept
===============================


## Goals

1. Test how much work that is needed to create a state of the art routing engine
2. Verify OSRM as an alternative to Google Maps
3. How many bookings per second can be handled with a custom built engine?
4. Find new unknowns

## Setup

This PoC uses a routing engine based on Open Street Database. https://github.com/Project-OSRM/osrm-backend/wiki/Server-api

To start the engine, just run:

    docker-compose up

IMPORTANT! It will take about five minutes the first time to download the latest maps and calculate the in-memory model. The server is very bad at giving progress report so please give it some time before aborting the progress.

## Tests

A very rudementary set of tests are set up. To run them:

    npm run watch

or just once:

    npm test

## Concepts

The idea uses two streams of events to simulate a real world scenario:

1. Cars. 1650 simulated taxis driving in Stockholm. They move in random direction two times every second.
2. Bookings. Two new bookings on random addresses every second.

## Flow

The idea is to create an engine and dispatch mechanism that can:

1. Handle all bookings and pre-bookings in realtime
2. Find the x closest cars
3. Set up a virtual perimiter of x driving minutes to the booking position
4. Select the best suitable car of those wihin that perimiter
5. Suitable car should be both from the drivers perspective* and the customer*
6. The suitable cars should be offered the booking with the option to reject the booking
7. Within seconds the average booking should be assigned a car and an estimated time of arrival

## Suitable cars

To select a suitable car, these rules should be evaluated:

1. Never let a passenger wait longer than neccessary so...

If we can choose, select a car that:

2a. Have an unused prio-pass
2b. Have waited longest since its last drive
2c. Haven't rejected a booking recently

If we still can choose, select a car that:

3a. Have premium status to our VIP customers
3b. Have gold/silver/bronze status to our loyal customers


## Prio-pass and "bad bookings"

If a driver gets a "bad booking" they can be assigned a prio-pass- which means they will be sorted top in the next sorting. A "bad booking" is a very short booking or a booking in the wrong direction.

## Logging

All choices should be able to backtrace- why did we choose in a certain way when we did.



