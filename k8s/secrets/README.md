# Agentlog Kubernetes Secrets Folder

This folder is **excluded from version control** via `.gitignore` so you can safely place real secret manifests here without the risk of committing them.

## Required Secrets

### Backend Secrets (`backend-secrets.yaml`)
Contains sensitive configuration for the backend application:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: agentlog-backend-secrets
  namespace: agentlog
type: Opaque
stringData:
  DB_URL: "mysql://user:password@tcp(mysql-host:3306)/agentlog"
  JWT_SECRET: "your-secure-jwt-secret"
  API_ENCRYPTION_KEY: "your-32-character-encryption-key"
  GEMINI_API_KEY: "your-gemini-api-key"
```

### MySQL Secrets (`mysql-secret.yaml`)
Contains database connection credentials:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: mysql-secret
  namespace: agentlog
type: Opaque
stringData:
  mysql-database: "agentlog"
  mysql-host: "your-mysql-host.com"
  mysql-password: "your-mysql-password"
  mysql-port: "25060"
  mysql-user: "your-mysql-username"
```

## Setup Instructions

1. Copy the example files:
   ```bash
   cp backend-secrets.yaml.example backend-secrets.yaml
   cp mysql-secret.yaml.example mysql-secret.yaml
   ```

2. Edit the files and replace placeholder values with real secrets

3. Apply to the cluster:
   ```bash
   kubectl apply -f k8s/secrets/backend-secrets.yaml
   kubectl apply -f k8s/secrets/mysql-secret.yaml
   ```

## Security Migration

All sensitive values have been moved from `k8s/configmap.yaml` to proper Secret resources for better security. The ConfigMap now only contains non-sensitive configuration values. 