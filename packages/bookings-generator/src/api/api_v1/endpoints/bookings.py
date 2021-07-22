from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException

from generator.bookings_generator import get_bookings


router = APIRouter()


@router.get("/bookings",
            summary="Get booking locations and times",
            response_description="A list of bookings with time and position")
def get_bookings_by_from_to_date(area_upper_long: float, area_lower_lat: float, area_lower_long: float, area_upper_lat: float, from_date: datetime, to_date: datetime):
    """
    Return a statistical amount of bookings within a given timespan and area.

    The area is specified by two points, the upper left corner [area_upper_long, area_lower_lat] and the lower right corner [area_lower_long, area_upper_lat]
    All coordinates are in WGS84 format.
    Example:
     - area_upper_long:`61.959203`,
     - area_lower_lat:`15.713672`,
     - area_lower_long:`61.618361`,
     - area_upper_lat:`16.665255`

    _from_date_ and _to_date_ needs to be in ISO 8601, example:
    `2021-07-21T00:00:00+01:00`
    """
    # TODO: add response and input examples

    if not to_date > from_date:
        raise HTTPException(
            status_code=400, detail='to_date must be after from_date')
    bookings = get_bookings((area_upper_long, area_lower_lat),
                            (area_lower_long, area_upper_lat), from_date, to_date)
    return {'bookings': bookings}
