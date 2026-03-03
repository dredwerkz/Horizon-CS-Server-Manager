# Stage 1: Frontend Build
# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine AS frontend-build

# Set working directory
WORKDIR /app

# Copy package files for layer caching optimization
COPY package*.json ./

# Install dependencies with npm ci for faster, deterministic installs
RUN npm ci --silent

# Copy React source files
COPY public/ ./public/
COPY src/ ./src/

# Build React production bundle
RUN npm run build

# Stage 2: Backend Build
# Use .NET 8.0 SDK Alpine for building
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS backend-build

# Set working directory
WORKDIR /app

# Copy csproj and restore dependencies (layer caching)
COPY *.csproj ./
RUN dotnet restore

# Copy all source code
COPY . ./

# Copy the built React frontend from Stage 1
COPY --from=frontend-build /app/build ./wwwroot

# Publish the application in Release mode
RUN dotnet publish -c Release -o out --runtime alpine-x64 --self-contained false

# Stage 3: Runtime
# Use minimal ASP.NET runtime Alpine image
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime

# Create non-root user for security
RUN adduser -D -u 1000 appuser

# Set working directory
WORKDIR /app

# Copy published output from Stage 2
COPY --from=backend-build /app/out .

# Set ownership to non-root user
RUN chown -R appuser:appuser /app

# Expose ports
# 5000: HTTP/WebSocket
# 12345: UDP listener for CS server logs
EXPOSE 5000/tcp
EXPOSE 12345/udp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/ || exit 1

# Switch to non-root user
USER appuser

# Set entrypoint
ENTRYPOINT ["dotnet", "horizon.dll"]
