FROM osrm/osrm-backend

# Kopiera den lokalt nedladdade filen in i Dockerbilden
COPY sweden-latest.osm.pbf /data/sweden-latest.osm.pbf

RUN osrm-extract -p /opt/car.lua /data/sweden-latest.osm.pbf && \
    osrm-partition /data/sweden-latest.osrm && \
    osrm-customize /data/sweden-latest.osrm
