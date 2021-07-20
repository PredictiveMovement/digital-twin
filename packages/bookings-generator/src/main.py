from fastapi import FastAPI
from api.api_v1.api_v1 import api_router_v1


app = FastAPI(title="PM - Digital Twin - Bookings Generator")
app.include_router(api_router_v1)


@app.get("/")
def root():
    return {"Hello": "Bookings Generator!"}
