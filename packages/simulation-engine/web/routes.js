const _ = require("highland");
const moment = require("moment");
const engine = require("../index");
const postombud = require("../streams/postombud");

const cache = {};

function register(io) {
  io.on("connection", function (socket) {
    console.log("connection", cache);
    _.merge([_.values(cache), engine.cars.fork()])
      .doto((car) => (cache[car.id] = car))
      .pick(["position", "status", "id", "tail", "zone", "speed", "bearing"])
      .doto(
        (car) =>
          (car.position = [
            car.position.lon,
            car.position.lat,
            car.position.date,
          ])
      )
      //.filter(car => car.position.speed > 90) // endast bilar över en viss hastighet
      //.ratelimit(100, 100)
      .batchWithTimeOrCount(1000, 2000)
      .errors(console.error)
      .each((cars) => socket.volatile.emit("cars", cars));

    engine.postombud
      .fork()
      .filter((postombud) => postombud.operator === "Postnord")
      .batchWithTimeOrCount(1000, 2000)
      .errors(console.error)
      .each((postombud) => {
        console.log("post", postombud);
        socket.emit("postombud", postombud);
      });

    // socket.emit("postombud", "hej");
  });
}

module.exports = {
  register,
};
