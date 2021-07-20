import pandas as pd


def load_1km_grid():
    print("loading 1km grid")

    filename = "data/raw/5arsklasser_1km_191231.csv"
    df = pd.read_csv(filename)
    df = df[['id', 'ruta']]

    # give kind of x,y coordinates
    df['ruta_x'] = df['ruta'] / 10000000
    df['ruta_x'] = df['ruta_x'].astype(int)

    df['ruta_y'] = df['ruta'] - (df['ruta_x'] * 10000000)
    df['ruta_y'] = df['ruta_y'].astype(int)

    # example for filter on area
    df = df.loc[(df['ruta_x'] >= 800000) & (df['ruta_x'] < 900000)]
    df = df.loc[(df['ruta_y'] >= 7300000) & (df['ruta_y'] < 7400000)]

    return df


def load_dummy_by_county(county):
    print("loading dummy addresses")

    addresses = [
        {"id": 1, "street": "Arcusvägen", "number": "95", "zip": "97594",
         "city": "Luleå", "county": "Norrbotten", "country": "Sweden"},
        {"id": 2, "street": "Stationsgatan", "number": "5", "zip": "97238",
         "city": "Luleå", "county": "Norrbotten", "country": "Sweden"},
        {"id": 3, "street": "Aurorumvägen", "number": "2", "zip": "97775",
         "city": "Luleå", "county": "Norrbotten", "country": "Sweden"},
        {"id": 4, "street": "Södra Smedjegatan", "number": "12", "zip": "97235",
         "city": "Luleå", "county": "Norrbotten", "country": "Sweden"},
        {"id": 5, "street": "Banvägen", "number": "3", "zip": "97346",
         "city": "Luleå", "county": "Norrbotten", "country": "Sweden"},
        {"id": 6, "street": "Stortorget", "number": "2", "zip": "10316",
         "city": "Stockholm", "county": "Stockholms län", "country": "Sweden"},
        {"id": 7, "street": "Djurgårdsslätten", "number": "49-51", "zip": "11521",
         "city": "Stockholm", "county": "Stockholms län", "country": "Sweden"},
        {"id": 8, "street": "Eugeniavägen", "number": "3", "zip": "17164",
         "city": "Solna", "county": "Stockholms län", "country": "Sweden"},
        {"id": 9, "street": "Brinellvägen", "number": "8", "zip": "11428",
         "city": "Stockholm", "county": "Stockholms län", "country": "Sweden"},
        {"id": 10, "street": "Åsögatan", "number": "117", "zip": "11624",
         "city": "Stockholm", "county": "Stockholms län", "country": "Sweden"}
    ]

    df = pd.DataFrame(addresses)
    return df.loc[df['county'] == county]
