import fiona


def _is_in_bounds(polygon):
    # this is the area around Ljusdal in SWEREF99TM
    # upper left N 6869841.085 , E 537429.637
    # lower right N 6832795.482 , E 588303.781
    for point in polygon:
        if 537429.637 < point[0] < 588303.781 and 6832795.482 < point[1] < 6869841.085:
            return True
    return False


def load():
    source_fileName = 'data/raw/Totalbefolkning_1km_191231.gpkg'
    print('=====> loading source gpkg file')

    with fiona.open(source_fileName, 'r') as source:
        count = 0
        output = []

        for feature in source:
            if not _is_in_bounds(feature['geometry']['coordinates'][0]):
                continue
            count += 1
            population = feature['properties']['pop']
            feature['properties']['packages'] = population / 10
            output.append({'position': feature['geometry']['coordinates'][0],
                           'population': population,
                           'packages': feature['properties']['packages']})

        print(f'Read {count} matching entries')
    return output


def write(input):
    destination_filename = 'data/raw/Totalbefolkning_1km_191231_updated.gpkg'
    crs = {'init': 'epsg:3006'}
    driver = 'GPKG'
    schema = {'properties': {'pop': 'int', 'packages': 'float'},
              'geometry': 'Polygon'}

    print('=====> writing destination gpkg file')
    with fiona.open(destination_filename, 'w', driver, schema, crs) as destination:
        for place in input:
            feature = {
                'type': 'Feature',
                'properties': {'pop': place['population'], 'packages': place['packages']},
                'geometry': {
                    'type': 'Polygon',
                    'coordinates': [place['position']]
                }
            }
            destination.write(feature)
    print('=====> completed writing destination gpkg file')
