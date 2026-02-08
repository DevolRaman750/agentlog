# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

AgentLog is an AI Multi-Variation Execution Platform built in Go with a React Native frontend. It wraps AI APIs (primarily Google Gemini) with multi-variation execution, database logging, and domain-specific AI implementations. The system enables running AI prompts with different configurations, comparing results, and implementing specialized workflows like procurement management and legal analysis.

## Architecture Overview

AgentLog follows a clean, layered architecture with distinct separation of concerns:

### Backend (Go)
- **Module Name**: `gogent` (as defined in go.mod)
- **Core Components**:
  - **Execution Engine**: Multi-variation AI execution with support for different providers
  - **Interface Layer**: Clean abstractions for extensibility (`pkg/engine/interfaces.go`)
  - **Provider System**: Multi-model support with pluggable provider architecture
  - **Type System**: Comprehensive type definitions in `internal/types/`
  - **Database Layer**: MySQL with sqlc-generated type-safe queries
  - **Function System**: Extensible function calling with external API integrations

### Frontend (React Native/Expo)
- **Framework**: Expo 52 with React Native 0.76
- **Architecture**: Cross-platform mobile app (iOS/Android/Web)
- **State Management**: Custom store with navigation integration
- **API Integration**: gRPC-Web and REST API support

### Key Architectural Patterns
1. **Interface-Driven Design**: Clean separation between interfaces and implementations
2. **Multi-Provider Pattern**: Support for multiple AI providers through common interfaces
3. **Factory Pattern**: Extensible instantiation of different implementations
4. **Multi-Variation Execution**: Parallel execution of AI prompts with different configurations
5. **Database-First Logging**: Every API call and response logged with full audit trail

## Development Commands

### Backend Development

#### Setup and Dependencies
```bash
# Initial setup (backend + frontend)
make setup

# Install Go dependencies
make install-deps

# Generate database code from SQL schema  
make generate-db
```

#### Running the Backend
```bash
# Start HTTP REST server (primary, mobile-friendly)
make run-server

# Start gRPC server only
go run cmd/gogent/*.go --grpc-server

# Start HTTP-to-gRPC gateway only  
go run cmd/gogent/*.go --grpc-gateway

# Start both gRPC server and gateway
go run cmd/gogent/*.go --both
```

#### Testing
```bash
# Run all backend tests
make run-tests

# Run tests with coverage
make test-coverage

# Run tests with race detection
make test-race

# Run comprehensive test suite
make test-comprehensive

# Run CI-optimized tests
make test-ci
```

### Frontend Development

#### Setup and Running
```bash
# Install frontend dependencies
make frontend-install

# Start Expo development server
make frontend-start

# Run on iOS simulator
make frontend-ios

# Run on Android simulator  
make frontend-android

# Run on web browser
make frontend-web
```

#### Frontend Testing
```bash
# Run all frontend tests
make frontend-test

# Run tests with coverage
make frontend-test-coverage

# Run tests in watch mode
make frontend-test-watch
```

### Database Operations

#### Migrations
```bash
# Run database migrations
make migrate

# Check migration status
make migrate-status

# Reset migrations (destructive)
make migrate-reset
```

### Docker and Deployment

#### Build and Deploy
```bash
# Build backend Docker image
make docker-build-backend

# Build frontend Docker image  
make docker-build-frontend

# Complete deployment workflow
make deploy-all

# Quick deployment (assumes images built)
make deploy-quick
```

#### Kubernetes Operations
```bash
# Deploy to Kubernetes
make k8s-deploy

# Check deployment status
make k8s-status

# View logs
make k8s-logs-backend
make k8s-logs-frontend
```

## Code Organization and Key Components

### Backend Structure
- `cmd/gogent/`: Entry point with server implementations (REST, gRPC, Gateway)
- `internal/types/`: Core type definitions and data structures
- `internal/gogent/`: Core business logic and execution engine
- `internal/gemini/`: Gemini API client implementation
- `internal/providers/`: Multi-provider abstraction layer
- `internal/db/`: Database queries and models (sqlc-generated)
- `pkg/engine/`: Clean interface definitions for the execution engine

### Frontend Structure  
- `frontend/src/`: Main application source code
- `frontend/assets/`: Static assets and resources
- `frontend/scripts/`: Build and deployment scripts

### Key Interfaces and Types
- **`Provider`**: Abstracts AI model providers (Gemini, OpenAI, etc.)
- **`Store`**: Persistence layer for requests/responses
- **`Logger`**: Execution event logging for observability
- **`ExecutionRun`**: Groups related API calls with variations
- **`APIConfiguration`**: Specific configuration for AI models
- **`FunctionDefinition`**: Reusable function definitions for external integrations

## Configuration and Environment

### Required Environment Variables
- `GEMINI_API_KEY`: Google Gemini API key
- `DB_URL`: MySQL database connection string
- `API_ENCRYPTION_KEY`: Key for API data encryption

### Configuration Files
- `config.env`: Primary environment configuration
- `config.example.env`: Example configuration template
- `sqlc.yaml`: Database code generation configuration

## Testing Strategy

### Backend Testing
- Unit tests with race detection support
- Integration tests with database
- Smoke tests for quick validation
- Performance and load testing capabilities
- Comprehensive coverage analysis

### Frontend Testing  
- Component testing with React Testing Library
- Integration tests
- End-to-end testing
- Performance testing
- Responsive UI testing

## Multi-Model Provider System

The system supports multiple AI providers through a clean interface pattern:
- **Gemini**: Primary Google Gemini integration
- **OpenRouter**: Secondary provider support
- **Extensible**: Add new providers by implementing the `Provider` interface

## Function System Architecture

AgentLog includes an extensible function calling system:
- **Built-in Functions**: Weather APIs, Neo4j graph databases, GitHub integration
- **Custom Functions**: Domain-specific implementations
- **Mock Support**: Testing with mock responses
- **API Key Management**: Secure handling of external service credentials

## Database Schema and Migrations

- **Primary Database**: MySQL with full audit trail
- **Code Generation**: Uses sqlc for type-safe SQL queries
- **Migration System**: golang-migrate for schema versioning
- **Tables**: Execution runs, configurations, function definitions, API logs

## Integration Points

### External Services
- **Google Gemini API**: Primary AI provider
- **Neo4j**: Graph database integration for complex queries
- **OpenWeather API**: Weather data functions
- **GitHub API**: Code analysis and repository operations
- **Slack API**: Communication integrations

### Development Tools
- **sqlc**: Type-safe SQL query generation
- **golang-migrate**: Database migration management
- **golangci-lint**: Go code linting
- **Docker**: Containerization for deployment
- **Kubernetes**: Container orchestration

## Special Development Considerations

### Database-First Design
All AI interactions are logged to the database with full traceability. When working with the execution engine, ensure proper logging context is maintained.

### Multi-Variation Execution
The core feature allows running the same prompt with different AI configurations simultaneously. When adding new execution paths, ensure they integrate with the variation system.

### Function Call Deduplication
The system prevents duplicate function calls within the same execution session. Be aware of this when implementing new function types.

### Provider Abstraction
When adding support for new AI providers, implement the `Provider` interface in `pkg/engine/interfaces.go` rather than coupling directly to specific APIs.

### Type Safety
The codebase uses sqlc for database operations and strong typing throughout. Maintain this pattern when adding new features.

## Live Demo and Production

- **Live Demo**: https://agentlog.scalebase.io
- **Backend API**: REST endpoints on port 8080
- **Frontend**: Mobile-optimized React Native app
- **Database**: Production MySQL with audit logging
- **Deployment**: Kubernetes with Docker containers