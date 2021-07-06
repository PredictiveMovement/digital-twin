const EventEmitter = require('events')

class Pool extends EventEmitter {
  make_available(car) {
    this.emit('join', car)
  }

  emit_event(event_name, payload) {
    this.emit('data', {event: event_name, ...payload});
  }
}

module.exports = Pool