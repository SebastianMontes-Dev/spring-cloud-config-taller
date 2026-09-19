# Dockerfile generico: se construye desde la raiz del repo indicando el modulo.
#   docker build -f extras/docker/Dockerfile --build-arg MODULE=config-server .
FROM eclipse-temurin:21-jdk-alpine AS build
ARG MODULE
WORKDIR /src
COPY ${MODULE}/ ./
RUN chmod +x mvnw && ./mvnw -q -B -DskipTests package

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /src/target/*.jar app.jar
USER app
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
