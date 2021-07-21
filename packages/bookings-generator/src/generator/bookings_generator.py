from datetime import datetime
from sweref99 import projections

import generator.df_addresses as addresses
import generator.df_times as times

import generator.dummy_weights as dummy_weights
import generator.population_weight as population_weight
import generator.perlin_weight as perlin_weight
import generator.simplex_weight as simplex_weight
import generator.times_weight as time_weight

import generator.weight_score as weight_score
import generator.random_weight_address as random_weight_address
import generator.weight_plot as weight_plot
import generator.gpkg_data_poc as gpkg_data_poc

# ---
# --- load geopackage data
# ---

# gpkg_data_poc.write(population)

# ---
# --- load location weights
# ---
#df_address = addresses.load_dummy_by_county('Norrbotten')
#df_address = addresses.load_1km_grid()

# add weights
#address_weight_columns = []

#dummy_weights.add_random(df_address, address_weight_columns)
#dummy_weights.add_series(df_address, address_weight_columns)

#df_address = population_weight.add_beftotalt(df_address, address_weight_columns)

#perlin_weight.add_perlin(df_address, address_weight_columns)
#perlin_weight.add_perlin_with_population(df_address, address_weight_columns)
#perlin_weight.add_perlin_factor_population(df_address, address_weight_columns)

#simplex_weight.add_simplex(df_address, address_weight_columns)

# calculate weight score
#weight_score.min_max_scale(df_address, address_weight_columns)
#weight_score.calculate(df_address, address_weight_columns)

# print(df_address)


# ---
# --- load time weights
# ---
#df_time = times.load_year_days()

# add weights
#time_weight_columns = []

#dummy_weights.add_random(df_time, time_weight_columns)
#dummy_weights.add_series(df_time, time_weight_columns)
#dummy_weights.add_equal(df_time, time_weight_columns)

#time_weight.add_manual(df_time, time_weight_columns)
#time_weight.add_perlin_with_manual(df_time, time_weight_columns)

# calculate weight score
#weight_score.min_max_scale(df_time, time_weight_columns)
#weight_score.calculate(df_time, time_weight_columns)

# weight to integer booking numbers
#yearly_booking_number = times.load_yearly_booking_number()
#times.transform_weight_to_bookings_number(df_time, yearly_booking_number)

# times.log_diff_to_bookings_limit(df_time, yearly_booking_number)
# print(df_time)


# --- visualization
# weight_plot.plot_weights_line(df_address)
# weight_plot.plot_numbers_line(df_time)
def _wgs84_to_sweref(point):
    tm = projections.make_transverse_mercator("SWEREF_99_TM")

    lat, lon = point[0], point[1]
    northing, easting = tm.geodetic_to_grid(lat, lon)
    print(f"{lat:.6f}° N {lon:.6f}°E : {northing:.2f} N {easting:.2f} E")
    return (northing, easting)


def _add_bookings(place, duration):
    # assumption one package per person per month
    return place | {'packages': round(place['population'] * duration.days / 30)}


def get_bookings(upper_left, lower_right, from_date, to_date):
    # Area around Ljusdal
    # upper left N 6869841.085 , E 537429.637
    # lower right N 6832795.482 , E 588303.781
    places = gpkg_data_poc.read(
        _wgs84_to_sweref(upper_left),
        _wgs84_to_sweref(lower_right))
    duration = to_date - from_date
    places_with_packages = map(
        lambda place: _add_bookings(place, duration), places)

    # TODO: randomize place[packages] number of positions within the square

    gpkg_data_poc.write(places_with_packages)
    return places_with_packages

    # calculate weight score dynamically if needed here

    # get numbers of bookings to pick
    #numbers = times.get_numbers(df_time, from_date, to_date)
    #print(f'Numbers of bookings: {numbers}')

    # pick addresses
    #bookings_index = random_weight_address.pick(df_address, numbers)
    # return bookings_index


# if __name__ == "__main__":
#   iso88601 = "%Y-%m-%dT%H:%M:%S%z"
#   from_date = datetime.strptime('2008-03-15T00:00:00+01:00', iso88601)
#   to_date = datetime.strptime('2008-03-16T00:00:00+01:00', iso88601)

#   bookings_index = get_bookings(from_date, to_date)
#   print(f'Bookings index: {bookings_index}')
