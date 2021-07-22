import numpy as np
import calendar

from calendar import monthrange
from perlin_noise import PerlinNoise


def add_manual(df_time, weight_columns):

    # these are the 'manual guesses' -> export to csv?
    month_weights = [
        2,      # Jan
        2,      # Feb
        1,      # Mar
        0.5,    # Apr
        0.5,    # May
        1,      # Jun
        1,      # Jul
        1,      # Aug
        0.5,    # Sep
        0.5,    # Oct
        2,      # Nov
        3       # Dec
    ]

    # convert month weights to days in years
    i_start = 0

    year_weight = np.arange(0, dtype=int)

    for i_month in range(1, 13):
        num_days = monthrange(2019, i_month)[1]

        i_end = i_start + num_days
        #print(i_month, num_days, i_start, i_end)

        month_weight = np.full((num_days), month_weights[i_month-1])
        year_weight = np.append(year_weight, month_weight)

        # print(year_weight)

        i_start = i_end

    # print(len(year_weight))

    df_time['manual_weight'] = year_weight
    df_time['manual_weight_factor'] = 1
    #df_time['manual_weight_factor'] = 0

    weight_columns.append('manual_weight')


def add_perlin_with_manual(df_time, weight_columns):
    #seed = random.randint(0, 10000)
    seed = 1
    octaves = 10
    noise = PerlinNoise(octaves=octaves, seed=seed)

    x = df_time.index.to_numpy()
    y = df_time['manual_weight'].to_numpy()

    # perlin can't handle integers
    # whats best in here?
    #perlin_divisor = 100
    #perlin_divisor = len(x)
    #perlin_divisor = x.max()
    #perlin_divisor = x.max() / 2
    #perlin_divisor = x.mean()
    perlin_divisor = x.max() / 4

    perlin_divisor_y = y.max() / 4

    weights = []

    for xi in x:
        perlin_x = xi/perlin_divisor
        perlin_y = y[xi]/perlin_divisor_y

        weight = noise([perlin_x, perlin_y])
        #print(perlin_x, perlin_y, weight)
        weights.append(weight)

    df_time['perlin_manual_weight'] = weights
    df_time['perlin_manual_weight_factor'] = 1

    weight_columns.append('perlin_manual_weight')
