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

## Known Issues & TODOs

Currently no known critical issues. All SQL injection vulnerabilities have been fixed and code quality improvements have been implemented.

### Potential Future Enhancements
- Consider implementing Entity Framework queries instead of raw SQL for better maintainability
- Add more comprehensive error handling and logging
- Implement WebSocket reconnection logic on the frontend
- Add unit tests for data processors and regex patterns

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

## Testing

- `npm run send` - Simulates CS server log messages via UDP
- `npm start` - React development server
- `dotnet run` - Runs full application
- Mock data templates in `sender.js` arrayOfServerMessages

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
