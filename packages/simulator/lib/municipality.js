// municipality.js

const {
  from,
  shareReplay,
  Subject,
  mergeMap,
  catchError,
  tap,
  of,
  toArray,
  find,
  ReplaySubject,
  filter,
  map,
  mergeAll,
} = require('rxjs')
const Fleet = require('./fleet')
const { error, info } = require('./log')
const { dispatch } = require('./dispatch/dispatchCentral')

class Municipality {
  constructor({
    geometry,
    name,
    id,
    center,
    bookings,
    citizens,
    squares,
    fleetsConfig,
  }) {
    this.squares = squares
    this.geometry = geometry
    this.name = name
    this.id = id
    this.center = center
    this.bookings = bookings
    this.privateCars = new ReplaySubject()
    this.unhandledBookings = new Subject()

    this.co2 = 0
    this.citizens = citizens
    this.fleetsConfig = fleetsConfig

    /*
Fleet 1: Hushållsavfall
        1	Baklastare, enfack	HUSHSORT
        2	Baklastare, enfack	HUSHSORT
        5	Baklastare, enfack	HUSHSORT

Fleet 2: Hemsortering
        20	Fyrfack	HEMSORT (kärl 1)
        21	Fyrfack	HEMSORT (kärl 1)
        22	Fyrfack	HEMSORT (kärl 2)
        23	Fyrfack	HEMSORT (kärl 1)
        24	Fyrfack	HEMSORT (kärl 1)
        25	Fyrfack	HEMSORT (kärl 2)

Fleet 3: matavfall
        13	Matbil, enfack	MATAVF
        14	Matbil, enfack	MATAVF, ABP (ej samtidigt)

Fleet 4: Baklastare
        15	Baklastare, enfack	Samtliga fraktioner (felsorterat)
        12	Baklastare, enfack	TRÄDGÅRD
       
Fleet 5: Skåpbil
        16	Skåpbil	Servicebil, utställning/hemtagning kärl m.m. ej tömmer avfall
        17	Skåpbil	TEXTIL
        60	Skåpbil	Servicebil, utställning/hemtagning kärl m.m. ej tömmer avfall
        
Fleet 6: Frontlastare
        40	2-fack	Måndag: BMETFÖRP, METFÖRP, BPLASTFÖRP, PLASTFÖRP                           Tisdag: BPAPPFÖRP, PAPPFÖRP, BRETURPAPP, RETURPAPP, WELLPAPP Onsdag: BPAPPFÖRP, PAPPFÖRP, BRETURPAPP, RETURPAPP, WELLPAPP Torsdag: BMETFÖRP, METFÖRP, BPLASTFÖRP, PLASTFÖRP                          Fredag: BGLFÄ, GLFÄ, BGLOF, GLOF
        41	2-fack	BMETFÖRP, METFÖRP, BPLASTFÖRP, PLASTFÖRP                       
        42	2-fack	BPAPPFÖRP, PAPPFÖRP, BRETURPAPP, RETURPAPP, WELLPAPP 
        43	2-fack	Måndag: BGLFÄ, GLFÄ, BGLOF, GLOF BPAPPFÖRP, PAPPFÖRP, BRETURPAPP, RETURPAPP, WELLPAPP                                                                                                    Tisdag: BMETFÖRP, METFÖRP, BPLASTFÖRP, PLASTFÖRP                                   Onsdag: BGLFÄ, GLFÄ, BGLOF, GLOF                                                                          Torsdag: BPAPPFÖRP, PAPPFÖRP, BRETURPAPP, RETURPAPP, WELLPAPP Fredag: BGLFÄ, GLFÄ, BGLOF, GLOF
        45	Baklastare, enfack	BRÄNN, BLANDAVF, GROVAVF
        70	Frontlastare	Tömmer Vippcontainer, samma avfall som 2-fack
        71	Frontlastare	Tömmer Vippcontainer, samma avfall som 2-fack

Fleet 7: Kranbil
        81	Kranbil	
        82	Kranbil	
        85	Fyrfack	HEMSORT (kärl 1)

Fleet 8: Lastväxlare
        90	Lastväxlare	Tömmer Liftdumper, Rullflak, komprimatorer
        91	Lastväxlare	Tömmer Liftdumper, Rullflak, komprimatorer
        92	Lastväxlare	Tömmer Liftdumper, Rullflak, komprimatorer
        93	Lastväxlare	Tömmer Liftdumper, Rullflak, komprimatorer

Fleet 9: Baklastare, enfack
        87	Baklastare, enfack	Externa kommuner
        88	Baklastare, enfack	Externa kommuner
        89	Baklastare, enfack	Externa kommuner

*/
    this.fleets = from(this.fleetsConfig).pipe(
      map(
        ({ name, recyclingTypes, vehicles, hubAddress }) =>
          new Fleet({
            name: name,
            hub: this.center,
            municipality: this,
            hubAddress: hubAddress,
            vehicleTypes: vehicles,
            recyclingTypes: recyclingTypes,
          })
      ),
      tap((fleet) =>
        info(
          `✅ Fleet skapad: ${fleet.name} för att hantera [${fleet.recyclingTypes}] redo att ta emot bokningar`
        )
      ),
      catchError((err) => {
        error('Fleet creation error:', err)
        throw err
      }),
      shareReplay()
    )

    this.cars = this.fleets.pipe(mergeMap((fleet) => fleet.cars))

    /**
     * Take bookings and dispatch them to the first eligble fleet that can handle the booking
     */
    this.dispatchedBookings = this.bookings.pipe(
      mergeMap((booking) =>
        this.fleets.pipe(
          find((fleet) => fleet.canHandleBooking(booking) && booking),
          tap((ok) => {
            if (!ok) {
              error(
                `No fleet can handle booking ${booking.id} of type ${booking.recyclingType}`
              )
            }
          }),
          filter((ok) => ok),
          map((fleet) => fleet.handleBooking(booking))
        )
      ),

      toArray(), // this forces all bookings to be done before we continue
      mergeMap((bookings) => {
        info('All bookings are now added to queue:', bookings.length)
        return this.fleets.pipe(mergeMap((fleet) => fleet.startDispatcher()))
      }),
      catchError((err) => {
        error('dispatchedBookings:', err)
        throw err
      })
    )
  }
}
module.exports = Municipality
