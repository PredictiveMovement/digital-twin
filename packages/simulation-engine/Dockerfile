FROM node
WORKDIR /app
COPY ./package.json .
RUN npm install --production
COPY ./lib ./lib
COPY ./simulator ./simulator
COPY ./index.js .
CMD npm start
