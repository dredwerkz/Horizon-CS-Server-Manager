# Horizon CS Server Manager - Test Suite

Comprehensive unit and integration tests for the backend components.

## Overview

This test suite covers:
- **Regex Pattern Tests**: Validates UDP log parsing patterns (scores, maps, players, admin requests)
- **WebSocket Message Tests**: Ensures proper message serialization/deserialization
- **Integration Tests**: (Future) End-to-end tests with test database

## Running Tests

### Local (Without Docker)

```bash
# Run all tests
dotnet test

# Run with detailed output
dotnet test --verbosity normal

# Run specific test class
dotnet test --filter "FullyQualifiedName~RegexPatternTests"

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"
```

### With Docker

```bash
# Run tests in isolated container
docker build -f Dockerfile.test -t horizon-tests .
docker run --rm horizon-tests

# Or using docker-compose
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Test Structure

```
horizon.Tests/
├── Helpers/
│   └── MockUdpData.cs          # Mock CS server log data
├── Interfaces/
│   └── WebSocketMessageTests.cs # WebSocket message tests
├── Processors/
│   └── RegexPatternTests.cs    # UDP log parsing tests
└── horizon.Tests.csproj        # Test project configuration
```

## Test Categories

### Regex Pattern Tests

Tests the core regex patterns used to parse Counter-Strike server logs:

**Score Parsing:**
- CT and TERRORIST team scores
- Zero scores and maximum scores
- Invalid team names

**Map & Rounds Parsing:**
- Map name extraction
- Rounds played tracking
- Various map names (dust2, mirage, inferno, etc.)

**Admin Detection:**
- Case-insensitive "admin" keyword detection
- Various phrasings ("need admin", "ADMIN", "call admin")
- False positives prevention ("administration")

**Player Parsing:**
- Player names with special characters
- Player names with spaces
- CT and T team assignment
- Steam ID format validation

### WebSocket Message Tests

Tests message structure and serialization:

- Message type handling (UPDATE, NEW_USER, ADMIN_SWITCH)
- Payload serialization/deserialization
- Complex nested payloads
- Null payload handling

## Writing New Tests

### Using FluentAssertions

Tests use FluentAssertions for readable assertions:

```csharp
[Fact]
public void MyTest()
{
    // Arrange
    var result = SomeFunction();

    // Assert
    result.Should().BeTrue("because the condition is met");
    result.Should().NotBeNull();
}
```

### Using Theory Tests

For testing multiple similar cases:

```csharp
[Theory]
[InlineData("CT", 10)]
[InlineData("TERRORIST", 7)]
public void MyTest(string team, int score)
{
    // Test logic using parameters
}
```

### Adding Mock Data

Add new mock data to `Helpers/MockUdpData.cs`:

```csharp
public const string MyNewMockData = @"L 03/03/2026 - 12:00:00: Custom log message";
```

## Integration Tests (Future)

To add integration tests with a real database:

1. Create `IntegrationTests/` directory
2. Use `WebApplicationFactory<Program>` for testing
3. Use Testcontainers for PostgreSQL
4. Set up database fixtures

Example structure:

```csharp
public class UdpDataProcessorIntegrationTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _fixture;

    public UdpDataProcessorIntegrationTests(DatabaseFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public void Should_SaveToDatabase_When_ValidDataReceived()
    {
        // Test with actual database
    }
}
```

## Continuous Integration

Tests should be run in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup .NET
        uses: actions/setup-dotnet@v1
        with:
          dotnet-version: '6.0.x'
      - name: Restore dependencies
        run: dotnet restore
      - name: Run tests
        run: dotnet test --verbosity normal
```

## Test Coverage

View coverage report:

```bash
# Generate coverage
dotnet test --collect:"XPlat Code Coverage"

# Install report generator (one-time)
dotnet tool install -g dotnet-reportgenerator-globaltool

# Generate HTML report
reportgenerator \
  -reports:"**/coverage.cobertura.xml" \
  -targetdir:"coverage-report" \
  -reporttypes:Html

# Open report
open coverage-report/index.html
```

## Dependencies

- **xUnit**: Test framework
- **FluentAssertions**: Readable assertions
- **Moq**: Mocking framework (for future integration tests)
- **Npgsql**: PostgreSQL driver (for integration tests)
- **coverlet.collector**: Code coverage

## Troubleshooting

**Tests not running:**
```bash
# Restore packages
dotnet restore horizon.Tests/horizon.Tests.csproj

# Clean and rebuild
dotnet clean
dotnet build
```

**Reference errors:**
```bash
# Ensure main project is built first
dotnet build horizon.csproj
dotnet build horizon.Tests/horizon.Tests.csproj
```

**Port conflicts in integration tests:**
- Use Testcontainers with random ports
- Or use in-memory database for unit tests

## Future Enhancements

- [ ] Integration tests with Testcontainers
- [ ] Performance benchmarks
- [ ] Load testing for UDP receiver
- [ ] WebSocket connection tests
- [ ] End-to-end tests with Playwright
- [ ] Mutation testing
