import numpy as np
import pandas as pd

import generator.weight_score as weight_score
import generator.dummy_weights as dummy_weights


def load_year_days():
    print("loading year days")

    df_year_days = pd.DataFrame(np.arange(365))
    return df_year_days


def transform_weight_to_bookings_number(df, yearly_booking_number):
    weight_sum = df['weight'].sum()
    if weight_sum == 0:
        weight_sum = 1
    # print(weight_sum)

    booking_weight = yearly_booking_number / weight_sum
    # print(booking_weight)

    df['weight_score'] = df['weight'] * booking_weight
    df['number'] = df['weight_score'].round(0)
    # print(df)
    # print(df['number'].sum())
    # print(df['weight_score'].sum())


def load_yearly_booking_number():
    # TODO load from real data source
    #yearly_booking_number = 365
    yearly_booking_number = 1000000
    return yearly_booking_number


def get_numbers(df, from_date, to_date):
    # TODO add time span of more than one year?
    # TODO add time span of hours?
    numbers = 0

    from_day = from_date.timetuple().tm_yday
    # print(from_day)

    to_day = to_date.timetuple().tm_yday
    # print(to_day)

    if from_day > to_day:
        from_sum = df['number'].iloc[from_day:].sum()
        to_sum = df['number'].iloc[:to_day].sum()
        numbers = from_sum + to_sum
    else:
        numbers = df['number'].iloc[from_day:to_day].sum()

    numbers = int(numbers)
    # print(numbers)
    return numbers


def log_diff_to_bookings_limit(df, yearly_booking_number):
    number_sum = df["number"].sum()
    pct = (number_sum / yearly_booking_number) * 100
    print(f'{number_sum} of {yearly_booking_number} ({pct}%)')
