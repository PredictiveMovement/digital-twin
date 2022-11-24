FROM node:17
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
ENV PORT=6000
EXPOSE 6000
CMD [ "node", "index.js" ]
