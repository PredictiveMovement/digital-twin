import random


def pick(df, number):
    number = number
    weights = df['weight'].to_numpy()
    df_index = df.index.to_numpy().tolist()

    random_index = random.choices(df_index, weights=weights, k=number)
    return random_index
