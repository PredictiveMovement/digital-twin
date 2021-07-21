from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException

from generator.bookings_generator import get_bookings


router = APIRouter()


@router.get("/bookings/",
            summary="Pick the next locations for bookings.",
            response_description="Index of the next booking locations.")
def get_bookings_by_from_to_date(area_upper_long: float, area_lower_lat: float, area_lower_long: float, area_upper_lat: float, from_date: datetime, to_date: datetime):
    """
    Returns bookings representing how many was sent within the time span within the specified area

    The area is specified with a upper and lower boundary for the longitude and latitude.
    area_upper_long, area_lower_lat, area_lower_long, area_upper_lat are WGS84 coordinates which delimit a rectangle within which to return bookings
    example:
     - area_upper_long:`61.959203`,
     - area_lower_lat:`15.713672`,
     - area_lower_long:`61.618361`,
     - area_upper_lat:`16.665255`

    _from_date_ and _to_date_ needs to be in ISO 8601, for example:
    `2021-07-21T00:00:00+01:00`

    __Well, time will be ignored for now - just days are count.__
    """

    if not to_date > from_date:
        raise HTTPException(
            status_code=400, detail='to_date must be after from_date')
    bookings = get_bookings((area_upper_long, area_lower_lat),
                            (area_lower_long, area_upper_lat), from_date, to_date)
    #print(f'Bookings index: {bookings_index}')

    return {'bookings': bookings}
