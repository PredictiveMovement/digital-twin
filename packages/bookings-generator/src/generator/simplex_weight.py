from opensimplex import OpenSimplex


def add_simplex(df_address, weight_columns):
    seed = 1
    simplex = OpenSimplex(seed=seed)

    x = df_address.index.to_numpy()
    population = df_address['beftotalt_weight'].to_numpy()

    weights = []

    for xi in x:
        xv = xi / 1000
        yv = (xi / 1000) * population[xi]

        weight = simplex.noise2d(x=xv, y=yv)
        #weight = simplex.noise3d(x=xv, y=yv, z=xv)
        #weight = simplex.noise4d(x=xv, y=yv, z=xv, w=xv)
        # print(weight)

        weights.append(weight)

    # print(weights)

    df_address['simplex_weight'] = weights
    df_address['simplex_weight_factor'] = 1

    weight_columns.append('simplex_weight')
