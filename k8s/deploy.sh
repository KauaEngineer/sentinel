#!/bin/bash
set -euo pipefail

echo "=== Sentinel — Kubernetes Deploy ==="

echo ""
echo "[1/3] Building Docker images..."
docker build -t sentinel-backend:latest ./backend
docker build -t sentinel-mock-services:latest ./mock_services
docker build -t sentinel-frontend:latest ./frontend

echo ""
echo "[2/3] Loading images into cluster..."
if command -v minikube &> /dev/null; then
    minikube image load sentinel-backend:latest
    minikube image load sentinel-mock-services:latest
    minikube image load sentinel-frontend:latest
elif command -v kind &> /dev/null; then
    kind load docker-image sentinel-backend:latest
    kind load docker-image sentinel-mock-services:latest
    kind load docker-image sentinel-frontend:latest
else
    echo "No local k8s detected (minikube/kind). Images built locally."
fi

echo ""
echo "[3/3] Applying Kubernetes manifests..."
kubectl apply -k k8s/base/

echo ""
echo "=== Deploy complete ==="
echo "Waiting for pods..."
kubectl -n sentinel rollout status deployment/postgres --timeout=60s
kubectl -n sentinel rollout status deployment/zookeeper --timeout=60s
kubectl -n sentinel rollout status deployment/kafka --timeout=90s
kubectl -n sentinel rollout status deployment/mock-services --timeout=60s
kubectl -n sentinel rollout status deployment/backend --timeout=90s
kubectl -n sentinel rollout status deployment/frontend --timeout=60s

echo ""
echo "All pods:"
kubectl -n sentinel get pods

echo ""
echo "Services:"
kubectl -n sentinel get svc

echo ""
echo "Frontend available at: http://localhost:30000 (NodePort)"
echo "Backend API at: kubectl -n sentinel port-forward svc/backend 8000:8000"
