FROM node:16-slim AS builder

WORKDIR /app
COPY ./package-lock.json .
COPY ./package.json .
RUN npm ci

COPY public/ ./public
COPY  src/ ./src
COPY .prettierrc .

ARG REACT_APP_MAPBOX_ACCESS_TOKEN
ARG REACT_APP_SIMULATOR_URL

ENV REACT_APP_MAPBOX_ACCESS_TOKEN $REACT_APP_MAPBOX_ACCESS_TOKEN
ENV REACT_APP_SIMULATOR_URL $REACT_APP_SIMULATOR_URL

RUN npm run build

# production environment
FROM nginx:1.16.0-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]