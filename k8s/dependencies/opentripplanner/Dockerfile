FROM ibmjava:jre-alpine

ARG operator=norrbotten
# replace with your own key from trafiklab.se

ARG apikey

# fetch API key from Trafiklab
ADD https://opendata.samtrafiken.se/gtfs/${operator}/${operator}.zip?key=${apikey} /otp/input/gtfs.zip

# Add this line to also include road network in the suggested plan. 
# This will take a lot more memory, add at least 8GB to the java parameters below
# ADD https://download.geofabrik.de/europe/sweden-latest.osm.pbf /otp/input/sweden-latest.osm.pbf

ADD https://github.com/opentripplanner/OpenTripPlanner/releases/download/v1.5.0/otp-1.5.0-shaded.jar /otp/otp-1.5.0-shaded.jar
WORKDIR /otp
EXPOSE 8080 8081
CMD ["java", "-Xmx2G", "-jar", "otp-1.5.0-shaded.jar", "--build", "/otp/input", "--inMemory"]