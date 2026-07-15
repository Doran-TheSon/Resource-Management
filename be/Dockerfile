# ====================== STAGE 1: Build ======================
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy dependency descriptor first — tận dụng Docker cache
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source & build
COPY src ./src
RUN mvn package -DskipTests -B

# ====================== STAGE 2: Runtime ======================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy jar từ stage build
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

# Mặc định kích hoạt profile "docker"
ENV SPRING_PROFILES_ACTIVE=docker

ENTRYPOINT ["java", "-jar", "app.jar"]
