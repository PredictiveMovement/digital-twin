const events = require('./event_queue')

// Cars (and other actors) can still make decisions as they go
events.schedule(10, t => {
  console.log('Car1: First package delivered at', t)
  events.schedule(t+3, t => {
    console.log('Car1: Second package delivered at', t)
    events.schedule(t+20, t => {
      console.log('Car1: Third package delivered at', t)
    })
  })
})
// (I guess we should dependency inject schedule(t+))

// Or you can schedule stuff in advance, whichever makes more sense
events.schedule(313373, t => {
  console.log('Car2: Second package delivered at', t)
})
events.schedule(10, t => {
  console.log('Car2: First package delivered at', t)
})

setInterval(events.run_next, 1000)
