# Container image for the indicator API, deployed to Cloudflare Containers.
#
# Build context is the `server/` directory (see server/edge/wrangler.jsonc).
# Cloudflare Containers require linux/amd64.

# Builds on the host's native architecture: `dotnet publish` without a --runtime
# emits portable IL, so no emulation is needed here (notably faster on Apple
# Silicon). Only the runtime stage is pinned to the architecture Cloudflare runs.
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first so the layer caches across source-only changes. Both Directory.*
# props files are evaluated during restore, so they precede it: Build.props
# carries TargetFramework and the analyzer settings, Packages.props the versions.
COPY Directory.Build.props Directory.Packages.props ./
COPY WebApi/WebApi.csproj WebApi/packages.lock.json WebApi/
RUN dotnet restore WebApi/WebApi.csproj --locked-mode

COPY WebApi/ WebApi/
RUN dotnet publish WebApi/WebApi.csproj \
    --configuration Release \
    --no-restore \
    --output /app

# Pinned deliberately: Cloudflare Containers only run linux/amd64. This trips
# Docker's FromPlatformFlagConstDisallowed advisory, which assumes a portable
# image; this one is intentionally not portable.
FROM --platform=linux/amd64 mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app ./

# TLS terminates at the edge; the Worker reaches this container over plain HTTP.
ENV ASPNETCORE_URLS=http://+:8080

# Drop root. The .NET base images ship a non-root `app` user (UID 1654) for
# exactly this; the API only ever reads from its own image.
USER $APP_UID

EXPOSE 8080
ENTRYPOINT ["dotnet", "WebApi.dll"]
