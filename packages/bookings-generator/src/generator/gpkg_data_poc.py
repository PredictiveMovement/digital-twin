import fiona


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

        with fiona.open(destination_filename, "w", driver, schema, crs) as destination:
            for feature in source:
                population = feature["properties"]["pop"]
                feature["properties"]["packages"] = population / 10
                destination.write(feature)

    print("=====> completed writing destination gpkg file")
