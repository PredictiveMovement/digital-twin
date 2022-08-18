FROM ibmjava

ARG operator=norrbotten
ARG apikey

# fetch API key from Trafiklab
ADD https://opendata.samtrafiken.se/gtfs/${operator}/${operator}.zip?key=${apikey} /otp/input/gtfs.zip
ADD https://github.com/opentripplanner/OpenTripPlanner/releases/download/v1.5.0/otp-1.5.0-shaded.jar /otp/otp-1.5.0-shaded.jar
WORKDIR /otp
EXPOSE 8080 8081
CMD ["java", "-Xmx2G", "-jar", "otp-1.5.0-shaded.jar", "--build", "/otp/input", "--inMemory"]