from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException

from generator.bookings_generator import get_bookings


router = APIRouter()


@router.get("/bookings/",
            summary="Pick the next locations for bookings.",
            response_description="Index of the next booking locations.")
def get_bookings_by_from_to_date(from_date: datetime, to_date: datetime):
    """
    Picking random locations with weights.

    _from_date_ and _to_date_ needs to be in ISO 8601, for example:
    `2008-03-15T00:00:00+01:00`

    __Well, time will be ignored for now - just days are count.__
    __Also, years will be ignored. Max time span is a year.__
    """

    bookings_index = get_bookings(from_date, to_date)
    #print(f'Bookings index: {bookings_index}')

    return {
        "from": from_date,
        "to": to_date,
        "index": bookings_index
        # TODO: should return a bunch of {position and time}
    }
