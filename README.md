# Proof of concept for Digital Twin with Predictive Movement

There are two packages in here, the [simulation](packages/simulation-engine) which creates and moves vehicles and stuff, and the [visualisation](packages/visualisation) that shows a map with things moving around.

## Simulation

```
npm ci
npm run dev
```

## Visualisation

Add .env with the mapbox token `REACT_APP_MAPBOX_ACCESS_TOKEN=<YOUR TOKEN>`

```
npm ci
npm start
```

