FROM node:16-slim

WORKDIR /app
COPY ./package.json .
COPY ./package-lock.json .
RUN npm ci
COPY /lib ./lib
COPY /web ./web
COPY /run.js .

EXPOSE 4000
CMD npm run dev