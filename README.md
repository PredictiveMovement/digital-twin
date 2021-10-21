# A Digital Twin for transport systems in Sweden

## Background

This system is trying to replicate the transport system in Sweden with as much accuracy as possible without revealing any personal or commercial data. By taking publicly available datapoints regarding amount of packet deliveries, population within 1km2 square areas together with guestimates on market shares for transport actors we can create synthetic data streams which we than can visualize on a map.

The main reason for doing this research is to limit the risk when experimenting with optimization on a systems level. For example- in Predictive Movement we believe we can reduce the energy consumption and limit the stress on the roads dramatically by optimizing the utilization on a systems level within a area/kommun. By first simulating the current state and the applying these optimizations we can measure the difference and see how much impact we can have.

## Current state / limitations

This is currently an early version of the simulation. There are quite a few areas of improvement and hopefully we or someone else can contribute to applying all of these areas:

[ ] Multiple handovers - a packet will arrive to Sweden from the borders and then be delivered within certain internal processes within each fleet. This can be visualized. Right now they just "appear" magically in the kommun.
[ ] Home delivery - We haven't implemented private citizen cars yet. This can be done but needs a bit of performance analysis to not exhaust our servers capacity. We think we can generate these cars dynamically when you zoom above a certain level.
[ ] Individual booking statistics - We believe we can show statistics for each packet/booking to visualize bottlenecks that can be optimized from a bookings perspective
[ ] Fleet intelligence - we are right now dispatching bookings with a very unsmart algorighm - always take the closest available car - this is not matching reality in each case. We want to tweak these more - but not too much - we know there are room for improvement even for fleets. Especially smaller fleets.
[ ] More data points - we know there are datasets available that can improve our estimates. For example from Trafikverket.
[ ] Machine Learning - we believe we can improve our current hard coded estimates on volumes, traffic, amount of cars etc based on real world data. To exchange these values on certain dates/times we can improve our model significantly. 

## How to contribute

This code is released with MIT license - which means you can create your own copy of this to use within your own fleet if you want to. You can also contribute by sending Pull Requests or issues to us and we will review them and merge them. 

## How to run

We have tried to include as much as possible in the mono-repo, including neccessary data sources. Our goul is that it will be as easy as cloning the repo and run:
  
  cd packages/simulator
  npm ci
  npm run dev 
  
open a new terminal / tmux
  
  cd packages/visualization
  npm ci
  
Add .env with the mapbox token `REACT_APP_MAPBOX_ACCESS_TOKEN=<YOUR TOKEN>` - we want to remove this step by using libremap

  npm start

## License

Predictive Movement is licensed under the MIT license. Please see [LICENSE](LICENSE) for details.
