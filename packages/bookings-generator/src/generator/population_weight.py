import pandas as pd


def add_beftotalt(df_address, weight_columns):
    filename = "data/raw/5arsklasser_1km_191231.csv"
    df_beftotalt = pd.read_csv(filename)
    df_beftotalt = df_beftotalt[['id', 'beftotalt']]

    # print(df_address)
    # print(df_beftotalt)

    # just merge by id
    df_address = pd.merge(df_address,
                          df_beftotalt,
                          on=['id'],
                          how='left')

    df_address = df_address.rename(columns={'beftotalt': 'beftotalt_weight'})
    df_address['beftotalt_weight_factor'] = 1
    #df_address['beftotalt_weight_factor'] = 0

    # print(df_address.columns)

    weight_columns.append('beftotalt_weight')
    return df_address


def add_arsklasser():
    # TODO add some guesses on the ars klasser?
    pass
