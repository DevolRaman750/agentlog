# AgentLog

**Open-source platform for building, managing, and orchestrating AI agents with full visibility and control.**

> **Beta**: AgentLog is under active development. Breaking changes may occur.

**Live Demo**: [agentlog.scalebase.io](https://agentlog.scalebase.io)

---

## What is AgentLog?

AgentLog is a full-stack platform that solves the core challenges of AI agent development:

- **No visibility** into what your agents are doing
- **Complex configuration** across different models and providers
- **No easy way** to compare and A/B test configurations
- **Missing persistence** — agents forget everything between runs
- **Difficult collaboration** — no way to organize agents into teams

AgentLog gives you a unified interface for multi-model execution, persistent memory, real-time monitoring, and flexible function calling.

<!-- Screenshot: Dashboard overview showing agents and teams -->

---

## Key Features

### Autonomous Agents
Create AI agents that run on configurable schedules (heartbeat). Each agent has:
- Lifecycle management (Active, Standby, Paused)
- Daily token budgets to control costs
- Persistent memory that survives between executions
- Assigned archetype templates defining behavior

<!-- Screenshot: Agent card showing status, stats, and controls -->

### Teams & Collaboration
Organize agents into teams with shared context:
- Team-wide memory accessible to all members
- Shared task lists and coordination
- Collective token budgets
- Team-level monitoring and analytics

<!-- Screenshot: Team view with multiple agents -->

### Multi-Model Execution
Run the same prompt against multiple AI configurations simultaneously:
- Compare Gemini, GPT-4, Claude, Kimi K2 side-by-side
- Test different temperatures, system prompts, and parameters
- Built-in A/B testing framework
- Detailed comparison metrics

<!-- Screenshot: Execution results comparison view -->

### Persistent Memory
Agents and teams remember context across sessions:
- Structured memory storage (facts, relationships, experiences)
- Full-text search across memories
- Memory importance scoring and size limits
- Real-time sync across connected agents

### Execution Templates
Define reusable, parameterized execution templates:
- Variable placeholders (`{{param_name}}`)
- Public/private sharing options
- Rate limiting per template
- Auth tokens for external invocation
- Template marketplace for discovery

<!-- Screenshot: Template library or editor -->

### Function Calling
Extend agent capabilities with external integrations:
- **Built-in**: Slack messaging, GitHub code/issues, Google Drive, weather data, Neo4j queries
- **Custom**: Define your own functions with JSON schema
- **MCP Support**: Model Context Protocol for standardized function interfaces
- Function chaining with depth control

### Real-Time Monitoring
Full visibility into every execution:
- Live progress tracking
- Execution flow graphs
- Detailed logs (DEBUG, INFO, WARN, ERROR)
- Token usage and cost analysis
- Complete audit trail

<!-- Screenshot: Execution logs or flow graph -->

---

## Supported Providers

| Provider | Models |
|----------|--------|
| **Google Gemini** | Gemini 2.5 Pro, 1.5 Pro, 1.5 Flash |
| **OpenRouter** | Claude 3.5 Sonnet, GPT-4o, and more |
| **Moonshot Kimi** | K2 (excellent for tool use) |

---

## Quick Start

### Prerequisites
- Go 1.24+
- Node.js 18+
- PostgreSQL 14+ or MySQL 8+
- Make

### 1. Configure Environment

Copy the example config and add your credentials:

```bash
cp config.example.env config.env
```

Required settings:
```env
DB_URL=postgres://user:pass@localhost:5432/agentlog
GEMINI_API_KEY=your-gemini-key
API_ENCRYPTION_KEY=your-32-byte-encryption-key
JWT_SECRET=your-jwt-secret
```

### 2. Start the Backend

```bash
make run-server
```

The API server starts on `localhost:8080`:
```
API endpoints:
   POST /api/execute          - Run multi-variation execution
   GET  /api/agents           - List agents
   GET  /api/teams            - List teams
   GET  /api/execution-runs   - Execution history
   GET  /api/functions        - Available functions
   GET  /api/templates        - Execution templates
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm start
```

Open [localhost:8081](http://localhost:8081) in your browser, or press `i` for iOS simulator / `a` for Android emulator.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend                             │
│          React Native (Web / iOS / Android)             │
├─────────────────────────────────────────────────────────┤
│                    API Layer                             │
│              REST + gRPC Gateway                         │
├─────────────────────────────────────────────────────────┤
│                 Core Services                            │
│  Agents │ Teams │ Templates │ Memory │ Execution        │
├─────────────────────────────────────────────────────────┤
│                 Integrations                             │
│  Gemini │ OpenRouter │ Slack │ GitHub │ MCP             │
├─────────────────────────────────────────────────────────┤
│                  Data Layer                              │
│        PostgreSQL/MySQL │ Encrypted Storage             │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
agentlog/
├── cmd/gogent/          # Server entry point
├── internal/
│   ├── agents/          # Agent management
│   ├── teams/           # Team management
│   ├── templates/       # Execution templates
│   ├── gogent/          # Core execution engine
│   ├── providers/       # AI provider integrations
│   └── db/              # Database layer (sqlc)
├── frontend/            # React Native app
├── migrations/          # Database migrations
├── sql/                 # SQL queries
├── k8s/                 # Kubernetes manifests
└── scripts/             # Utility scripts
```

---

## Configuration

### API Keys

AgentLog encrypts all API keys with AES-256-GCM before storing. Add keys through the UI or API:

- **AI Providers**: Gemini, OpenAI, OpenRouter
- **Integrations**: Slack, Discord, GitHub, OpenWeather, Neo4j, Google Drive

### Model Configurations

Create named configurations with specific parameters:
- Model selection
- Temperature, max tokens, top-P, top-K
- System prompts
- Safety settings

---

## Deployment

### Docker

```bash
make docker-build-all
docker-compose up
```

### Kubernetes

```bash
make k8s-deploy
```

K8s manifests include:
- Deployments with health checks
- Services with load balancing
- Ingress for external access
- Secrets management
- Horizontal Pod Autoscaling

---

## Development

### Useful Commands

```bash
# Backend
make run-server          # Start API server
make run-tests           # Run tests
make test-coverage       # Tests with coverage
make generate-db         # Regenerate sqlc code
make migrate-up          # Apply migrations

# Frontend
make frontend-start      # Start Expo dev server
make frontend-test       # Run tests
make frontend-ios        # iOS simulator
make frontend-android    # Android emulator
make frontend-web        # Web browser
```

### Running Tests

```bash
# Backend
make run-tests
make test-race           # With race detection

# Frontend
cd frontend && npm test
```

---

## Security

- **Encryption**: AES-256-GCM for stored API keys
- **Authentication**: JWT-based with refresh tokens
- **Password Security**: bcrypt hashing
- **Rate Limiting**: Configurable per endpoint and template
- **Audit Logging**: Complete operation history

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

---

## Contributing

Contributions welcome! The platform is designed for extensibility:

- **Add providers**: Implement the `ModelProvider` interface
- **Add integrations**: Register in the integration registry
- **Add functions**: Define in `system/functions/` JSON files
- **Extend UI**: React Native components in `frontend/src/`

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Links

- **Live Demo**: [agentlog.scalebase.io](https://agentlog.scalebase.io)
- **Issues**: [GitHub Issues](https://github.com/imran31415/agentlog/issues)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
