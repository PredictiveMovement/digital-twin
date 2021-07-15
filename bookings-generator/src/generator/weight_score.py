import numpy as np
import pandas as pd

from sklearn.preprocessing import MinMaxScaler


def calculate(df, weight_columns):
    weight_scores = []

    # print(df.columns)

    for _, row in df.iterrows():
        row_weigh = 0

        for weight_column in weight_columns:
            factor_column = f'{weight_column}_factor'
            row_weight_column = row[weight_column] * row[factor_column]

            row_weigh = row_weigh + row_weight_column

        weight_scores.append(row_weigh)

    df['weight'] = weight_scores


def min_max_scale(df, weight_columns):

    for weight_column in weight_columns:
        # print(weight_column)

        weights = df[weight_column].to_numpy()
        weights = weights.reshape(-1, 1)
        # print(weights)

        weights_scaled = None
        if np.all(weights == weights[0]):
            weights_scaled = np.ones(len(weights))
        else:
            scaler = MinMaxScaler()
            weights_scaled = scaler.fit_transform(weights)

            weights_scaled = weights_scaled.reshape(1, -1).tolist()[0]

        # print(weights_scaled)
        df[weight_column] = weights_scaled
