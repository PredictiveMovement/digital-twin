FROM node:16-slim

WORKDIR /app
COPY ./package.json .
COPY ./package-lock.json .
RUN npm ci
COPY . .

ENV ELASTICSEARCH_URL $ELASTICSEARCH_URL
RUN npm run preboot
EXPOSE 4000
CMD npm start
