# Horizon CS Server Manager

A real-time Counter-Strike server monitoring and management system that receives UDP log data from CS servers, stores it in a PostgreSQL database, and displays live server information through a React-based web interface.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start with Docker](#quick-start-with-docker-recommended)
- [Docker Deployment](#docker-deployment)
- [Manual Installation](#manual-installation-without-docker)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Configuration Files](#configuration-files)
- [Development](#development)
- [Testing](#testing)
- [Changes](#changes)

## Features

- **Real-time Server Monitoring**: Receives and processes UDP log data from Counter-Strike servers
- **Live Score Tracking**: Monitors CT and Terrorist team scores in real-time
- **Player Activity**: Tracks active players and their team assignments
- **Admin Request Detection**: Automatically detects when players request admin assistance
- **WebSocket Communication**: Pushes live updates to all connected clients
- **Multi-Server Support**: Track and manage multiple CS servers simultaneously
- **PostgreSQL Database**: Persistent storage of server states and game data
- **Docker Containerization**: One-command deployment with automatic database setup
- **LAN Deployment Ready**: Pre-configured for multi-client event deployments

## Tech Stack

### Backend
- **ASP.NET Core 6.0** - Web host and API framework
- **Entity Framework Core** - ORM for database operations
- **PostgreSQL 14** (via Npgsql) - Database with automatic schema initialization
- **WebSockets** - Real-time bidirectional communication
- **UDP Server** - Receives game server log data

### Frontend
- **React 18** - UI framework
- **React Scripts** - Build tooling
- **WebSockets** - Real-time data updates

### Infrastructure
- **Docker & Docker Compose** - Containerization and orchestration
- **Alpine Linux** - Minimal base images for production
- **pgAdmin 4** - Database management (development)

## Quick Start with Docker (Recommended)

The easiest way to get started is with Docker. This handles all dependencies automatically.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- Ports 5000 (HTTP/WebSocket) and 12345 (UDP) available

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Horizon-CS-Server-Manager
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   nano .env  # Set secure passwords
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Access the dashboard**
   - Web Interface: http://localhost:5000
   - Database Admin (dev): `docker-compose --profile dev up -d` then http://localhost:5050

That's it! The application is now running with PostgreSQL database fully configured.

## Docker Deployment

### Common Commands

```bash
# Start all services
docker-compose up -d

# Start with pgAdmin (database management tool)
docker-compose --profile dev up -d

# View logs
docker-compose logs -f app          # Application logs
docker-compose logs -f postgres     # Database logs

# Stop all services
docker-compose down

# Stop and remove all data (including database)
docker-compose down -v

# Rebuild after code changes
docker-compose build --no-cache
docker-compose up -d

# Check service health
docker-compose ps
```

### LAN Deployment with Docker

Docker makes LAN deployment even easier:

1. **Find your server IP:**
   ```bash
   # macOS/Linux:
   ifconfig | grep "inet "
   # Windows:
   ipconfig
   ```

2. **Start Docker containers:**
   ```bash
   docker-compose up -d
   ```

3. **Configure firewall:**
   - Port 5000/tcp (HTTP/WebSocket)
   - Port 12345/udp (CS server logs)

4. **Clients connect to:** `http://YOUR_SERVER_IP:5000`

The application is pre-configured to bind to all network interfaces (`0.0.0.0`), so no additional configuration is needed.

### Database Management

**Connect to PostgreSQL directly:**
```bash
docker-compose exec postgres psql -U horizonuser -d horizon
```

**Useful database commands:**
```sql
-- View all servers
SELECT * FROM "Servers";

-- View all players and their teams
SELECT p."Name", t."Name" as "Team"
FROM "Players" p
JOIN "Teams" t ON p."TeamId" = t."Id";

-- Clear all data (reset)
TRUNCATE TABLE "Servers", "Teams", "Players" CASCADE;
```

**Backup database:**
```bash
docker-compose exec postgres pg_dump -U horizonuser horizon > backup.sql
```

**Restore database:**
```bash
docker-compose exec -T postgres psql -U horizonuser horizon < backup.sql
```

### Troubleshooting Docker

**Container won't start:**
```bash
# Check logs for errors
docker-compose logs app

# Verify port availability
netstat -an | grep 5000
netstat -an | grep 12345
```

**Database connection issues:**
```bash
# Check if postgres is healthy
docker-compose ps

# Verify database is initialized
docker-compose exec postgres psql -U horizonuser -d horizon -c "\dt"
```

**Rebuild after code changes:**
```bash
# Full rebuild (recommended after C# or React changes)
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Reset everything:**
```bash
# Warning: This deletes all data
docker-compose down -v
docker-compose up -d
```

## Manual Installation (Without Docker)

If you prefer not to use Docker, you can install dependencies manually.

### Prerequisites

- .NET 6.0 SDK or later
- Node.js 14+ and npm
- PostgreSQL 12+ database

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Horizon-CS-Server-Manager
   ```

2. **Setup PostgreSQL database**

   Create a database and run the schema:
   ```bash
   psql -U postgres -c "CREATE DATABASE horizon;"
   psql -U postgres -d horizon -f init.sql
   ```

3. **Configure the database connection**
   ```bash
   cp appsettings_Template.json appsettings.json
   ```

   Edit `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=horizon;Username=your_username;Password=your_password;"
     },
     "Server": {
       "Urls": "http://0.0.0.0:5000"
     }
   }
   ```

4. **Install frontend dependencies and build**
   ```bash
   npm install
   npm run build
   ```

5. **Run the application**
   ```bash
   dotnet run
   ```

The application will start on http://localhost:5000

## Usage

### How It Works

The application has two main components running concurrently:
- **UDP Server**: Listens on port 12345 for incoming Counter-Strike server log data
- **Web Server**: Serves the React dashboard and WebSocket endpoint on port 5000

When CS servers send UDP logs, the data is parsed, stored in PostgreSQL, and broadcast in real-time via WebSocket to all connected web clients.

### Connecting Counter-Strike Servers

Configure your CS servers to send UDP log data to the machine running Horizon CS Server Manager:

```
Server IP: <your_server_ip>
UDP Port: 12345
```

The server will automatically parse team scores, player information, maps, rounds, and admin requests.

### Accessing the Dashboard

**Local access:**
```
http://localhost:5000
```

**LAN access (other devices on network):**
```
http://YOUR_SERVER_IP:5000
```

Find your server IP:
```bash
# macOS/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig | findstr IPv4
```

### Firewall Configuration

Ensure these ports are open on your server:
- **Port 5000/tcp** - HTTP and WebSocket connections
- **Port 12345/udp** - CS server log reception

**macOS:**
```bash
# Allow incoming connections in System Preferences → Security & Privacy → Firewall
```

**Linux:**
```bash
sudo ufw allow 5000/tcp
sudo ufw allow 12345/udp
```

**Windows:**
```bash
# Windows Defender Firewall → Allow an app → Add "horizon" or "dotnet.exe"
```

### Advanced WebSocket Configuration

For complex network setups, override WebSocket connection settings:

1. Edit `.env`:
   ```env
   REACT_APP_WS_HOST=192.168.1.100
   REACT_APP_WS_PORT=5000
   ```

2. Rebuild frontend:
   ```bash
   # Docker:
   docker-compose build app && docker-compose up -d app

   # Manual:
   npm run build && dotnet run
   ```

### Testing with Mock Data

Simulate CS server logs without a real game server:

```bash
# Install dependencies (if not using Docker)
npm install

# Send mock UDP data
npm run send
```

Watch the dashboard update in real-time as mock data is received.

### Troubleshooting

**Can't access from other devices:**
- Verify server is bound to `0.0.0.0` (not `localhost`)
- Check firewall allows port 5000/tcp
- Ensure devices are on same network
- Try accessing: `http://SERVER_IP:5000`

**WebSocket connection fails:**
- Open browser console (F12) and check for errors
- Verify WebSocket URL shows correct server IP
- Check port 5000 isn't blocked by firewall

**No data appearing:**
- Verify CS server is sending to correct IP and port 12345
- Check application logs: `docker-compose logs -f app` or console output
- Test with mock data: `npm run send`
- Verify database has data: `docker-compose exec postgres psql -U horizonuser -d horizon -c "SELECT * FROM \"Servers\";"`

## Project Structure

```
├── Classes/                    # Business logic classes
├── Data/                       # Database context and models
│   └── Models/                # Entity models (Servers, Teams, Players)
├── Interfaces/                 # Interface definitions
├── Processors/                 # Data processing logic (UDP message parsing)
├── public/                    # Static assets for React app
├── src/                       # React frontend source
│   ├── setupTests.js          # Jest/Testing Library setup
│   └── components/            # React components (with co-located tests)
├── Program.cs                 # Application entry point
├── Startup.cs                 # Service configuration and middleware
├── UdpServer.cs               # UDP listener implementation
├── sender.js                  # Test utility for simulating server data
├── Dockerfile                 # Multi-stage Docker build
├── docker-compose.yml         # Service orchestration
├── init.sql                   # Database schema initialization
├── .dockerignore              # Docker build context optimization
├── .env.example               # Environment configuration template
└── horizon.csproj             # .NET project configuration
```

## Configuration Files

### Docker Environment (Recommended)
- `.env` - Environment variables for docker-compose (gitignored, copy from `.env.example`)
  - Database passwords
  - pgAdmin credentials
  - Optional WebSocket overrides

### Manual Installation
- `appsettings.json` - ASP.NET Core configuration (gitignored, copy from `appsettings_Template.json`)
  - Database connection string
  - Server URLs
- `init.sql` - Database schema (automatically applied in Docker, manually run for local setup)

### Development
- `nodemon.json` - Development server configuration
- `horizon.csproj` - .NET project dependencies and build settings
- `package.json` - Node.js dependencies and scripts

## Development

### Docker Development (Recommended)

**Start development environment:**
```bash
docker-compose --profile dev up -d    # Start with pgAdmin
docker-compose logs -f app            # Follow application logs
```

**After making code changes:**
```bash
docker-compose build app              # Rebuild application
docker-compose up -d app              # Restart with new code
```

**Database management:**
```bash
docker-compose exec postgres psql -U horizonuser -d horizon   # Connect to database
# Then access pgAdmin at http://localhost:5050
```

### Local Development (Without Docker)

**Frontend development:**
```bash
npm start           # Start React development server (port 3000)
npm run build       # Build production bundle
npm test            # Run tests
```

**Backend development:**
```bash
dotnet run          # Run the application (port 5000)
dotnet build        # Build the project
dotnet watch run    # Run with hot reload
```

**Test UDP reception:**
```bash
npm run send        # Send mock CS server data via UDP
```

## Testing

The project includes unit tests for both backend and frontend components.

### Running Tests

**Backend tests (C# / xUnit):**
```bash
./run-tests.sh                          # Quick run
./run-tests.sh --verbose                # Detailed output
./run-tests.sh --coverage               # With coverage report
./run-tests.sh --filter RegexPattern    # Only regex tests
```

**Frontend tests (Jest / React Testing Library):**
```bash
CI=true npm test                        # Quick run
CI=true npm test -- --verbose           # Detailed output
```

**Using dotnet CLI directly:**
```bash
dotnet test                                              # Run all backend tests
dotnet test --verbosity normal                           # Detailed output
dotnet test --filter "FullyQualifiedName~RegexPatternTests"  # Specific test class
dotnet test --collect:"XPlat Code Coverage"              # Generate coverage
```

### Test Coverage

**Backend - Regex Pattern Tests** (`RegexPatternTests.cs`):
- ✅ Score parsing (CT/TERRORIST teams)
- ✅ Map and rounds extraction
- ✅ Admin request detection (case-insensitive)
- ✅ Player name and team parsing
- ✅ Edge cases and invalid input handling

**Backend - WebSocket Message Tests** (`WebSocketMessageTests.cs`):
- ✅ Message serialization/deserialization
- ✅ Type and payload handling
- ✅ UPDATE, NEW_USER, ADMIN_SWITCH message types
- ✅ Complex nested payloads
- ✅ Null handling

**Frontend - Server Component Tests** (`Server.test.jsx`):
- ✅ Renders server IP, scores, and map
- ✅ Player dropdown toggle visibility
- ✅ Admin flag icon display and WebSocket toggle
- ✅ Blocked admin toggle when disconnected
- ✅ Disabled styling when not connected

**Frontend - ServerContainer Tests** (`ServerContainer.test.jsx`):
- ✅ Connection status indicator (connected/connecting/disconnected)
- ✅ WebSocket message handling (SERVERS, UPDATE, ADMIN_UPDATE)
- ✅ Reconnect with exponential backoff on abnormal close
- ✅ No reconnect on clean close (code 1000)
- ✅ Stale data preservation during reconnect
- ✅ WebSocket and timer cleanup on unmount

### Test Structure

```
horizon.Tests/                           # Backend tests (xUnit)
├── Helpers/
│   └── MockUdpData.cs                  # Mock CS server log samples
├── Interfaces/
│   └── WebSocketMessageTests.cs        # WebSocket message tests
├── Processors/
│   └── RegexPatternTests.cs            # UDP log parsing tests
└── README.md                            # Detailed testing documentation

src/                                     # Frontend tests (Jest)
├── setupTests.js                        # Jest/Testing Library setup
└── components/
    ├── Server/Server.test.jsx           # Server component tests (9 tests)
    └── ServerContainer/
        └── ServerContainer.test.jsx     # ServerContainer tests (19 tests)
```

### Writing New Tests

**Backend** - Tests use xUnit with FluentAssertions:

```csharp
[Fact]
public void MyTest()
{
    var data = MockUdpData.CtScoreUpdate;
    var result = ProcessData(data);
    result.Should().NotBeNull();
    result.ScoreCt.Should().Be(10);
}
```

**Frontend** - Tests use Jest with React Testing Library:

```jsx
test("renders server data", () => {
    render(<ServerContainer />);
    act(() => {
        latestWs().simulateOpen();
        latestWs().simulateMessage({ type: "SERVERS", payload: [sampleServer] });
    });
    expect(screen.getByText("de_dust2")).toBeInTheDocument();
});
```

See `horizon.Tests/README.md` for comprehensive backend testing documentation.

## Changes

### 2026-03-03 - Docker Containerization

#### Overview
Complete Docker containerization for one-command deployment and reproducible environments across development and production.

#### Implementation
- **Multi-Stage Dockerfile**:
  - Stage 1: Node.js 18 Alpine for React frontend build
  - Stage 2: .NET SDK 6.0 Alpine for backend compilation
  - Stage 3: ASP.NET 6.0 Alpine runtime with security hardening (non-root user)
  - Final image size: ~200MB

- **Docker Compose Services**:
  - `postgres`: PostgreSQL 14 Alpine with automatic schema initialization
  - `app`: Horizon application with health checks and dependency management
  - `pgadmin`: Database management UI (dev profile only)

- **Database Initialization**: Created `init.sql` with schema based on EF Core models
  - Automatically executed on first container startup
  - Eliminates manual database setup
  - Creates tables: Servers, Teams, Players with proper indexes and foreign keys

- **Configuration Management**:
  - Environment variables via `.env` file (gitignored)
  - ASP.NET Core configuration injection using double-underscore notation
  - No configuration files needed in container images

#### Files Added
- `Dockerfile` - Multi-stage build definition
- `docker-compose.yml` - Service orchestration with networking and volumes
- `init.sql` - PostgreSQL schema initialization script
- `.dockerignore` - Build context optimization
- `.env.example` - Configuration template with Docker environment variables

#### Files Updated
- `README.md` - Comprehensive Docker deployment guide, restructured for Docker-first approach
- `CLAUDE.md` - Docker architecture documentation and development workflows

#### Benefits
- ✅ One-command deployment: `docker-compose up -d`
- ✅ Reproducible environments across all platforms
- ✅ Automatic database setup with schema initialization
- ✅ LAN deployment ready with 0.0.0.0 binding
- ✅ Development tools included (pgAdmin with `--profile dev`)
- ✅ Security hardened with non-root execution
- ✅ Production ready with health checks and restart policies

---

### 2026-03-03 - LAN Support & Network Configuration

#### LAN Deployment Features
- **Dynamic WebSocket URLs**: Frontend now automatically connects to the correct server
  - Uses `window.location.hostname` to detect server IP dynamically
  - Supports environment variable override via `.env` file
  - Eliminates hardcoded `localhost` references
- **Network Binding**: Backend configured to listen on all network interfaces
  - Server binds to `0.0.0.0:5000` by default (configurable via `appsettings.json`)
  - Allows connections from any machine on the LAN
- **CORS Support**: Added Cross-Origin Resource Sharing configuration
  - Enables browser requests from different origins
  - Required for LAN access from other machines
- **Documentation**: Added comprehensive LAN deployment guide
  - Step-by-step server setup instructions
  - Client access configuration
  - Firewall setup for macOS, Windows, and Linux
  - Troubleshooting guide for common connection issues

#### Files Updated
- `src/components/ServerContainer/ServerContainer.jsx`: Dynamic WebSocket URL generation
- `Program.cs`: Network binding configuration with `UseUrls`
- `Startup.cs`: CORS middleware and policy configuration
- `appsettings.json` & `appsettings_Template.json`: Server URL configuration
- `.env.example`: WebSocket configuration template
- `README.md`: LAN deployment section with troubleshooting

**Network Impact**: Application now works seamlessly across LAN for multi-client deployments at events

---

### 2026-03-03 - Security & Code Quality Improvements

#### Security Fixes
- **SQL Injection Prevention**: Converted all database queries to use parameterized queries
  - `Startup.cs`: Updated admin flag update query to use parameters
  - `UdpDataProcessor.cs`: Converted all 5 database update queries to parameterized format
- **Configuration Security**: Removed hardcoded database credentials from source code
  - Centralized database connection string in `appsettings.json` (gitignored)
  - Updated all files to use configuration-based connection strings

#### Code Quality Improvements
- **Type Safety**: Added `IWebSocketMessage` interface for WebSocket message handling
  - Created `Interfaces/IWebSocketMessage.cs` with typed message structure
  - Updated `Startup.cs` to use `WebSocketMessage` class instead of anonymous objects
  - Removed TODO comment about type enforcement
- **Code Cleanup**: Removed outdated TODO comments in `UdpDataProcessor.cs`
  - Player array implementation was already complete

#### Project Maintenance
- **Package.json**: Removed references to non-existent scripts (`dev`, `reset`)
- **File Cleanup**: Deleted empty test file (`newtest`)
- **Documentation**: Created comprehensive README.md and CLAUDE.md

#### Files Updated
- `Startup.cs`: Parameterized queries, interface usage, configuration injection
- `UdpDataProcessor.cs`: Parameterized queries, removed TODOs
- `UdpServer.cs`: Connection string injection
- `Program.cs`: Configuration builder implementation
- `package.json`: Cleaned up script references
- `Interfaces/IWebSocketMessage.cs`: New interface for type safety
- `CLAUDE.md`: Created project documentation for AI assistance
- `README.md`: Added comprehensive project documentation

**Security Impact**: Eliminated SQL injection vulnerabilities and ensured credentials are never committed to version control

---

### 2026-03-03 - Frontend Improvements & Tests

#### WebSocket Reconnection
- **Automatic reconnect**: Exponential backoff with jitter on abnormal WebSocket close
- **Connection status indicator**: Visual dot + text showing Connected/Reconnecting/Disconnected
- **Stale data preservation**: Last known server data remains visible during reconnect
- **Disabled admin controls**: Admin toggle is visually disabled and blocked when disconnected
- **Clean cleanup**: Timers and WebSocket connections properly cleaned up on component unmount

#### Frontend Test Suite (28 tests)
- **Server component** (9 tests): Rendering, dropdown toggle, admin flag icons, WebSocket send/block, disabled styling
- **ServerContainer component** (19 tests): Connection status states, WebSocket message handling (SERVERS/UPDATE/ADMIN_UPDATE), reconnect backoff, clean close behavior, stale data preservation, unmount cleanup
- **MockWebSocket class**: Reusable WebSocket mock with `simulateOpen()`, `simulateMessage()`, `simulateClose()` helpers

#### Files Added
- `src/setupTests.js` - Jest/Testing Library setup
- `src/components/Server/Server.test.jsx` - Server component tests
- `src/components/ServerContainer/ServerContainer.test.jsx` - ServerContainer tests with WebSocket mock

#### Files Updated
- `src/components/ServerContainer/ServerContainer.jsx` - WebSocket reconnection logic, connection status state, ESLint fix
- `src/components/ServerContainer/ServerContainer.css` - Connection status indicator styles, status message styles
- `src/components/Server/Server.jsx` - Disabled admin toggle when disconnected, code cleanup
- `README.md` - Updated testing section and changelog
- `CLAUDE.md` - Updated test files, testing section, removed completed TODOs
