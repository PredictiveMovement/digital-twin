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

For now, the visualisation runs the dev server since something goes wrong when building it to a static html+js site.

So the mapbox token is required in runtime. In case the secret needs to be re-created in the cluster, run the following command substituting `<YOUR TOKEN>` with, you know, your token.

```bash
# create mapbox secret
kubectl -n digital-twin create secret generic mapbox-access-token --from-literal=REACT_APP_MAPBOX_ACCESS_TOKEN=<YOUR TOKEN>
```

```bash
# redeploy
skaffold run
```