#!/bin/bash

# Horizon CS Server Manager - Test Runner Script
# This script runs the backend test suite with various options

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Horizon CS Server Manager - Test Runner${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Parse arguments
VERBOSE=false
COVERAGE=false
FILTER=""

while [[ $# -gt 0 ]]; do
  case $1 in
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -c|--coverage)
      COVERAGE=true
      shift
      ;;
    -f|--filter)
      FILTER="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: ./run-tests.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  -v, --verbose    Show detailed test output"
      echo "  -c, --coverage   Generate code coverage report"
      echo "  -f, --filter     Run specific tests (e.g., 'RegexPatternTests')"
      echo "  -h, --help       Show this help message"
      echo ""
      echo "Examples:"
      echo "  ./run-tests.sh                          # Run all tests"
      echo "  ./run-tests.sh --verbose                # Run with detailed output"
      echo "  ./run-tests.sh --coverage               # Run with coverage report"
      echo "  ./run-tests.sh --filter RegexPattern    # Run only regex tests"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Restore dependencies
echo -e "${YELLOW}📦 Restoring dependencies...${NC}"
dotnet restore horizon.Tests/horizon.Tests.csproj

# Build test project
echo -e "${YELLOW}🔨 Building test project...${NC}"
dotnet build horizon.Tests/horizon.Tests.csproj --no-restore

# Construct test command
TEST_CMD="dotnet test horizon.Tests/horizon.Tests.csproj --no-build"

if [ "$VERBOSE" = true ]; then
  TEST_CMD="$TEST_CMD --verbosity normal"
else
  TEST_CMD="$TEST_CMD --verbosity minimal"
fi

if [ "$COVERAGE" = true ]; then
  TEST_CMD="$TEST_CMD --collect:\"XPlat Code Coverage\""
fi

if [ -n "$FILTER" ]; then
  TEST_CMD="$TEST_CMD --filter \"FullyQualifiedName~$FILTER\""
fi

# Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
echo ""
eval $TEST_CMD
TEST_EXIT_CODE=$?

# Check test results
echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"

  # Generate coverage report if requested
  if [ "$COVERAGE" = true ]; then
    echo ""
    echo -e "${YELLOW}📊 Generating coverage report...${NC}"

    # Check if reportgenerator is installed
    if ! command -v reportgenerator &> /dev/null; then
      echo -e "${YELLOW}Installing ReportGenerator tool...${NC}"
      dotnet tool install -g dotnet-reportgenerator-globaltool
    fi

    # Generate HTML report
    reportgenerator \
      -reports:"horizon.Tests/TestResults/*/coverage.cobertura.xml" \
      -targetdir:"coverage-report" \
      -reporttypes:Html

    echo -e "${GREEN}Coverage report generated at: coverage-report/index.html${NC}"
    echo -e "${YELLOW}Open with: open coverage-report/index.html${NC}"
  fi
else
  echo -e "${RED}❌ Some tests failed. Exit code: $TEST_EXIT_CODE${NC}"
  exit $TEST_EXIT_CODE
fi

echo ""
echo -e "${GREEN}========================================${NC}"
