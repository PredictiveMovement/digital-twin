FROM node:16-slim AS builder

WORKDIR /app
COPY ./package-lock.json .
COPY ./package.json .
RUN npm ci

COPY public/ ./public
COPY src/ ./src
COPY .prettierrc .
COPY vite.config.js .
COPY yarn.lock .
COPY index.html .

ARG VITE_MAPBOX_ACCESS_TOKEN
ARG VITE_SIMULATOR_URL

ENV VITE_MAPBOX_ACCESS_TOKEN $VITE_MAPBOX_ACCESS_TOKEN
ENV VITE_SIMULATOR_URL $VITE_SIMULATOR_URL

RUN npm run build

# production environment
FROM nginx:1.16.0-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
