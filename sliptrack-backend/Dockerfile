# Multi-stage build: prvi stage kompajlira JAR preko Maven wrappera (isti mvnw/verzija
# kao lokalni razvoj), drugi stage vrti samo JRE + gotov JAR — konačna slika nema Maven
# ni izvorni kod, samo ono što je potrebno za pokretanje.

FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Ovisnosti se cache-aju u zasebnom sloju — mijenjaju se rijetko (samo kad se pom.xml
# promijeni), pa docker build ne mora ponovno preuzimati sve ovisnosti na svaku izmjenu
# izvornog koda.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B

COPY src/ src/
RUN ./mvnw package -DskipTests -B

FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# Ne pokretati kao root unutar kontejnera — standardna sigurnosna praksa.
RUN useradd --system --create-home --shell /usr/sbin/nologin sliptrack
USER sliptrack

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
