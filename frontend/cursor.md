# GoGent Full Stack Project - Cursor Configuration

## ⚠️ IMPORTANT: Use Make Commands

**This project uses a comprehensive Makefile for all operations. Always use `make` commands instead of running commands directly.**

## Quick Start Commands

### Backend Operations:
```bash
# Start backend server (preferred method)
make run-api

# Alternative: kill existing processes and start server
make kill-server && make run-api

# Build backend
make build

# Run tests
make run-tests

# View all available commands
make commands
```

### Frontend Operations:
```bash
# Setup frontend (first time)
make frontend-setup

# Start development server
make frontend-start

# Run on specific platforms
make frontend-ios
make frontend-android
make frontend-web

# Install frontend dependencies
make frontend-install

# Build for production
make frontend-build
```

### Full Project Setup:
```bash
# Complete first-time setup
make dev-setup

# Install all dependencies
make install-all

# Check project status
make status

# Clean everything
make clean-all
```

## Package Manager (Frontend)

**The frontend uses YARN as the package manager. The Makefile handles this automatically.**

### ❌ Do NOT use directly:
- `npm install` / `npm add` / `npm run`
- `yarn install` / `yarn start` (use make commands instead)
- `go run cmd/gogent/*.go` (use make commands instead)
- `./bin/gogent --server` (use make commands instead)

### ✅ Always use Make commands:
- `make frontend-start` instead of `yarn start`
- `make run-api` instead of `go run cmd/gogent/*.go --server`
- `make build` instead of `go build`

## Project Structure:
```
agentlog/
├── cmd/              # Go command entry points
├── internal/         # Backend Go code
├── frontend/         # React Native frontend
│   ├── src/
│   │   ├── api/      # Backend API calls
│   │   ├── types/    # TypeScript interfaces
│   │   ├── screens/  # React Native screens
│   │   ├── components/ # Reusable components
│   │   ├── navigation/ # Navigation configuration
│   │   ├── context/  # React Context providers
│   │   └── utils/    # Utility functions
│   └── assets/       # Images, fonts, etc.
├── sql/              # Database schema and queries
├── Makefile          # All project commands
└── config.env        # Environment configuration
```

## Development Workflow:

1. **First time setup**: `make dev-setup`
2. **Start backend**: `make run-api`
3. **Start frontend**: `make frontend-start`
4. **Build changes**: `make build`
5. **Run tests**: `make run-tests`

## Available Make Commands:

Run `make commands` to see all available commands or check the Makefile directly.

### Backend Integration:
- Backend runs on `http://localhost:8080` (Go server)
- API endpoints for GoGent multi-variation execution
- MySQL database integration for execution history
- Support for both real Gemini API and mock responses

### Development Notes:
- Uses Expo with TypeScript
- React Navigation for screen management
- Axios for HTTP requests
- AsyncStorage for local data persistence
- Clean, minimal UI design following modern mobile patterns 