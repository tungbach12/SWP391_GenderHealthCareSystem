# --- STAGE 1: BUILD JAR ---
FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml trước để cache dependency
COPY pom.xml .

RUN mvn -q -DskipTests dependency:go-offline

# Copy source code
COPY src ./src

# Build jar (tạo target/Group4Project-0.0.1-SNAPSHOT.jar)
RUN mvn -q -DskipTests package


# --- STAGE 2: RUN JAR ---
FROM eclipse-temurin:17-jre

WORKDIR /app

# Copy đúng file jar mà Dockerfile cũ bạn đang dùng
COPY --from=build /app/target/Group4Project-0.0.1-SNAPSHOT.jar app.jar

# Render sẽ truyền PORT, để default 8080
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
