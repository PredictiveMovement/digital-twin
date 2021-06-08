# Proof of concept for Digital Twin with Predictive Movement

There are two packages in here, the [simulation](packages/simulation-engine) which creates and moves vehicles and stuff, and the [visualisation](packages/visualisation) that shows a map with things moving around.

## Simulation

Add an .env file with 
```
postombud_file=<filename>
postombud_sheet=Sammanställning korr
```

Create a folder named data and put the .xlsx file with the above filename in it

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

