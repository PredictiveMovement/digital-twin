import random

from perlin_noise import PerlinNoise


def add_perlin(df_address, weight_columns):
    #seed = random.randint(0, 10000)
    seed = 1
    octaves = 10
    #octaves = 2
    noise = PerlinNoise(octaves=octaves, seed=seed)

    x = df_address.index.to_numpy()

    # perlin can't handle integers
    # whats best in here?
    #perlin_divisor = 100
    #perlin_divisor = len(x)
    #perlin_divisor = x.max()
    #perlin_divisor = x.max() / 2
    #perlin_divisor = x.mean()
    perlin_divisor = x.max() / 4

    weights = []

    for xi in x:
        perlin_x = xi/perlin_divisor
        perlin_y = perlin_x

        weight = noise([perlin_x, perlin_y])
        #print(perlin_x, perlin_y, weight)
        weights.append(weight)

    # print(weights)

    df_address['perlin_weight'] = weights
    df_address['perlin_weight_factor'] = 1

    weight_columns.append('perlin_weight')


def add_perlin_with_population(df_address, weight_columns):
    #seed = random.randint(0, 10000)
    seed = 1
    octaves = 10
    noise = PerlinNoise(octaves=octaves, seed=seed)

    x = df_address.index.to_numpy()
    y = df_address['beftotalt_weight'].to_numpy()

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

    df_address['perlin_pop_weight'] = weights
    df_address['perlin_pop_weight_factor'] = 1

    weight_columns.append('perlin_pop_weight')


def add_perlin_factor_population(df_address, weight_columns):
    #seed = random.randint(0, 10000)
    seed = 1
    octaves = 10
    noise = PerlinNoise(octaves=octaves, seed=seed)

    x = df_address.index.to_numpy()
    population = df_address['beftotalt_weight'].to_numpy()

    # perlin can't handle integers
    # whats best in here?
    #perlin_divisor = 100
    #perlin_divisor = len(x)
    #perlin_divisor = x.max()
    #perlin_divisor = x.max() / 2
    #perlin_divisor = x.mean()
    perlin_divisor = x.max() / 4

    weights = []

    for xi in x:
        perlin_x = xi/perlin_divisor
        perlin_y = perlin_x

        weight = noise([perlin_x, perlin_y])

        weight = weight * population[xi]

        #print(perlin_x, perlin_y, weight)
        weights.append(weight)

    df_address['perlin_pop_fac_weight'] = weights
    df_address['perlin_pop_fac_weight_factor'] = 1

    weight_columns.append('perlin_pop_fac_weight')
