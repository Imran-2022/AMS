# syntax=docker/dockerfile:1

########################
# Build stage
########################
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files first so `dotnet restore` is cached unless dependencies change
COPY src/AMS.Domain.Shared/AMS.Domain.Shared.csproj src/AMS.Domain.Shared/
COPY src/AMS.Domain/AMS.Domain.csproj src/AMS.Domain/
COPY src/AMS.Application.Contracts/AMS.Application.Contracts.csproj src/AMS.Application.Contracts/
COPY src/AMS.Application/AMS.Application.csproj src/AMS.Application/
COPY src/AMS.Infrastructure/AMS.Infrastructure.csproj src/AMS.Infrastructure/
COPY src/AMS.EntityFrameworkCore/AMS.EntityFrameworkCore.csproj src/AMS.EntityFrameworkCore/
COPY src/AMS.HttpApi/AMS.HttpApi.csproj src/AMS.HttpApi/
COPY src/AMS.HttpApi.Host/AMS.HttpApi.Host.csproj src/AMS.HttpApi.Host/
COPY src/AMS.DbMigrator/AMS.DbMigrator.csproj src/AMS.DbMigrator/

RUN dotnet restore src/AMS.HttpApi.Host/AMS.HttpApi.Host.csproj \
 && dotnet restore src/AMS.DbMigrator/AMS.DbMigrator.csproj

# Now copy the rest of the source and publish both apps
COPY src/ src/

RUN dotnet publish src/AMS.HttpApi.Host/AMS.HttpApi.Host.csproj -c Release -o /app/api --no-restore
RUN dotnet publish src/AMS.DbMigrator/AMS.DbMigrator.csproj -c Release -o /app/migrator --no-restore

########################
# Runtime: API
########################
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS api
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
RUN mkdir -p /app/App_Data/Uploads
COPY --from=build /app/api .
ENTRYPOINT ["dotnet", "AMS.HttpApi.Host.dll"]

########################
# Runtime: DB migrator + seeder (one-shot)
########################
FROM mcr.microsoft.com/dotnet/runtime:10.0 AS migrator
WORKDIR /app
COPY --from=build /app/migrator .
ENTRYPOINT ["dotnet", "AMS.DbMigrator.dll"]
