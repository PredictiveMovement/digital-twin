# Proof of concept for Digital Twin with Predictive Movement

There are two packages in here, the [simulation](packages/simulation-engine) which creates and moves vehicles and stuff, and the [visualisation](packages/visualisation) that shows a map with things moving around.

## Simulation

Create a folder named data and put the .xlsx file

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

## Kubernetes

The visualisation is running with ngiex and you will have to export these variables before running.

```bash
# set the simulator url
    export REACT_APP_MAPBOX_ACCESS_TOKEN=<YOUR TOKEN>
    export REACT_APP_SIMULATOR_URL=https://digital-twin-engine.iteamdev.io
```

```bash
# redeploy
skaffold run
```
