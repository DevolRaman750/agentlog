#!/bin/bash

# Agentlog Kubernetes Deployment Script
set -e

echo "🚀 Deploying Agentlog to Kubernetes..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Apply namespace first
echo "📦 Creating namespace..."
kubectl apply -f namespace.yaml

# Apply ConfigMap
echo "⚙️ Applying ConfigMap..."
kubectl apply -f configmap.yaml

# Check if secrets exist and apply them
if [ -d "secrets" ] && [ "$(ls -A secrets/*.yaml 2>/dev/null)" ]; then
    echo "🔐 Applying secrets..."
    kubectl apply -f secrets/
else
    echo "⚠️ No secrets found in k8s/secrets/ directory"
    echo "   Please create your secrets manually before running this script"
    echo "   See k8s/secrets/README.md for instructions"
fi

# Apply services first (before deployments)
echo "🌐 Applying services..."
kubectl apply -f backend-service.yaml
kubectl apply -f frontend-service.yaml

# Apply deployments
echo "🚢 Applying deployments..."
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml

# Apply HPAs (Horizontal Pod Autoscalers)
echo "📈 Applying HPAs..."
kubectl apply -f backend-hpa.yaml
kubectl apply -f frontend-hpa.yaml

# Apply ingress
echo "🔗 Applying ingress..."
kubectl apply -f ingress.yaml

echo "✅ Deployment complete!"
echo ""
echo "📋 Check status with:"
echo "   kubectl get pods -n agentlog"
echo "   kubectl get services -n agentlog"
echo "   kubectl get ingress -n agentlog"
echo "   kubectl get hpa -n agentlog"
echo ""
echo "📊 View logs with:"
echo "   kubectl logs -f deployment/agentlog-backend -n agentlog"
echo "   kubectl logs -f deployment/agentlog-frontend -n agentlog" 