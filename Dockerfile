# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/ChatApp/ChatApp.csproj src/ChatApp/
RUN dotnet restore src/ChatApp/ChatApp.csproj

COPY . .
RUN dotnet publish src/ChatApp/ChatApp.csproj -c Release -o /app /p:UseAppHost=false

# ---- Runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Run as the non-root user provided by the base image.
USER $APP_UID

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

COPY --from=build /app .

ENTRYPOINT ["dotnet", "ChatApp.dll"]
