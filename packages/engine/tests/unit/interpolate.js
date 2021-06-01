/* eslint-env node, mocha */

const oboy = require('oboy')

oboy((expect, sinon, proxyquire) => {
  let osrm, position, car

  beforeEach(function () {
    osrm = { match: sinon.stub() }
    const Car = proxyquire('../../lib/car', {'../lib/osrm': osrm})
    position = { lat: 59.34599123091426, lon: 17.91422590050599 }
    car = new Car(1, position)
    osrm.match.onCall(0).resolves(osrm_match)
  })

  it('should set correct tail from matched route', function (done) {
    car.updatePosition({lat: 59, lon: 18})
      .then(car => {
        console.log('position car')
        expect(car.tail, 'Tail not correct').to.eql([
          [59.3159, 18.05615],
          [59.3159, 18.05615],
          [59.3159, 18.05615]
        ])
        done()
      })
      .catch(done)
  })
})

const osrm_match = {
  'code': 'Ok',
  'matchings': [
    {
      'confidence': 0.979743,
      'geometry': 'kc`iJ}qemBKDEBEBMDQFQHQFQF',
      'legs': [
        {
          'annotation': {
            'nodes': [
              194854,
              194854,
              3443223958
            ],
            'duration': [
              0.6,
              0.1
            ],
            'distance': [
              5.374704,
              1.622022
            ]
          },
          'summary': 'Rosenlundsgatan',
          'duration': 0.7,
          'steps': [
            {
              'intersections': [
                {
                  'out': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    347
                  ],
                  'location': [
                    18.056146,
                    59.315895
                  ]
                },
                {
                  'out': 3,
                  'in': 1,
                  'entry': [
                    false,
                    false,
                    true,
                    true
                  ],
                  'bearings': [
                    75,
                    165,
                    255,
                    345
                  ],
                  'location': [
                    18.056124,
                    59.315942
                  ]
                }
              ],
              'geometry': 'kc`iJ}qemBGDC?',
              'maneuver': {
                'bearing_after': 347,
                'bearing_before': 0,
                'location': [
                  18.056146,
                  59.315895
                ],
                'type': 'depart'
              },
              'mode': 'driving',
              'duration': 0.7,
              'name': 'Rosenlundsgatan',
              'distance': 7
            },
            {
              'intersections': [
                {
                  'in': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    164
                  ],
                  'location': [
                    18.056116,
                    59.315956
                  ]
                }
              ],
              'geometry': 'wc`iJwqemB',
              'maneuver': {
                'bearing_after': 0,
                'bearing_before': 344,
                'location': [
                  18.056124,
                  59.315942
                ],
                'type': 'arrive'
              },
              'mode': 'driving',
              'duration': 0,
              'name': 'Rosenlundsgatan',
              'distance': 0
            }
          ],
          'distance': 7
        },
        {
          'annotation': {
            'nodes': [
              194854,
              3443223958
            ],
            'duration': [
              0.5
            ],
            'distance': [
              3.687715
            ]
          },
          'summary': 'Rosenlundsgatan',
          'duration': 0.4,
          'steps': [
            {
              'intersections': [
                {
                  'out': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    345
                  ],
                  'location': [
                    18.056116,
                    59.315956
                  ]
                }
              ],
              'geometry': 'wc`iJwqemBEB',
              'maneuver': {
                'bearing_after': 345,
                'bearing_before': 0,
                'location': [
                  18.056116,
                  59.315956
                ],
                'type': 'depart'
              },
              'mode': 'driving',
              'duration': 0.4,
              'name': 'Rosenlundsgatan',
              'distance': 3.7
            },
            {
              'intersections': [
                {
                  'in': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    165
                  ],
                  'location': [
                    18.056099,
                    59.315988
                  ]
                }
              ],
              'geometry': '}c`iJsqemB',
              'maneuver': {
                'bearing_after': 0,
                'bearing_before': 345,
                'location': [
                  18.056116,
                  59.315956
                ],
                'type': 'arrive'
              },
              'mode': 'driving',
              'duration': 0,
              'name': 'Rosenlundsgatan',
              'distance': 0
            }
          ],
          'distance': 3.7
        },
        {
          'annotation': {
            'nodes': [
              194854,
              3443223958
            ],
            'duration': [
              0.9
            ],
            'distance': [
              3.458163
            ]
          },
          'summary': 'Rosenlundsgatan',
          'duration': 0.4,
          'steps': [
            {
              'intersections': [
                {
                  'out': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    345
                  ],
                  'location': [
                    18.056099,
                    59.315988
                  ]
                }
              ],
              'geometry': '}c`iJsqemBEB',
              'maneuver': {
                'bearing_after': 345,
                'bearing_before': 0,
                'location': [
                  18.056099,
                  59.315988
                ],
                'type': 'depart'
              },
              'mode': 'driving',
              'duration': 0.4,
              'name': 'Rosenlundsgatan',
              'distance': 3.5
            },
            {
              'intersections': [
                {
                  'in': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    165
                  ],
                  'location': [
                    18.056083,
                    59.316018
                  ]
                }
              ],
              'geometry': 'cd`iJoqemB',
              'maneuver': {
                'bearing_after': 0,
                'bearing_before': 345,
                'location': [
                  18.056099,
                  59.315988
                ],
                'type': 'arrive'
              },
              'mode': 'driving',
              'duration': 0,
              'name': 'Rosenlundsgatan',
              'distance': 0
            }
          ],
          'distance': 3.5
        },
        {
          'annotation': {
            'nodes': [
              194854,
              3443223958,
              3443223958
            ],
            'duration': [
              2.1,
              5.7
            ],
            'distance': [
              1.02646,
              7.22479
            ]
          },
          'summary': 'Rosenlundsgatan',
          'duration': 2.8,
          'steps': [
            {
              'intersections': [
                {
                  'out': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    347
                  ],
                  'location': [
                    18.056083,
                    59.316018
                  ]
                }
              ],
              'geometry': 'cd`iJoqemBA?KD',
              'maneuver': {
                'bearing_after': 347,
                'bearing_before': 0,
                'location': [
                  18.056083,
                  59.316018
                ],
                'type': 'depart'
              },
              'mode': 'driving',
              'duration': 2.8,
              'name': 'Rosenlundsgatan',
              'distance': 8.3
            },
            {
              'intersections': [
                {
                  'in': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    166
                  ],
                  'location': [
                    18.056048,
                    59.31609
                  ]
                }
              ],
              'geometry': 'qd`iJiqemB',
              'maneuver': {
                'bearing_after': 0,
                'bearing_before': 346,
                'location': [
                  18.056083,
                  59.316018
                ],
                'type': 'arrive'
              },
              'mode': 'driving',
              'duration': 0,
              'name': 'Rosenlundsgatan',
              'distance': 0
            }
          ],
          'distance': 8.3
        },
        {
          'annotation': {
            'nodes': [
              158832969,
              3443223958
            ],
            'duration': [
              4.6
            ],
            'distance': [
              10.290301
            ]
          },
          'summary': 'Rosenlundsgatan',
          'duration': 1.1,
          'steps': [
            {
              'intersections': [
                {
                  'out': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    347
                  ],
                  'location': [
                    18.056048,
                    59.31609
                  ]
                }
              ],
              'geometry': 'qd`iJiqemBQF',
              'maneuver': {
                'bearing_after': 347,
                'bearing_before': 0,
                'location': [
                  18.056048,
                  59.31609
                ],
                'type': 'depart'
              },
              'mode': 'driving',
              'duration': 1.1,
              'name': 'Rosenlundsgatan',
              'distance': 10.3
            },
            {
              'intersections': [
                {
                  'in': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    167
                  ],
                  'location': [
                    18.056006,
                    59.31618
                  ]
                }
              ],
              'geometry': 'ce`iJaqemB',
              'maneuver': {
                'bearing_after': 0,
                'bearing_before': 347,
                'location': [
                  18.056048,
                  59.31609
                ],
                'type': 'arrive'
              },
              'mode': 'driving',
              'duration': 0,
              'name': 'Rosenlundsgatan',
              'distance': 0
            }
          ],
          'distance': 10.3
        },
        {
          'annotation': {
            'nodes': [
              158832969,
              3443223958
            ],
            'duration': [
              3.6
            ],
            'distance': [
              10.303596
            ]
          },
          'summary': 'Rosenlundsgatan',
          'duration': 1,
          'steps': [
            {
              'intersections': [
                {
                  'out': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    346
                  ],
                  'location': [
                    18.056006,
                    59.31618
                  ]
                }
              ],
              'geometry': 'ce`iJaqemBQH',
              'maneuver': {
                'bearing_after': 346,
                'bearing_before': 0,
                'location': [
                  18.056006,
                  59.31618
                ],
                'type': 'depart'
              },
              'mode': 'driving',
              'duration': 1,
              'name': 'Rosenlundsgatan',
              'distance': 10.3
            },
            {
              'intersections': [
                {
                  'in': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    166
                  ],
                  'location': [
                    18.055963,
                    59.31627
                  ]
                }
              ],
              'geometry': 'ue`iJwpemB',
              'maneuver': {
                'bearing_after': 0,
                'bearing_before': 346,
                'location': [
                  18.056006,
                  59.31618
                ],
                'type': 'arrive'
              },
              'mode': 'driving',
              'duration': 0,
              'name': 'Rosenlundsgatan',
              'distance': 0
            }
          ],
          'distance': 10.3
        },
        {
          'annotation': {
            'nodes': [
              158832969,
              3443223958
            ],
            'duration': [
              2.5
            ],
            'distance': [
              10.290298
            ]
          },
          'summary': 'Rosenlundsgatan',
          'duration': 1.1,
          'steps': [
            {
              'intersections': [
                {
                  'out': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    347
                  ],
                  'location': [
                    18.055963,
                    59.31627
                  ]
                }
              ],
              'geometry': 'ue`iJwpemBQF',
              'maneuver': {
                'bearing_after': 347,
                'bearing_before': 0,
                'location': [
                  18.055963,
                  59.31627
                ],
                'type': 'depart'
              },
              'mode': 'driving',
              'duration': 1.1,
              'name': 'Rosenlundsgatan',
              'distance': 10.3
            },
            {
              'intersections': [
                {
                  'in': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    167
                  ],
                  'location': [
                    18.055921,
                    59.31636
                  ]
                }
              ],
              'geometry': 'gf`iJopemB',
              'maneuver': {
                'bearing_after': 0,
                'bearing_before': 347,
                'location': [
                  18.055963,
                  59.31627
                ],
                'type': 'arrive'
              },
              'mode': 'driving',
              'duration': 0,
              'name': 'Rosenlundsgatan',
              'distance': 0
            }
          ],
          'distance': 10.3
        },
        {
          'annotation': {
            'nodes': [
              158832969,
              3443223958
            ],
            'duration': [
              1.5
            ],
            'distance': [
              10.182129
            ]
          },
          'summary': 'Rosenlundsgatan',
          'duration': 1,
          'steps': [
            {
              'intersections': [
                {
                  'out': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    346
                  ],
                  'location': [
                    18.055921,
                    59.31636
                  ]
                }
              ],
              'geometry': 'gf`iJopemBQF',
              'maneuver': {
                'bearing_after': 346,
                'bearing_before': 0,
                'location': [
                  18.055921,
                  59.31636
                ],
                'type': 'depart'
              },
              'mode': 'driving',
              'duration': 1,
              'name': 'Rosenlundsgatan',
              'distance': 10.2
            },
            {
              'intersections': [
                {
                  'in': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    166
                  ],
                  'location': [
                    18.055879,
                    59.316449
                  ]
                }
              ],
              'geometry': 'yf`iJgpemB',
              'maneuver': {
                'bearing_after': 0,
                'bearing_before': 346,
                'location': [
                  18.055921,
                  59.31636
                ],
                'type': 'arrive'
              },
              'mode': 'driving',
              'duration': 0,
              'name': 'Rosenlundsgatan',
              'distance': 0
            }
          ],
          'distance': 10.2
        },
        {
          'annotation': {
            'nodes': [
              158832969,
              158832969
            ],
            'duration': [
              2.8
            ],
            'distance': [
              14.6386
            ]
          },
          'summary': 'Rosenlundsgatan',
          'duration': 2.8,
          'steps': [
            {
              'intersections': [
                {
                  'out': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    347
                  ],
                  'location': [
                    18.055879,
                    59.316449
                  ]
                }
              ],
              'geometry': 'yf`iJgpemBYJ',
              'maneuver': {
                'bearing_after': 347,
                'bearing_before': 0,
                'location': [
                  18.055879,
                  59.316449
                ],
                'type': 'depart'
              },
              'mode': 'driving',
              'duration': 2.8,
              'name': 'Rosenlundsgatan',
              'distance': 14.6
            },
            {
              'intersections': [
                {
                  'in': 0,
                  'entry': [
                    true
                  ],
                  'bearings': [
                    165
                  ],
                  'location': [
                    18.055819,
                    59.316577
                  ]
                }
              ],
              'geometry': 'sg`iJ{oemB??',
              'maneuver': {
                'bearing_after': 0,
                'bearing_before': 347,
                'location': [
                  18.055819,
                  59.316577
                ],
                'type': 'arrive'
              },
              'mode': 'driving',
              'duration': 0,
              'name': 'Rosenlundsgatan',
              'distance': 0
            }
          ],
          'distance': 14.6
        }
      ],
      'duration': 11.3,
      'distance': 78.1
    }
  ],
  'tracepoints': [
    {
      'waypoint_index': 0,
      'matchings_index': 0,
      'hint': 'VhcAANkXAIC0DwAABQAAAEwAAAAAAAAAAAAAADxMFQAVrxIAQwEAANKDEwG3FokDzoMTAbcWiQMAAAEBtmURFw==',
      'name': 'Rosenlundsgatan',
      'location': [
        18.056146,
        59.315895
      ]
    },
    {
      'waypoint_index': 1,
      'matchings_index': 0,
      'hint': 'WBcAgGOsHAC0DwAAAQAAAAgAAAAAAAAAAAAAAE7jEwBSFCAAQwEAALSDEwH0FokDsIMTAfQWiQMAAAEBtmURFw==',
      'name': 'Rosenlundsgatan',
      'location': [
        18.056116,
        59.315956
      ]
    },
    {
      'waypoint_index': 2,
      'matchings_index': 0,
      'hint': 'WBcAgGOsHAC0DwAABQAAAAQAAAAAAAAAAAAAAE7jEwBSFCAAQwEAAKODEwEUF4kDooMTARQXiQMAAAEBtmURFw==',
      'name': 'Rosenlundsgatan',
      'location': [
        18.056099,
        59.315988
      ]
    },
    {
      'waypoint_index': 3,
      'matchings_index': 0,
      'hint': 'WBcAgGOsHAC0DwAACQAAAAAAAAAAAAAAAAAAAE7jEwBSFCAAQwEAAJODEwEyF4kDlIMTATMXiQMAAAEBtmURFw==',
      'name': 'Rosenlundsgatan',
      'location': [
        18.056083,
        59.316018
      ]
    },
    {
      'waypoint_index': 4,
      'matchings_index': 0,
      'hint': 'uAQCAGSsHIC0DwAAOQAAAAcAAAAAAAAAAAAAACLdFgBRFCAAQwEAAHCDEwF6F4kDc4MTAXsXiQMAAAEBtmURFw==',
      'name': 'Rosenlundsgatan',
      'location': [
        18.056048,
        59.31609
      ]
    },
    {
      'waypoint_index': 5,
      'matchings_index': 0,
      'hint': 'uAQCAGSsHIC0DwAALgAAABIAAAAAAAAAAAAAACLdFgBRFCAAQwEAAEaDEwHUF4kDSIMTAdUXiQMAAAEBtmURFw==',
      'name': 'Rosenlundsgatan',
      'location': [
        18.056006,
        59.31618
      ]
    },
    {
      'waypoint_index': 6,
      'matchings_index': 0,
      'hint': 'uAQCAGSsHIC0DwAAJAAAABwAAAAAAAAAAAAAACLdFgBRFCAAQwEAABuDEwEuGIkDHoMTAS8YiQMAAAEBtmURFw==',
      'name': 'Rosenlundsgatan',
      'location': [
        18.055963,
        59.31627
      ]
    },
    {
      'waypoint_index': 7,
      'matchings_index': 0,
      'hint': 'uAQCAGSsHIC0DwAAGQAAACcAAAAAAAAAAAAAACLdFgBRFCAAQwEAAPGCEwGIGIkD84ITAYkYiQMAAAEBtmURFw==',
      'name': 'Rosenlundsgatan',
      'location': [
        18.055921,
        59.31636
      ]
    },
    {
      'waypoint_index': 8,
      'matchings_index': 0,
      'hint': 'uAQCAGSsHIC0DwAADwAAADEAAAAAAAAAAAAAACLdFgBRFCAAQwEAAMeCEwHhGIkDyYITAeIYiQMAAAEBtmURFw==',
      'name': 'Rosenlundsgatan',
      'location': [
        18.055879,
        59.316449
      ]
    },
    {
      'waypoint_index': 9,
      'matchings_index': 0,
      'hint': 'twQCgP___393dgAAAAAAAFEAAAAAAAAAAAAAACPdFgDE3RYAQwEAAIuCEwFhGYkDjIITAWIZiQMAAAEBtmURFw==',
      'name': 'Samaritgränd',
      'location': [
        18.055819,
        59.316577
      ]
    }
  ]
}
