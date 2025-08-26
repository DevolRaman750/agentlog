.PHONY: setup install-deps generate-db init-db run-tests clean frontend-setup frontend-install frontend-start frontend-ios frontend-android frontend-web frontend-build frontend-clean \
	test-coverage test-verbose test-race test-bench frontend-test-deps frontend-test frontend-test-coverage frontend-test-watch \
	frontend-test-unit frontend-test-integration frontend-test-e2e frontend-test-performance frontend-test-smoke frontend-test-responsive \
	coverage coverage-backend coverage-frontend coverage-gaps coverage-gaps-backend coverage-gaps-frontend coverage-templates \
	coverage-backend-detailed coverage-frontend-detailed coverage-view coverage-clean coverage-badge \
	test-all test-quick test-smoke test-comprehensive test-performance test-integration \
	test-ci test-ci-fast test-pre-commit test-release test-debug test-clean test-load test-stress test-setup test-validate test-report test-full-report \
	start-test-server kill-server kill-frontend \
	docker-build-backend docker-build-frontend docker-build-all docker-push-backend docker-push-frontend docker-push-all docker-deploy \
	k8s-deploy k8s-update-images k8s-force-update-images k8s-restart k8s-wait k8s-status k8s-pods k8s-endpoints k8s-logs-backend k8s-logs-frontend k8s-delete \
	deploy-all deploy-quick deploy-backend deploy-frontend

# Setup the entire project (backend + frontend)
setup: install-deps generate-db frontend-setup

# Backend Setup Commands
# ======================

# Install Go dependencies
install-deps:
	go mod tidy
	go mod download

# Install sqlc for code generation
install-sqlc:
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest

# Generate database code from SQL schema
generate-db: install-sqlc
	sqlc generate

# Initialize the database with schema
init-db:
	mysql -h $(DB_HOST) -u $(DB_USER) -p$(DB_PASSWORD) < sql/schema.sql

# Run database migrations using golang-migrate
migrate:
	migrate -path migrations -database "mysql://root:Password123!@tcp(localhost:3306)/gogent?multiStatements=true" up

# Show migration status
migrate-status:
	migrate -path migrations -database "mysql://root:Password123!@tcp(localhost:3306)/gogent?multiStatements=true" version

# Force migration version (use when dirty)
migrate-force:
	migrate -path migrations -database "mysql://root:Password123!@tcp(localhost:3306)/gogent?multiStatements=true" force $(VERSION)

# Reset database migrations
migrate-reset:
	migrate -path migrations -database "mysql://root:Password123!@tcp(localhost:3306)/gogent?multiStatements=true" drop -f

# Build migration tool
build-migrate:
	go build -o bin/migrate ./cmd/migrate

# Generate protobuf Go code
generate-proto:
	protoc --go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		proto/gogent.proto

# Install protobuf tools
install-proto-tools:
	go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
	go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# ==================== DOCKER COMMANDS ====================

# Variables for Docker deployment
DOCKER_REGISTRY = registry.digitalocean.com/resourceloop
BACKEND_IMAGE = $(DOCKER_REGISTRY)/agentlog/backend
FRONTEND_IMAGE = $(DOCKER_REGISTRY)/agentlog/frontend
GIT_HASH := $(shell git rev-parse --short HEAD 2>/dev/null || echo "latest")
TIMESTAMP := $(shell date +%Y%m%d-%H%M%S)
IMAGE_TAG := $(GIT_HASH)-$(TIMESTAMP)

# Build backend Docker image
docker-build-backend: ## Build backend Docker image
	@echo "🐳 Building backend Docker image for amd64 architecture..."
	docker buildx build --platform linux/amd64 --load -f Dockerfile.backend -t $(BACKEND_IMAGE):$(IMAGE_TAG) .
	docker tag $(BACKEND_IMAGE):$(IMAGE_TAG) $(BACKEND_IMAGE):latest
	@echo "✅ Backend image built: $(BACKEND_IMAGE):$(IMAGE_TAG)"

# Build frontend Docker image  
docker-build-frontend: ## Build frontend Docker image
	@echo "🐳 Building frontend Docker image for amd64 architecture..."
	docker buildx build --platform linux/amd64 --load -t $(FRONTEND_IMAGE):$(IMAGE_TAG) frontend/
	docker tag $(FRONTEND_IMAGE):$(IMAGE_TAG) $(FRONTEND_IMAGE):latest
	@echo "✅ Frontend image built: $(FRONTEND_IMAGE):$(IMAGE_TAG)"

# Build both Docker images
docker-build-all: docker-build-backend docker-build-frontend ## Build both backend and frontend Docker images
	@echo "✅ All Docker images built successfully!"

# Push backend Docker image
docker-push-backend: ## Push backend Docker image to registry
	@echo "📤 Pushing backend image to registry..."
	docker push $(BACKEND_IMAGE):$(IMAGE_TAG)
	docker push $(BACKEND_IMAGE):latest
	@echo "✅ Backend image pushed: $(BACKEND_IMAGE):$(IMAGE_TAG)"

# Push frontend Docker image
docker-push-frontend: ## Push frontend Docker image to registry
	@echo "📤 Pushing frontend image to registry..."
	docker push $(FRONTEND_IMAGE):$(IMAGE_TAG)
	docker push $(FRONTEND_IMAGE):latest
	@echo "✅ Frontend image pushed: $(FRONTEND_IMAGE):$(IMAGE_TAG)"

# Push both Docker images
docker-push-all: docker-build-all docker-push-backend docker-push-frontend ## Push both Docker images to registry
	@echo "✅ All Docker images pushed successfully!"

# Build and push all images
docker-deploy: docker-push-all ## Build and push all Docker images
	@echo "🚀 Docker deployment complete!"
	@echo "📝 Images deployed:"
	@echo "   Backend: $(BACKEND_IMAGE):$(IMAGE_TAG)"
	@echo "   Frontend: $(FRONTEND_IMAGE):$(IMAGE_TAG)"

# ==================== KUBERNETES COMMANDS ====================

# Update Kubernetes deployment image tags
k8s-update-images: ## Update K8s deployment files with new image tags
	@echo "📝 Updating Kubernetes deployment files with new image tags..."
	@echo "Backend image: $(BACKEND_IMAGE):$(IMAGE_TAG)"
	@echo "Frontend image: $(FRONTEND_IMAGE):$(IMAGE_TAG)"
	
	# Update backend deployment
	sed -i.bak "s|registry.digitalocean.com/resourceloop/agentlog/backend:.*|$(BACKEND_IMAGE):$(IMAGE_TAG)|g" k8s/backend-deployment.yaml
	
	# Update frontend deployment
	sed -i.bak "s|registry.digitalocean.com/resourceloop/agentlog/frontend:.*|$(FRONTEND_IMAGE):$(IMAGE_TAG)|g" k8s/frontend-deployment.yaml
	
	@echo "✅ Kubernetes deployment files updated!"

# Deploy to Kubernetes
k8s-deploy: ## Deploy to Kubernetes cluster
	@echo "🚀 Deploying to Kubernetes..."
	kubectl apply -f k8s/configmap.yaml
	kubectl apply -f k8s/secrets/ || echo "⚠️  Secrets may already exist"
	kubectl apply -f k8s/backend-deployment.yaml
	kubectl apply -f k8s/backend-service.yaml
	kubectl apply -f k8s/frontend-deployment.yaml
	kubectl apply -f k8s/frontend-service.yaml
	kubectl apply -f k8s/ingress.yaml
	kubectl apply -f k8s/certificate.yaml || echo "⚠️  Certificate may already exist"
	@echo "✅ Kubernetes deployment complete!"

# Force update deployments with new image tags (without restarting)
k8s-force-update-images: ## Force update K8s deployments with new image tags
	@echo "🔄 Force updating Kubernetes deployments with new images..."
	@echo "Backend image: $(BACKEND_IMAGE):$(IMAGE_TAG)"
	@echo "Frontend image: $(FRONTEND_IMAGE):$(IMAGE_TAG)"
	
	# Force update backend deployment image
	kubectl set image deployment/agentlog-backend backend=$(BACKEND_IMAGE):$(IMAGE_TAG) -n agentlog
	
	# Force update frontend deployment image  
	kubectl set image deployment/agentlog-frontend frontend=$(FRONTEND_IMAGE):$(IMAGE_TAG) -n agentlog
	
	@echo "✅ Deployments updated with new images!"

# Restart deployments to pick up new images
k8s-restart: ## Restart Kubernetes deployments to pick up new images
	@echo "🔄 Restarting Kubernetes deployments..."
	kubectl rollout restart deployment/agentlog-backend -n agentlog
	kubectl rollout restart deployment/agentlog-frontend -n agentlog
	@echo "✅ Deployments restarted!"

# Wait for deployments to be ready
k8s-wait: ## Wait for Kubernetes deployments to be ready
	@echo "⏳ Waiting for deployments to be ready..."
	kubectl rollout status deployment/agentlog-backend -n agentlog --timeout=300s
	kubectl rollout status deployment/agentlog-frontend -n agentlog --timeout=300s
	@echo "✅ All deployments are ready!"

# Show Kubernetes status
k8s-status: ## Show Kubernetes deployment status
	@echo "📊 Kubernetes Status:"
	@echo "===================="
	@echo "Pods:"
	kubectl get pods -n agentlog
	@echo ""
	@echo "Services:"
	kubectl get services -n agentlog
	@echo ""
	@echo "Ingress:"
	kubectl get ingress -n agentlog
	@echo ""
	@echo "Deployments:"
	kubectl get deployments -n agentlog

# Show logs
k8s-logs-backend: ## Show backend logs
	kubectl logs -f deployment/agentlog-backend -n agentlog

k8s-logs-frontend: ## Show frontend logs  
	kubectl logs -f deployment/agentlog-frontend -n agentlog

# Quick status check
k8s-pods: ## Show pod status
	kubectl get pods -n agentlog

# Show services and ingress
k8s-endpoints: ## Show services and ingress endpoints
	@echo "📊 Services:"
	kubectl get services -n agentlog
	@echo ""
	@echo "🌐 Ingress:"
	kubectl get ingress -n agentlog
	@echo ""
	@echo "🔗 Access URLs:"
	@echo "   Frontend: https://agentlog.scalebase.io"
	@echo "   Backend Health: https://agentlog.scalebase.io/health"
	@echo "   Backend API: https://agentlog.scalebase.io/api/*"

# Delete all Kubernetes resources
k8s-delete: ## Delete all Kubernetes resources
	@echo "🗑️  Deleting Kubernetes resources..."
	kubectl delete -f k8s/certificate.yaml || echo "⚠️  Certificate not found"
	kubectl delete -f k8s/ingress.yaml || echo "⚠️  Ingress not found"
	kubectl delete -f k8s/frontend-service.yaml || echo "⚠️  Frontend service not found"
	kubectl delete -f k8s/frontend-deployment.yaml || echo "⚠️  Frontend deployment not found"
	kubectl delete -f k8s/backend-service.yaml || echo "⚠️  Backend service not found"
	kubectl delete -f k8s/backend-deployment.yaml || echo "⚠️  Backend deployment not found"
	kubectl delete -f k8s/configmap.yaml || echo "⚠️  ConfigMap not found"
	@echo "✅ Kubernetes resources deleted!"

# ==================== COMPLETE DEPLOYMENT WORKFLOW ====================

# Complete deployment: build, push, update K8s, deploy, and wait
deploy-all: ## Complete deployment workflow with forced image updates
	@echo "🚀 Starting complete deployment workflow..."
	@echo "📝 Will deploy images with tag: $(IMAGE_TAG)"
	@echo ""
	@echo "Step 1: Building and pushing Docker images..."
	@$(MAKE) docker-deploy IMAGE_TAG="$(IMAGE_TAG)"
	@echo ""
	@echo "Step 2: Updating Kubernetes deployments..."
	@$(MAKE) k8s-force-update-images IMAGE_TAG="$(IMAGE_TAG)"
	@echo ""
	@echo "Step 3: Waiting for rollout to complete..."
	@$(MAKE) k8s-wait
	@echo ""
	@echo "🎉 Complete deployment finished!"
	@echo "📝 Deployed:"
	@echo "   Backend: $(BACKEND_IMAGE):$(IMAGE_TAG)"
	@echo "   Frontend: $(FRONTEND_IMAGE):$(IMAGE_TAG)"
	@echo ""
	@echo "🔍 Check status:"
	@echo "   make k8s-status"
	@echo "   make k8s-endpoints"
	@echo "   make k8s-logs-backend"
	@echo "   make k8s-logs-frontend"

# Quick deployment (assumes images are already built) - now with forced updates
deploy-quick: k8s-force-update-images k8s-wait ## Quick deployment with forced image updates
	@echo "⚡ Quick deployment complete!"

# Build and deploy backend only - with forced update
deploy-backend: docker-build-backend docker-push-backend ## Build and deploy backend only with forced update
	@echo "🔧 Updating backend deployment YAML with new image..."
	sed -i.bak 's|registry.digitalocean.com/resourceloop/agentlog/backend:[^[:space:]]*|$(BACKEND_IMAGE):$(IMAGE_TAG)|g' k8s/backend-deployment.yaml
	@echo "🔧 Applying updated backend deployment..."
	kubectl apply -f k8s/backend-deployment.yaml
	kubectl rollout status deployment/agentlog-backend -n agentlog --timeout=300s
	@echo "✅ Backend deployment complete with image: $(BACKEND_IMAGE):$(IMAGE_TAG)"

# Build and deploy frontend only - with forced update
deploy-frontend: docker-build-frontend docker-push-frontend ## Build and deploy frontend only with forced update
	@echo "🎨 Updating frontend deployment YAML with new image..."
	sed -i.bak 's|registry.digitalocean.com/resourceloop/agentlog/frontend:[^[:space:]]*|$(FRONTEND_IMAGE):$(IMAGE_TAG)|g' k8s/frontend-deployment.yaml
	@echo "🎨 Applying updated frontend deployment..."
	kubectl apply -f k8s/frontend-deployment.yaml
	kubectl rollout status deployment/agentlog-frontend -n agentlog --timeout=300s
	@echo "✅ Frontend deployment complete with image: $(FRONTEND_IMAGE):$(IMAGE_TAG)"

# Backend Testing Commands
# ========================

# Run backend tests
run-tests:
	go test ./...

# Run tests with coverage (legacy - use 'make coverage' for comprehensive analysis)
test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Run backend tests with verbose output
test-verbose:
	go test -v ./...

# Run backend tests with race detection
test-race:
	go test -race ./...

# Run backend benchmarks
test-bench:
	go test -bench=. ./...

# Frontend Testing Commands
# ==========================

# Install frontend test dependencies
frontend-test-deps:
	@echo "📦 Installing frontend test dependencies..."
	cd frontend && yarn add --dev jest @types/jest ts-jest @testing-library/react-native @testing-library/jest-native react-test-renderer

# Run all frontend tests
frontend-test:
	@echo "🧪 Running all frontend tests..."
	cd frontend && yarn test --watchAll=false

# Run frontend tests with coverage
frontend-test-coverage:
	@echo "📊 Running frontend tests with coverage..."
	cd frontend && yarn test --coverage --watchAll=false

# Run frontend tests in watch mode
frontend-test-watch:
	@echo "👀 Running frontend tests in watch mode..."
	cd frontend && yarn test --watch

# Run specific test suites
frontend-test-unit:
	@echo "🧪 Running frontend unit tests..."
	cd frontend && yarn test src/__tests__/components.test.tsx --watchAll=false

frontend-test-integration:
	@echo "🔗 Running frontend integration tests..."
	cd frontend && yarn test src/__tests__/integration.test.ts --watchAll=false

frontend-test-e2e:
	@echo "🎯 Running frontend end-to-end tests..."
	cd frontend && yarn test src/__tests__/e2e.test.ts --watchAll=false

frontend-test-performance:
	@echo "⚡ Running frontend performance tests..."
	cd frontend && yarn test src/__tests__/performance.test.ts --watchAll=false

frontend-test-smoke:
	@echo "💨 Running frontend smoke tests..."
	cd frontend && yarn test src/__tests__/smoke.test.ts --watchAll=false

frontend-test-responsive:
	@echo "📱 Running frontend responsive tests..."
	cd frontend && yarn test src/__tests__/responsive.e2e.test.tsx --watchAll=false

# Coverage Analysis Commands
# ===========================

# Comprehensive coverage analysis (backend + frontend + gaps)
coverage: start-test-server
	@echo "📊 Running comprehensive coverage analysis..."
	./scripts/coverage-analysis.sh
	@$(MAKE) kill-server

# Backend-only coverage analysis
coverage-backend: start-test-server
	@echo "📊 Running backend coverage analysis..."
	./scripts/coverage-analysis.sh --backend-only
	@$(MAKE) kill-server

# Frontend-only coverage analysis
coverage-frontend: start-test-server
	@echo "📊 Running frontend coverage analysis..."
	./scripts/coverage-analysis.sh --frontend-only
	@$(MAKE) kill-server

# Analyze coverage gaps and provide recommendations
coverage-gaps: start-test-server
	@echo "🔍 Analyzing coverage gaps..."
	./scripts/coverage-gaps-finder.sh
	@$(MAKE) kill-server

# Analyze backend coverage gaps only
coverage-gaps-backend: start-test-server
	@echo "🔍 Analyzing backend coverage gaps..."
	./scripts/coverage-gaps-finder.sh --backend-only
	@$(MAKE) kill-server

# Analyze frontend coverage gaps only
coverage-gaps-frontend: start-test-server
	@echo "🔍 Analyzing frontend coverage gaps..."
	./scripts/coverage-gaps-finder.sh --frontend-only
	@$(MAKE) kill-server

# Create test templates for missing coverage
coverage-templates: start-test-server
	@echo "📝 Creating test templates..."
	./scripts/coverage-gaps-finder.sh --templates-only
	@$(MAKE) kill-server

# Enhanced backend coverage with detailed reporting
coverage-backend-detailed: start-test-server
	@echo "📊 Running detailed backend coverage analysis..."
	go test -coverprofile=coverage.out -covermode=atomic ./...
	go tool cover -html=coverage.out -o coverage.html
	go tool cover -func=coverage.out | sort -k3 -nr
	@echo "📂 Coverage report: coverage.html"
	@$(MAKE) kill-server

# Enhanced frontend coverage with detailed reporting
coverage-frontend-detailed: start-test-server
	@echo "📊 Running detailed frontend coverage analysis..."
	cd frontend && yarn test --coverage --watchAll=false --coverageReporters=json,html,text,lcov
	@echo "📂 Coverage report: frontend/coverage/index.html"
	@$(MAKE) kill-server

# Open coverage reports in browser (macOS)
coverage-view:
	@echo "🌐 Opening coverage reports..."
	@if [ -f "coverage-reports/unified-coverage-report.html" ]; then \
		open coverage-reports/unified-coverage-report.html; \
	else \
		echo "❌ Unified coverage report not found. Run 'make coverage' first."; \
	fi
	@if [ -f "coverage.html" ]; then \
		open coverage.html; \
	fi
	@if [ -f "frontend/coverage/index.html" ]; then \
		open frontend/coverage/index.html; \
	fi

# Clean coverage files
coverage-clean:
	@echo "🧹 Cleaning coverage files..."
	rm -f coverage.out coverage.html backend-coverage.json
	rm -rf frontend/coverage
	rm -rf coverage-reports
	rm -f coverage-gaps-summary.md
	rm -rf test-templates

# Generate coverage badge (requires shields.io)
coverage-badge:
	@echo "🏷️  Generating coverage badge..."
	@if [ -f "coverage.out" ]; then \
		COVERAGE=$$(go tool cover -func=coverage.out | grep total | awk '{print $$3}' | sed 's/%//'); \
		echo "Backend Coverage: $$COVERAGE%"; \
		curl -s "https://img.shields.io/badge/Backend_Coverage-$$COVERAGE%25-$(if [ $$COVERAGE -ge 80 ]; then echo "brightgreen"; elif [ $$COVERAGE -ge 60 ]; then echo "yellow"; else echo "red"; fi)" > backend-coverage-badge.svg; \
	fi
	@if [ -f "frontend/coverage/coverage-summary.json" ]; then \
		FRONTEND_COVERAGE=$$(node -p "require('./frontend/coverage/coverage-summary.json').total.lines.pct"); \
		echo "Frontend Coverage: $$FRONTEND_COVERAGE%"; \
		curl -s "https://img.shields.io/badge/Frontend_Coverage-$$FRONTEND_COVERAGE%25-$(if [ $$(echo "$$FRONTEND_COVERAGE >= 80" | bc) -eq 1 ]; then echo "brightgreen"; elif [ $$(echo "$$FRONTEND_COVERAGE >= 60" | bc) -eq 1 ]; then echo "yellow"; else echo "red"; fi)" > frontend-coverage-badge.svg; \
	fi

# Comprehensive Testing Commands
# ===============================

# Run all tests (backend + frontend) with backend server
test-all: run-tests start-test-server frontend-test frontend-test-responsive kill-server
	@echo "✅ All tests completed!"

# Run quick validation tests
test-quick: test-smoke frontend-test-smoke
	@echo "✅ Quick validation completed!"

# Run smoke tests for fast validation
test-smoke:
	@echo "💨 Running backend smoke tests..."
	go test -run TestSmoke ./... -v

# Run comprehensive test suite with coverage
test-comprehensive: test-coverage frontend-test-coverage
	@echo "📊 Comprehensive test suite with coverage completed!"

# Run performance and load tests
test-performance: test-bench frontend-test-performance
	@echo "⚡ Performance tests completed!"

# Run integration tests
test-integration: frontend-test-integration
	@echo "🔗 Integration tests completed!"

# Continuous Integration Testing
# ===============================

# Run CI test suite (optimized for CI/CD)
test-ci: 
	@echo "🤖 Running CI test suite..."
	@echo "Backend tests..."
	go test -race -coverprofile=backend-coverage.out ./...
	@echo "Frontend tests..."
	cd frontend && yarn test --coverage --watchAll=false --ci
	@echo "✅ CI test suite completed!"

# Run tests with proper timeouts for CI
test-ci-fast:
	@echo "🚀 Running fast CI test suite..."
	@echo "Backend smoke tests..."
	go test -run TestSmoke ./... -timeout=30s
	@echo "Frontend smoke tests..."
	cd frontend && yarn test src/__tests__/smoke.test.ts --watchAll=false --testTimeout=10000
	@echo "✅ Fast CI test suite completed!"

# Development Testing Commands
# =============================

# Run tests before committing
test-pre-commit: test-quick
	@echo "🔍 Pre-commit validation..."
	@echo "Checking backend formatting..."
	go fmt ./...
	@echo "Checking frontend linting..."
	cd frontend && yarn lint --fix || echo "⚠️  Linting issues found"
	@echo "✅ Pre-commit checks completed!"

# Run full test suite for releases
test-release: test-comprehensive test-performance
	@echo "🚀 Release validation..."
	@echo "Running security checks..."
	@command -v gosec >/dev/null 2>&1 && gosec ./... || echo "⚠️  Install gosec for security scanning"
	@echo "Checking dependencies..."
	go mod verify
	cd frontend && yarn audit --level moderate || echo "⚠️  Frontend dependency vulnerabilities found"
	@echo "✅ Release validation completed!"

# Debug and Development
# =====================

# Run tests with debug output
test-debug:
	@echo "🐛 Running tests with debug output..."
	go test -v -race ./... 2>&1 | tee backend-test-debug.log
	cd frontend && yarn test --verbose --watchAll=false 2>&1 | tee frontend-test-debug.log

# Clean test artifacts
test-clean:
	@echo "🧹 Cleaning test artifacts..."
	rm -f coverage.out backend-coverage.out backend-test-debug.log frontend-test-debug.log
	cd frontend && rm -rf coverage/ jest-coverage/ test-results/
	@echo "✅ Test artifacts cleaned!"

# Load Testing Commands
# ======================

# Run load tests (requires backend to be running)
test-load:
	@echo "📈 Running load tests..."
	@echo "⚠️  Make sure backend is running (make run-api)"
	cd frontend && yarn test src/__tests__/performance.test.ts --testNamePattern="load|concurrent|stress" --watchAll=false

# Run stress tests
test-stress:
	@echo "💪 Running stress tests..."
	@echo "⚠️  Make sure backend is running (make run-api)"
	cd frontend && yarn test src/__tests__/performance.test.ts --testNamePattern="stress|sustained|burst" --watchAll=false

# Test Environment Setup
# =======================

# Setup test environment
test-setup: frontend-test-deps
	@echo "🔧 Setting up test environment..."
	@echo "Installing backend test tools..."
	go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest || echo "⚠️  Could not install gosec"
	@echo "✅ Test environment setup completed!"

# Validate test setup
test-validate:
	@echo "🔍 Validating test setup..."
	@echo "Backend tools..."
	@command -v go >/dev/null 2>&1 && echo "✅ Go installed" || echo "❌ Go not found"
	@echo "Frontend tools..."
	@cd frontend && command -v yarn >/dev/null 2>&1 && echo "✅ Yarn installed" || echo "❌ Yarn not found"
	@cd frontend && test -f node_modules/.bin/jest && echo "✅ Jest installed" || echo "❌ Jest not found"
	@echo "Test configuration..."
	@cd frontend && test -f jest.config.js && echo "✅ Jest config found" || echo "❌ Jest config missing"
	@test -f Makefile && echo "✅ Makefile found" || echo "❌ Makefile missing"

# Generate comprehensive test report
test-report:
	@echo "📊 Generating comprehensive test report..."
	@chmod +x scripts/test-report.sh
	@./scripts/test-report.sh

# Run tests and generate report (alias for test-report)
test-full-report: test-report

# Build the backend project
build:
	go build -o bin/gogent ./cmd/gogent

# Backend Demo Commands
# ====================

# Run auto-demo (detects configuration)
run:
	go run cmd/gogent/*.go

# Run simple demo with mock responses
run-simple:
	go run cmd/gogent/*.go --simple

# Run simple demo with real Gemini API (no database)
run-simple-api:
	go run cmd/gogent/*.go --simple-api

# Start HTTP server for frontend integration (alias for run-server)
run-api: run-server

# Start HTTP server for frontend integration
run-server:
	@echo "🧹 Cleaning up any existing processes..."
	@pkill -9 -f gogent 2>/dev/null || true
	@pkill -9 -f "go run.*gogent" 2>/dev/null || true
	@lsof -ti:8080 | xargs kill -9 2>/dev/null || true
	@sleep 2
	@echo "✅ Port 8080 is now available"
	@echo "🔧 Loading environment configuration..."
	@if [ -f "config.env" ]; then \
		echo "📋 Using config.env for environment setup"; \
		export $$(grep -v '^#' config.env | xargs); \
		if [ -n "$$API_ENCRYPTION_KEY" ]; then \
			export EXPO_PUBLIC_API_ENCRYPTION_KEY="$$API_ENCRYPTION_KEY"; \
			echo "🔐 Synchronized encryption keys"; \
		fi; \
	fi
	@echo "🚀 Starting GoGent HTTP Server..."
	@if [ -f "config.env" ]; then \
		export $$(grep -v '^#' config.env | xargs) && \
		export EXPO_PUBLIC_API_ENCRYPTION_KEY="$$API_ENCRYPTION_KEY" && \
		go run cmd/gogent/*.go --server; \
	else \
		go run cmd/gogent/*.go --server; \
	fi

# Run real API demo with database logging (one-time execution)
run-api-demo:
	go run cmd/gogent/*.go --real-api

# Run the database version (requires DB setup)
run-db:
	go run cmd/gogent/*.go --database

# Show help
help:
	go run cmd/gogent/*.go --help

# Start backend server for testing (background with health check)
start-test-server:
	@echo "🧪 Starting backend server for integration tests..."
	@# Clean up any existing processes first
	@pkill -9 -f gogent 2>/dev/null || true
	@pkill -9 -f "go run.*gogent" 2>/dev/null || true
	@lsof -ti:8080 | xargs kill -9 2>/dev/null || true
	@sleep 2
	@echo "🚀 Starting GoGent test server in background..."
	@go run cmd/gogent/*.go --server > /tmp/gogent-test.log 2>&1 & echo $$! > /tmp/gogent-test.pid
	@echo "⏳ Waiting for server to be ready..."
	@for i in 1 2 3 4 5 6 7 8 9 10; do \
		if curl -s http://localhost:8080/test > /dev/null 2>&1; then \
			echo "✅ Backend server is ready for testing!"; \
			break; \
		elif [ $$i -eq 10 ]; then \
			echo "❌ Server failed to start within 10 seconds"; \
			echo "📋 Server logs:"; \
			cat /tmp/gogent-test.log 2>/dev/null || echo "No logs available"; \
			exit 1; \
		else \
			echo "🔄 Attempt $$i/10: Server not ready yet, waiting..."; \
			sleep 1; \
		fi; \
	done

# Kill all server processes and free port 8080
kill-server:
	@echo "🧹 Stopping all GoGent processes..."
	@pkill -9 -f gogent 2>/dev/null || true
	@pkill -9 -f "go run.*gogent" 2>/dev/null || true
	@lsof -ti:8080 | xargs kill -9 2>/dev/null || true
	@# Clean up test server files
	@rm -f /tmp/gogent-test.pid /tmp/gogent-test.log 2>/dev/null || true
	@echo "✅ All processes stopped and port 8080 freed"

# Kill all frontend processes and free port 8081
kill-frontend:
	@echo "🧹 Stopping all frontend processes..."
	@pkill -9 -f "expo start" 2>/dev/null || true
	@pkill -9 -f "yarn start" 2>/dev/null || true
	@pkill -9 -f "yarn dev" 2>/dev/null || true
	@pkill -9 -f "metro" 2>/dev/null || true
	@lsof -ti:8081 | xargs kill -9 2>/dev/null || true
	@lsof -ti:8082 | xargs kill -9 2>/dev/null || true
	@echo "✅ All frontend processes stopped and ports 8081/8082 freed"

# Frontend Setup Commands
# =======================

# Setup frontend project
frontend-setup: frontend-install
	@echo "🎯 Frontend Setup Complete!"
	@echo ""
	@echo "📱 Next steps:"
	@echo "1. Make sure the backend is running: 'make run-api'"
	@echo "2. Start the frontend: 'make frontend-start'"
	@echo "3. Run on iOS: 'make frontend-ios'"
	@echo "4. Run on Android: 'make frontend-android'"
	@echo ""

# Install frontend dependencies
frontend-install:
	@echo "📦 Installing frontend dependencies..."
	cd frontend && yarn install

# Frontend Development Commands
# ============================

# Start Expo development server
frontend-start:
	@echo "🚀 Starting Expo development server..."
	cd frontend && npx expo start --clear

# Run on iOS simulator
frontend-ios:
	@echo "📱 Starting iOS app..."
	cd frontend && npx expo start --ios

# Run on Android simulator
frontend-android:
	@echo "🤖 Starting Android app..."
	cd frontend && npx expo start --android

# Run on web browser (with cleanup)
frontend-web:
	@echo "🧹 Cleaning up any existing frontend processes..."
	@pkill -9 -f "expo start" 2>/dev/null || true
	@pkill -9 -f "yarn start" 2>/dev/null || true
	@pkill -9 -f "yarn dev" 2>/dev/null || true
	@pkill -9 -f "metro" 2>/dev/null || true
	@lsof -ti:8081 | xargs kill -9 2>/dev/null || true
	@lsof -ti:8082 | xargs kill -9 2>/dev/null || true
	@sleep 2
	@echo "✅ Ports 8081/8082 are now available"
	@echo "🌐 Starting web app..."
	cd frontend && npx expo start --web

# Build frontend for production
frontend-build:
	@echo "🔨 Building frontend for production..."
	cd frontend && yarn build

# Frontend Maintenance Commands
# =============================

# Clean frontend dependencies and cache
frontend-clean:
	@echo "🧹 Cleaning frontend..."
	cd frontend && rm -rf node_modules yarn.lock
	cd frontend && rm -rf .expo

# Reinstall frontend dependencies
frontend-reinstall: frontend-clean frontend-install

# Type check frontend
frontend-typecheck:
	@echo "🔍 Type checking frontend..."
	cd frontend && yarn type-check

# Lint frontend code
frontend-lint:
	@echo "🔍 Linting frontend..."
	cd frontend && yarn lint

# Fix frontend linting issues
frontend-lint-fix:
	@echo "🔧 Fixing frontend lint issues..."
	cd frontend && yarn lint --fix

# Backend Maintenance Commands
# ============================

# Clean generated files
clean:
	rm -rf internal/db
	rm -f coverage.out coverage.html

# Format backend code
fmt:
	go fmt ./...

# Lint backend code
lint:
	golangci-lint run

# Full Project Commands
# ====================

# Clean everything (backend + frontend)
clean-all: clean frontend-clean
	@echo "🧹 Cleaned backend and frontend"

# Kill everything (backend + frontend processes)
kill-all: kill-server kill-frontend
	@echo "🧹 Stopped all processes (backend + frontend)"

# Install all dependencies (backend + frontend)
install-all: install-deps frontend-install
	@echo "📦 Installed all dependencies"

# Development setup (first time setup)
dev-setup: setup
	cp config.example.env config.env
	@echo "🎯 GoGent Full Stack Development Setup Complete!"
	@echo ""
	@echo "📝 Backend Setup:"
	@echo "1. Edit config.env and add your GEMINI_API_KEY"
	@echo "2. Get your API key from: https://aistudio.google.com/app/apikey"
	@echo "3. For database features: set up MySQL and run 'make init-db'"
	@echo ""
	@echo "📱 Frontend Setup:"
	@echo "4. Backend must be running for full functionality"
	@echo "5. Start frontend with: 'make frontend-start'"
	@echo ""
	@echo "🚀 Quick start commands:"
	@echo "  make run-api                # Start backend with real API + database"
	@echo "  make frontend-start         # Start mobile app development server"
	@echo "  make frontend-ios           # Run on iOS simulator"
	@echo "  make frontend-android       # Run on Android simulator"
	@echo ""
	@echo "🔍 Development commands:"
	@echo "  make help                   # Backend help"
	@echo "  make frontend-typecheck     # Check TypeScript types"
	@echo "  make frontend-lint          # Lint frontend code"
	@echo "  make clean-all              # Clean everything"

# Status check - verify everything is set up correctly
status:
	@echo "🔍 GoGent Project Status Check"
	@echo "================================"
	@echo ""
	@echo "📊 Backend Status:"
	@go version 2>/dev/null && echo "✅ Go installed" || echo "❌ Go not found"
	@test -f config.env && echo "✅ Config file exists" || echo "❌ Config file missing (run 'make dev-setup')"
	@test -d internal/db && echo "✅ Database code generated" || echo "❌ Database code missing (run 'make generate-db')"
	@echo ""
	@echo "📱 Frontend Status:"
	@cd frontend && yarn --version 2>/dev/null && echo "✅ Yarn installed" || echo "❌ Yarn not found"
	@cd frontend && test -d node_modules && echo "✅ Frontend dependencies installed" || echo "❌ Frontend dependencies missing (run 'make frontend-install')"
	@cd frontend && test -f yarn.lock && echo "✅ Yarn lockfile exists" || echo "❌ No yarn lockfile"
	@echo ""
	@echo "🚀 Ready to start:"
	@echo "  Backend:  make run-api"
	@echo "  Frontend: make frontend-start"

# Show all available commands
commands:
	@echo "🛠️  GoGent Available Commands"
	@echo "============================"
	@echo ""
	@echo "📦 Setup & Installation:"
	@echo "  dev-setup              # First-time setup (backend + frontend)"
	@echo "  setup                  # Setup backend only"
	@echo "  frontend-setup         # Setup frontend only"
	@echo "  install-all            # Install all dependencies"
	@echo "  status                 # Check project status"
	@echo ""
	@echo "🔧 Backend Commands:"
	@echo "  run                    # Auto-detect demo mode"
	@echo "  run-simple             # Mock responses demo"
	@echo "  run-simple-api         # Real API demo (no DB)"
	@echo "  run-api                # Real API + database demo"
	@echo "  run-db                 # Database demo"
	@echo "  build                  # Build backend binary"
	@echo "  run-tests              # Run backend tests"
	@echo ""
	@echo "🐳 Docker Commands:"
	@echo "  docker-build-backend   # Build backend Docker image"
	@echo "  docker-build-frontend  # Build frontend Docker image (amd64)"
	@echo "  docker-build-all       # Build both Docker images"
	@echo "  docker-push-backend    # Push backend image to registry"
	@echo "  docker-push-frontend   # Push frontend image to registry"
	@echo "  docker-push-all        # Push both images to registry"
	@echo "  docker-deploy          # Build and push all images"
	@echo ""
	@echo "☸️  Kubernetes Commands:"
	@echo "  k8s-deploy             # Deploy to Kubernetes cluster"
	@echo "  k8s-update-images      # Update deployment files with new image tags"
	@echo "  k8s-force-update-images # Force update live deployments with new image tags"
	@echo "  k8s-restart            # Restart deployments"
	@echo "  k8s-wait               # Wait for deployments to be ready"
	@echo "  k8s-status             # Show deployment status"
	@echo "  k8s-pods               # Show pod status"
	@echo "  k8s-endpoints          # Show services and ingress"
	@echo "  k8s-logs-backend       # Show backend logs"
	@echo "  k8s-logs-frontend      # Show frontend logs"
	@echo "  k8s-delete             # Delete all Kubernetes resources"
	@echo ""
	@echo "🚀 Complete Deployment:"
	@echo "  deploy-all             # Complete deployment workflow"
	@echo "  deploy-quick           # Quick deployment (no build)"
	@echo "  deploy-backend         # Build and deploy backend only"
	@echo "  deploy-frontend        # Build and deploy frontend only"
	@echo ""
	@echo "📋 Testing Commands:"
	@echo "  Backend Tests:"
	@echo "    run-tests              # Run backend tests"
	@echo "    test-coverage          # Run backend tests with coverage"
	@echo "    test-verbose           # Run backend tests with verbose output"
	@echo "    test-race              # Run backend tests with race detection"
	@echo "    test-bench             # Run backend benchmarks"
	@echo ""
	@echo "  Frontend Tests:"
	@echo "    frontend-test          # Run all frontend tests"
	@echo "    frontend-test-coverage # Run frontend tests with coverage"
	@echo "    frontend-test-watch    # Run frontend tests in watch mode"
	@echo "    frontend-test-unit     # Run frontend unit tests"
	@echo "    frontend-test-integration # Run frontend integration tests"
	@echo "    frontend-test-e2e      # Run frontend end-to-end tests"
	@echo "    frontend-test-performance # Run frontend performance tests"
	@echo "    frontend-test-smoke    # Run frontend smoke tests"
	@echo ""
	@echo "  Comprehensive Testing:"
	@echo "    test-all               # Run all tests (backend + frontend)"
	@echo "    test-quick             # Run quick validation tests"
	@echo "    test-comprehensive     # Run comprehensive test suite with coverage"
	@echo "    test-performance       # Run performance and load tests"
	@echo "    test-integration       # Run integration tests"
	@echo ""
	@echo "  CI/CD Testing:"
	@echo "    test-ci                # Run CI test suite (optimized for CI/CD)"
	@echo "    test-ci-fast           # Run fast CI test suite"
	@echo ""
	@echo "  Development Testing:"
	@echo "    test-pre-commit        # Run tests before committing"
	@echo "    test-release           # Run full test suite for releases"
	@echo "    test-debug             # Run tests with debug output"
	@echo ""
	@echo "  Load Testing:"
	@echo "    test-load              # Run load tests (requires backend running)"
	@echo "    test-stress            # Run stress tests (requires backend running)"
	@echo ""
	@echo "  Test Environment:"
	@echo "    test-setup             # Setup test environment"
	@echo "    test-validate          # Validate test setup"
	@echo "    test-clean             # Clean test artifacts"
	@echo ""
	@echo "  Test Reporting:"
	@echo "    test-report            # Generate comprehensive test report"
	@echo "    test-full-report       # Generate full test report (alias)"
	@echo ""
	@echo ""
	@echo "📱 Frontend Commands:"
	@echo "  frontend-start         # Start Expo dev server"
	@echo "  frontend-ios           # Run on iOS simulator"
	@echo "  frontend-android       # Run on Android simulator"
	@echo "  frontend-web           # Run in web browser (with cleanup)"
	@echo "  frontend-build         # Build for production"
	@echo "  kill-frontend          # Stop all frontend processes"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  clean-all              # Clean everything"
	@echo "  kill-all               # Stop all processes"
	@echo "  kill-server            # Stop backend processes"
	@echo "  kill-frontend          # Stop frontend processes"
	@echo "  frontend-clean         # Clean frontend only"
	@echo "  frontend-reinstall     # Reinstall frontend deps"
	@echo "  frontend-lint          # Lint frontend code"
	@echo "  frontend-typecheck     # Check TypeScript types" 