# Horizon CS Server Manager

A real-time Counter-Strike server monitoring and management system that receives UDP log data from CS servers, stores it in a PostgreSQL database, and displays live server information through a React-based web interface.

## Features

- **Real-time Server Monitoring**: Receives and processes UDP log data from Counter-Strike servers
- **Live Score Tracking**: Monitors CT and Terrorist team scores in real-time
- **Player Activity**: Tracks active players and their team assignments
- **Admin Request Detection**: Automatically detects when players request admin assistance
- **WebSocket Communication**: Pushes live updates to all connected clients
- **Multi-Server Support**: Track and manage multiple CS servers simultaneously
- **PostgreSQL Database**: Persistent storage of server states and game data

## Tech Stack

### Backend
- **ASP.NET Core 6.0** - Web host and API framework
- **Entity Framework Core** - ORM for database operations
- **PostgreSQL** (via Npgsql) - Database
- **WebSockets** - Real-time bidirectional communication
- **UDP Server** - Receives game server log data

### Frontend
- **React 18** - UI framework
- **React Scripts** - Build tooling
- **WebSockets** - Real-time data updates

## Prerequisites

- .NET 6.0 SDK or later
- Node.js 14+ and npm
- PostgreSQL database

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Horizon-CS-Server-Manager
   ```

2. **Configure the database connection**

   Copy the template and configure your database credentials:
   ```bash
   cp appsettings_Template.json appsettings.json
   ```

   Edit `appsettings.json` with your PostgreSQL credentials:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=postgres;Username=your_username;Password=your_password;"
     }
   }
   ```

3. **Install frontend dependencies**
   ```bash
   npm install
   ```

4. **Build the React frontend**
   ```bash
   npm run build
   ```

5. **Run the application**
   ```bash
   dotnet run
   ```

## Usage

### Running the Application

The application runs on two concurrent threads:
- **UDP Server**: Listens on port 12345 for incoming CS server log data
- **Web Server**: Hosts the React application and WebSocket endpoint

### Connecting CS Servers

Configure your Counter-Strike servers to send UDP log data to the machine running Horizon CS Server Manager on port 12345.

### Accessing the Web Interface

Once running, navigate to `http://localhost:5000` (or the configured port) to view the server dashboard.

### LAN Deployment (Multiple Clients)

The application is configured to work on a Local Area Network out of the box.

#### Server Setup:

1. **Find your server's IP address:**
   ```bash
   # On macOS/Linux:
   ifconfig | grep "inet "

   # On Windows:
   ipconfig
   ```
   Look for your local IP (usually 192.168.x.x or 10.0.x.x)

2. **Configure the server (optional):**
   Edit `appsettings.json` if you need a different port:
   ```json
   {
     "Server": {
       "Urls": "http://0.0.0.0:5000"
     }
   }
   ```

3. **Allow firewall access:**
   - **macOS:** System Preferences → Security & Privacy → Firewall → Firewall Options → Allow incoming connections for "horizon"
   - **Windows:** Windows Defender Firewall → Allow an app → Add dotnet.exe
   - **Linux:** `sudo ufw allow 5000/tcp`

4. **Run the application:**
   ```bash
   dotnet run
   ```

#### Client Access:

Clients on the same network can access the dashboard at:
```
http://YOUR_SERVER_IP:5000
```

For example: `http://192.168.1.100:5000`

#### WebSocket Configuration (Advanced):

If you need to override the WebSocket connection settings, create a `.env` file:
```bash
cp .env.example .env
```

Then edit `.env`:
```env
REACT_APP_WS_HOST=192.168.1.100
REACT_APP_WS_PORT=5000
```

Rebuild the frontend after changes:
```bash
npm run build
```

#### Troubleshooting LAN Connections:

1. **Can't connect from other machines:**
   - Verify server IP with `ipconfig` or `ifconfig`
   - Check firewall settings on server machine
   - Ensure clients and server are on the same network
   - Try accessing from another device: `http://SERVER_IP:5000`

2. **WebSocket connection fails:**
   - Check browser console for connection errors
   - Verify WebSocket URL in console log on connection attempt
   - Ensure port 5000 is not blocked by firewall

3. **Connection works but no data:**
   - Verify UDP port 12345 is open for CS server logs
   - Check CS server is configured to send logs to correct IP

### Testing with Mock Data

Use the included sender script to simulate server data:
```bash
npm run send
```

## Project Structure

```
├── Classes/              # Business logic classes
├── Data/                 # Database context and models
│   └── Models/          # Entity models (Servers, Teams, Players)
├── Interfaces/           # Interface definitions
├── Processors/           # Data processing logic (UDP message parsing)
├── public/              # Static assets for React app
├── src/                 # React frontend source
│   └── components/      # React components
├── Program.cs           # Application entry point
├── Startup.cs           # Service configuration and middleware
├── UdpServer.cs         # UDP listener implementation
└── sender.js            # Test utility for simulating server data
```

## Configuration Files

- `appsettings.json` - Database connection string (gitignored)
- `.env` - Environment variables (gitignored)
- `nodemon.json` - Development server configuration
- `horizon.csproj` - .NET project configuration

## Development

### Frontend Development
```bash
npm start           # Start React development server
npm run build       # Build production bundle
npm test            # Run tests
```

### Backend Development
```bash
dotnet run          # Run the application
dotnet build        # Build the project
```

## Changes

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
