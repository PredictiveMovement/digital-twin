FROM osrm/osrm-backend:v5.25.0
ENV DOWNLOAD_URL=https://download.geofabrik.de/europe/sweden-latest.osm.pbf
RUN   apt-get update && apt-get install -y --no-install-recommends wget tar && \
  mkdir /data && \
  wget --no-check-certificate --debug "${DOWNLOAD_URL}" -O /data/sweden-latest.osm.pbf && \
  rm -rf /var/lib/apt/lists/* && \
  osrm-extract -p /opt/car.lua /data/sweden-latest.osm.pbf && \
  osrm-partition /data/sweden-latest.osrm && \
  osrm-customize /data/sweden-latest.osrm && \
  osrm-routed --algorithm mld --max-table-size 10000 /data/sweden-latest.osrm