import numpy as np


def add_random(df, weight_columns):
    df['random_weight'] = np.random.rand(df.shape[0], 1)
    df['random_weight_factor'] = 0.5
    #df['random_weight_factor'] = 1

    weight_columns.append('random_weight')


def add_series(df, weight_columns):
    series = [1, 2, 3]

    x_times = int(df.shape[0] / len(series)) + 1
    weights = np.tile(series, x_times)
    weights = np.resize(weights, (df.shape[0]))

    df['series_weight'] = weights
    df['series_weight_factor'] = 0.5

    weight_columns.append('series_weight')


def add_equal(df, weight_columns):
    df['equal_weight'] = 1
    df['equal_weight_factor'] = 1

    weight_columns.append('equal_weight')
