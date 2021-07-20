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
    source_fileName = "data/raw/Totalbefolkning_1km_191231.gpkg"
    destination_filename = "data/raw/Totalbefolkning_1km_191231_updated.gpkg"
    print("=====> loading source gpkg file")

    with fiona.open(source_fileName, "r") as source:
        crs = source.crs
        driver = source.driver
        schema = source.schema
        schema["properties"]["packages"] = "float"

        # ---
        # source schema has geometry MultiPolygon and all features seem to have geometry Polygon
        # the difference in geometry type makes the write to destination throw errors
        # we set geometry to Polygon and the write seems to work fine
        # ---
        schema["geometry"] = "Polygon"

        print("=====> writing destination gpkg file")

        count = 0
        with fiona.open(destination_filename, "w", driver, schema, crs) as destination:
            for feature in source:
                if not _is_in_bounds(feature["geometry"]["coordinates"][0]):
                    continue
                count += 1
                population = feature["properties"]["pop"]
                feature["properties"]["packages"] = population / 10
                destination.write(feature)
        print(f"Found {count} matching entries")

    print("=====> completed writing destination gpkg file")
