# Agentlog Kubernetes Secrets Folder

This folder is **excluded from version control** via `.gitignore` so you can safely place real secret manifests here without the risk of committing them.

1. Create your secret manifest (e.g. `backend-secrets.yaml`) with the sensitive key-value pairs required by the application. Example:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: agentlog-backend-secrets
  namespace: agentlog
type: Opaque
stringData:
  DB_URL: mysql://user:password@tcp(mysql:3306)/agentlog
  GEMINI_API_KEY: <your_api_key>
  JWT_SECRET: <change-me>
```

2. Apply it to the cluster:

```bash
kubectl apply -f k8s/secrets/backend-secrets.yaml
```

Keep all actual secret YAML files inside this directory so they stay out of git history. 