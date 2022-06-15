FROM node:16-slim

WORKDIR /app
COPY ./package.json .
COPY ./package-lock.json .
RUN npm ci
COPY . .

ENV ELASTICSEARCH $ELASTICSEARCH

EXPOSE 4000
CMD npm start