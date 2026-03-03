# Claude Instructions for Horizon CS Server Manager

## Project Overview

This is a real-time Counter-Strike server monitoring system with:
- **Backend**: ASP.NET Core 6.0 with UDP listener for game server logs
- **Frontend**: React 18 application with WebSocket integration
- **Database**: PostgreSQL with Entity Framework Core
- **Architecture**: Multi-threaded (UDP listener + web host) with real-time WebSocket broadcasting

## Critical Security Rules

1. **NEVER hardcode database credentials** - Always use `appsettings.json` with `Configuration.GetConnectionString("DefaultConnection")`
2. **Always use parameterized queries** - All database operations use parameterized queries to prevent SQL injection. When adding new database code, follow this pattern:
   ```csharp
   using var cmd = new NpgsqlCommand("INSERT INTO \"Table\" (\"Column\") VALUES (@Param)", connection);
   cmd.Parameters.AddWithValue("@Param", value);
   ```
3. **Configuration files** - `appsettings.json` and `.env` are gitignored. Always use templates (`appsettings_Template.json`, `.env_TEMPLATE`) as reference

## Code Conventions

### C# Backend
- Use nullable reference types (`# nullable enable` is used in some files)
- Follow async/await patterns for I/O operations
- Use dependency injection where possible
- RegEx patterns are pre-compiled as readonly fields
- Database operations should use the injected connection string

### React Frontend
- Functional components with hooks
- JSX file extension for components
- CSS modules per component
- WebSocket connection for real-time updates

## Network Configuration

### LAN Deployment
The application is designed for LAN deployment to support multiple clients at events:

- **Backend**: Binds to `0.0.0.0:5000` (all network interfaces) configured in `appsettings.json`
- **Frontend**: Uses dynamic WebSocket URLs based on `window.location.hostname`
- **CORS**: Enabled with `AllowAll` policy to support cross-origin requests from LAN clients
- **Firewall**: Port 5000 (HTTP/WebSocket) and 12345 (UDP) must be open on the server

### WebSocket URL Resolution
The frontend dynamically determines the WebSocket URL:
```javascript
const hostname = process.env.REACT_APP_WS_HOST || window.location.hostname;
const port = process.env.REACT_APP_WS_PORT || '5000';
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const URL = `${protocol}//${hostname}:${port}/ws`;
```

This allows:
- Automatic connection when accessing via server IP
- Environment variable override for special network configurations
- Support for both HTTP and HTTPS deployments

## Architecture Notes

### UDP Data Flow
1. CS servers send UDP logs to port 12345
2. `UdpServer.cs` receives and passes to `UdpDataProcessor.cs`
3. `UdpDataProcessor.cs` parses log data using regex patterns:
   - Team scores (CT/TERRORIST)
   - Map and rounds played
   - Player names and team assignments
   - Admin request detection
4. Data is saved to PostgreSQL
5. Updates are broadcast via WebSocket to all connected clients

### WebSocket Flow
1. Clients connect to WebSocket endpoint
2. Send `{"type": "NEW_USER"}` to receive initial server data
3. Receive real-time updates with `{"type": "UPDATE", "payload": {...}}`
4. Admin control with `{"type": "ADMIN_SWITCH", "payload": {...}}`

### Current Threading Model
```csharp
// Program.cs creates two concurrent operations:
var udpServer = new UdpServer(connectionString);
var udpThread = new Thread(udpServer.Start);  // Background UDP listener
udpThread.Start();
CreateWebHostBuilder(args).Build().Run();      // Main web host
```

## Docker Architecture

The application is fully containerized for easy deployment and reproducible environments.

### Container Services

**postgres service:**
- Image: `postgres:14-alpine`
- Purpose: PostgreSQL database with automatic schema initialization
- Volume: `postgres-data` for data persistence
- Init Script: `init.sql` creates schema on first startup
- Health Check: `pg_isready` ensures database is ready before app starts

**app service:**
- Multi-stage build: Node.js frontend build → .NET backend build → Alpine runtime
- Depends on postgres health check
- Environment: Configuration injected via docker-compose environment variables
- Ports: 5000/tcp (HTTP/WebSocket), 12345/udp (CS logs)
- Security: Runs as non-root user (UID 1000)

**pgadmin service (dev only):**
- Image: `dpage/pgadmin4:latest`
- Profile: `dev` (only starts with `--profile dev` flag)
- Purpose: Web-based database management UI
- Port: 5050

### Dockerfile Build Stages

**Stage 1 - Frontend Build:**
```dockerfile
FROM node:18-alpine AS frontend-build
# Layer caching: package.json → npm ci → source → build
COPY package*.json ./
RUN npm ci --silent
COPY public/ src/ ./
RUN npm run build
# Output: /build directory
```

**Stage 2 - Backend Build:**
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:6.0-alpine AS backend-build
# Layer caching: csproj → restore → source → publish
COPY *.csproj ./
RUN dotnet restore
COPY . ./
COPY --from=frontend-build /app/build ./wwwroot
RUN dotnet publish -c Release -o out
# Output: /app/out directory
```

**Stage 3 - Runtime:**
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:6.0-alpine AS runtime
# Security: Non-root user
RUN adduser -D -u 1000 appuser
COPY --from=backend-build /app/out .
USER appuser
# Health check on port 5000
EXPOSE 5000/tcp 12345/udp
ENTRYPOINT ["dotnet", "horizon.dll"]
```

### Configuration Injection

Docker uses environment variables to configure the application:

```yaml
environment:
  # ASP.NET Core uses double-underscore notation for nested config
  ConnectionStrings__DefaultConnection: "Host=postgres;Database=horizon;..."
  Server__Urls: "http://0.0.0.0:5000"
  ASPNETCORE_ENVIRONMENT: "Production"
```

This overrides `appsettings.json` without needing configuration files in the container.

### Database Initialization

PostgreSQL automatically executes `/docker-entrypoint-initdb.d/init.sql` on first startup (when data volume is empty):

```sql
-- init.sql creates schema based on EF Core models
CREATE TABLE "Servers" (...);
CREATE TABLE "Teams" (...);
CREATE TABLE "Players" (...);
CREATE INDEX "IX_Players_TeamId" ON "Players"("TeamId");
```

This eliminates manual database setup or EF Core migrations in Docker environments.

### Network Architecture

```
┌─────────────────────────────────────────────┐
│ Host Machine                                 │
│                                              │
│  Port 5000 (HTTP/WebSocket) ────┐          │
│  Port 12345 (UDP Logs)     ─────┼──┐       │
│  Port 5050 (pgAdmin)       ─────┼──┼──┐    │
└──────────────────────────────────┼──┼──┼────┘
                                   │  │  │
       ┌───────────────────────────┘  │  │
       │  ┌───────────────────────────┘  │
       │  │  ┌───────────────────────────┘
       ▼  ▼  ▼
┌──────────────────────────────────────────────┐
│ Docker Network: horizon-network (bridge)     │
│                                               │
│  ┌─────────────┐  ┌─────────────┐           │
│  │ app:5000    │  │ postgres    │           │
│  │ app:12345   │──┤ :5432       │           │
│  └─────────────┘  └─────────────┘           │
│         │                                     │
│  ┌──────┴─────────┐                         │
│  │ pgadmin:80     │                         │
│  └────────────────┘                         │
└──────────────────────────────────────────────┘
```

## File Structure

### Backend Core Files
- `Program.cs` - Entry point, configuration setup, thread management
- `Startup.cs` - Service configuration, middleware, WebSocket handling
- `UdpServer.cs` - UDP listener on port 12345
- `Processors/UdpDataProcessor.cs` - Log parsing and database updates
- `Data/HorizonDbContext.cs` - EF Core database context
- `Data/Models/` - Entity models (Servers, Teams, Players)

### Frontend
- `src/components/App/App.js` - Root component
- `src/components/ServerContainer/` - Server list display
- `src/components/Server/` - Individual server component
- `src/components/ControlPanel/` - Admin controls

### Configuration & Utilities
- `sender.js` - Test utility to simulate CS server log messages
- `nodemon.json` - Development configuration
- `package.json` - Frontend dependencies and scripts

### Docker Files
- `Dockerfile` - Multi-stage build (Node → .NET → Alpine runtime)
- `docker-compose.yml` - Service orchestration (postgres, app, pgadmin)
- `init.sql` - Database schema initialization script
- `.dockerignore` - Build context optimization
- `.env.example` - Environment variable template (copy to `.env`)

### Test Files
- `horizon.Tests/` - Backend test project directory
  - `Processors/RegexPatternTests.cs` - Tests for UDP log parsing regex patterns
  - `Interfaces/WebSocketMessageTests.cs` - Tests for WebSocket message handling
  - `Helpers/MockUdpData.cs` - Mock CS server log data for testing
  - `horizon.Tests.csproj` - Test project configuration
- `run-tests.sh` - Backend test runner script with coverage support
- `src/setupTests.js` - Jest/Testing Library setup for frontend tests
- `src/components/Server/Server.test.jsx` - Server component unit tests
- `src/components/ServerContainer/ServerContainer.test.jsx` - ServerContainer component unit tests (WebSocket mock, reconnection logic)

## Known Issues & TODOs

Currently no known critical issues. All SQL injection vulnerabilities have been fixed and code quality improvements have been implemented.

### Potential Future Enhancements
- Consider implementing Entity Framework queries instead of raw SQL for better maintainability
- Add more comprehensive error handling and logging

## Development Workflows

### Adding New Database Fields
1. Update model in `Data/Models/`
2. Update regex/parsing in `UdpDataProcessor.cs` if needed
3. Add database update logic in `UpdateDatabase()`
4. Ensure connection string is passed through (don't hardcode!)
5. Update WebSocket broadcast payload if needed

### Modifying WebSocket Messages
1. Update parsing in `Startup.cs` `Echo()` method
2. Match message type structure: `{"type": "TYPE_NAME", "payload": {...}}`
3. Update React components to handle new message types
4. Test with `sender.js` for mock data

### Database Connection Pattern
```csharp
// Always use this pattern:
await using var connection = new NpgsqlConnection(_connectionString);
await connection.OpenAsync();

// NEVER hardcode:
// new NpgsqlConnection("Host=localhost;Database=postgres;..."); ❌
```

### Parameterized Query Pattern
```csharp
// Always use parameterized queries:
using var cmd = new NpgsqlCommand("INSERT INTO \"Servers\" (\"ServerKey\", \"ScoreCt\") VALUES (@ServerKey, @ScoreCt)", connection);
cmd.Parameters.AddWithValue("@ServerKey", serverKey);
cmd.Parameters.AddWithValue("@ScoreCt", score);
cmd.ExecuteNonQuery();

// NEVER use string interpolation:
// new NpgsqlCommand($"INSERT INTO \"Servers\" VALUES ('{serverKey}', {score})", connection); ❌
```

### WebSocket Message Pattern
```csharp
// Use the IWebSocketMessage interface:
var message = new WebSocketMessage
{
    Type = "UPDATE",
    Payload = data
};
var jsonString = JsonConvert.SerializeObject(message);
```

### Docker Development Workflow

**Starting the environment:**
```bash
docker-compose up -d                    # Start all services
docker-compose --profile dev up -d      # Start with pgAdmin
```

**Making code changes:**

1. **React frontend changes** (src/, public/):
   ```bash
   # Rebuild and restart
   docker-compose build app
   docker-compose up -d app
   ```

2. **C# backend changes** (*.cs files):
   ```bash
   # Rebuild and restart
   docker-compose build app
   docker-compose up -d app
   ```

3. **Database schema changes** (init.sql):
   ```bash
   # WARNING: This deletes all data
   docker-compose down -v              # Remove volumes
   docker-compose up -d                # Recreate with new schema
   ```

**Viewing logs:**
```bash
docker-compose logs -f app              # Follow application logs
docker-compose logs --tail=50 app       # Last 50 lines
docker-compose logs postgres            # Database logs
```

**Database operations:**
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U horizonuser -d horizon

# Run SQL file
docker-compose exec -T postgres psql -U horizonuser -d horizon < query.sql

# Backup database
docker-compose exec postgres pg_dump -U horizonuser horizon > backup.sql

# Restore database
docker-compose exec -T postgres psql -U horizonuser horizon < backup.sql
```

**Testing UDP reception:**
```bash
# From host machine (outside containers)
node sender.js

# Watch for incoming data in logs
docker-compose logs -f app | grep "UDP"
```

**Clean rebuild (when things go wrong):**
```bash
docker-compose down                     # Stop containers
docker-compose build --no-cache         # Rebuild without cache
docker-compose up -d                    # Start fresh
```

**Completely reset everything:**
```bash
docker-compose down -v                  # Remove containers AND volumes
docker-compose build --no-cache         # Rebuild images
docker-compose up -d                    # Fresh start with empty database
```

### Adding New Database Fields (Docker)

When modifying the database schema:

1. Update model in `Data/Models/`
2. Update `init.sql` to match new schema
3. If in development with data you want to keep:
   ```bash
   # Backup first
   docker-compose exec postgres pg_dump -U horizonuser horizon > backup.sql

   # Apply changes and recreate
   docker-compose down -v
   docker-compose up -d

   # Restore data (will fail on conflicting schema, adjust backup.sql as needed)
   docker-compose exec -T postgres psql -U horizonuser horizon < backup.sql
   ```
4. Update parsing/logic in `UdpDataProcessor.cs`
5. Rebuild application:
   ```bash
   docker-compose build app
   docker-compose up -d app
   ```

### Updating Database Schema Without Data Loss

**Option 1: Migration script (recommended for production):**
```bash
# Create migration SQL (example)
cat > migration.sql << 'EOF'
ALTER TABLE "Servers" ADD COLUMN "NewField" VARCHAR(50);
CREATE INDEX "IX_Servers_NewField" ON "Servers"("NewField");
EOF

# Apply migration
docker-compose exec -T postgres psql -U horizonuser horizon < migration.sql
```

**Option 2: Backup, drop, restore (development only):**
```bash
# Backup data
docker-compose exec postgres pg_dump -U horizonuser horizon > backup.sql

# Update init.sql with new schema

# Recreate database
docker-compose down -v
docker-compose up -d

# Modify backup.sql to match new schema, then restore
# (You may need to edit the backup file to remove/adjust incompatible data)
docker-compose exec -T postgres psql -U horizonuser horizon < backup.sql
```

## Testing

### Automated Backend Tests

The project includes comprehensive unit tests for backend components using xUnit, FluentAssertions, and Moq.

**Run all tests:**
```bash
./run-tests.sh                   # Quick run
./run-tests.sh --verbose         # Detailed output
./run-tests.sh --coverage        # With coverage report
./run-tests.sh --filter Regex    # Specific tests
```

**Test structure:**
```
horizon.Tests/
├── Helpers/MockUdpData.cs         # Mock CS server log data
├── Interfaces/WebSocketMessageTests.cs  # WebSocket tests
├── Processors/RegexPatternTests.cs      # Regex parsing tests
└── README.md                      # Detailed testing docs
```

**Test coverage:**
- ✅ Score parsing (CT/TERRORIST teams)
- ✅ Map and rounds extraction
- ✅ Admin request detection (case-insensitive)
- ✅ Player name and team parsing
- ✅ WebSocket message serialization/deserialization
- ✅ Edge cases and invalid input handling

**Testing patterns:**

Always write tests when adding new regex patterns or data processing logic:

```csharp
[Theory]
[InlineData("CT", 10)]
[InlineData("TERRORIST", 7)]
public void NewPattern_ShouldParse_ValidData(string team, int score)
{
    // Arrange
    var message = MockUdpData.CreateScoreMessage(team, score);
    var regex = new Regex(@"your-pattern-here");

    // Act
    var match = regex.Match(message);

    // Assert
    match.Success.Should().BeTrue();
    match.Groups[1].Value.Should().Be(team);
}
```

### Automated Frontend Tests

Frontend tests use Jest with React Testing Library (`@testing-library/react`).

**Run frontend tests:**
```bash
CI=true npm test                     # Quick run
CI=true npm test -- --verbose        # Detailed output
```

**Test structure:**
```
src/
├── setupTests.js                                    # Jest/Testing Library setup
├── components/
│   ├── Server/Server.test.jsx                       # Server component tests (9 tests)
│   └── ServerContainer/ServerContainer.test.jsx     # ServerContainer tests (19 tests)
```

**Server component test coverage:**
- ✅ Renders server IP, scores, and map
- ✅ Player dropdown toggle visibility
- ✅ Admin flag icon display (alert/OK)
- ✅ WebSocket ADMIN_SWITCH message on click
- ✅ Blocked admin toggle when disconnected
- ✅ Disabled styling when disconnected

**ServerContainer component test coverage:**
- ✅ Connection status indicator (connected/connecting/disconnected)
- ✅ NEW_USER handshake on WebSocket open
- ✅ SERVERS, UPDATE, ADMIN_UPDATE message handling
- ✅ Reconnect with exponential backoff on abnormal close
- ✅ No reconnect on clean close (code 1000)
- ✅ Reconnect counter reset after successful reconnect
- ✅ Stale data preservation during reconnect
- ✅ WebSocket and timer cleanup on unmount

**Frontend testing patterns:**

The ServerContainer tests use a `MockWebSocket` class that simulates open/message/close events:

```jsx
// Example: testing a WebSocket message handler
test("renders server data from SERVERS message", () => {
    render(<ServerContainer />);
    act(() => {
        latestWs().simulateOpen();
        latestWs().simulateMessage({ type: "SERVERS", payload: [sampleServer] });
    });
    expect(screen.getByText("de_dust2")).toBeInTheDocument();
});
```

### Manual Testing

- `npm run send` - Simulates CS server log messages via UDP
- `npm start` - React development server (port 3000)
- `dotnet run` - Runs full application
- Mock data templates in `sender.js` arrayOfServerMessages

### Before Committing

Always run tests before committing:
```bash
./run-tests.sh --verbose
CI=true npm test
```

Ensure all tests pass and consider adding new tests for:
- New regex patterns in `UdpDataProcessor.cs`
- New WebSocket message types in `Startup.cs`
- New data processing logic
- New React component behavior or WebSocket interactions

## Common Tasks

### Configure Network Binding
Edit `appsettings.json` to change server binding:
```json
{
  "Server": {
    "Urls": "http://0.0.0.0:5000"  // All interfaces (LAN access)
    // OR
    "Urls": "http://localhost:5000"  // Localhost only
    // OR
    "Urls": "http://192.168.1.100:5000"  // Specific IP
  }
}
```

### Override WebSocket Configuration
Create `.env` file (copy from `.env.example`):
```env
REACT_APP_WS_HOST=192.168.1.100  # Override WebSocket host
REACT_APP_WS_PORT=5000           # Override WebSocket port
```

After changing `.env`, rebuild the frontend:
```bash
npm run build
```

### Update Database Credentials
Edit `appsettings.json` (create from template if missing):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=postgres;Username=user;Password=pass;"
  }
}
```

### Add New Log Pattern
1. Add regex pattern in `UdpDataProcessor.cs` as readonly field
2. Add property to store parsed value
3. Add match logic in `ProcessRawData()`
4. Add database update in `UpdateDatabase()`

### Add New WebSocket Event
1. Handle message type in `Startup.cs` `Echo()` method
2. Add corresponding database operations if needed
3. Broadcast to clients via `BroadcastNewDataViaWebSocketAsync()`
4. Update React components to handle the event

## Dependencies

### Backend NuGet Packages
- Microsoft.EntityFrameworkCore 6.0.0
- Npgsql.EntityFrameworkCore.PostgreSQL 6.0.0
- Npgsql 8.0.2
- Microsoft.AspNetCore.StaticFiles 2.2.0

### Frontend npm Packages
- react 18.2.0
- react-dom 18.2.0
- react-scripts 5.0.1
- ws 8.16.0
- pg 8.11.3

## Commit Preferences

- Create clear, descriptive commit messages
- Focus on "why" rather than "what"
- Include "Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>" footer
- Don't commit `appsettings.json`, `.env`, or build artifacts
