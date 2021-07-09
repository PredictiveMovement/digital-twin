FROM node:14.9-slim AS builder

ARG REACT_APP_MAPBOX_ACCESS_TOKEN
ARG REACT_APP_SIMULATOR

WORKDIR /app

ADD ./package-lock.json .
ADD ./package.json .

RUN npm ci

ADD public/ ./public
ADD src/ ./src
ADD .prettierrc .

# NOTE: run as node process for now...
CMD npm run start

# TODO: figure out what is wrong with the static build
# RUN npm run build
# FROM nginx
# COPY --from=builder /app/build /usr/share/nginx/html