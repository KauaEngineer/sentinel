#!/bin/bash
set -euo pipefail

echo "=== Sentinel — AWS Deploy ==="

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
EKS_CLUSTER="${EKS_CLUSTER:-sentinel-eks}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo ""
echo "[1/5] Logging into ECR..."
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$ECR_REGISTRY"

echo ""
echo "[2/5] Building Docker images..."
docker build -t "$ECR_REGISTRY/sentinel/backend:$IMAGE_TAG" ./backend
docker build -t "$ECR_REGISTRY/sentinel/mock-services:$IMAGE_TAG" ./mock_services
docker build -t "$ECR_REGISTRY/sentinel/frontend:$IMAGE_TAG" ./frontend

echo ""
echo "[3/5] Pushing images to ECR..."
docker push "$ECR_REGISTRY/sentinel/backend:$IMAGE_TAG"
docker push "$ECR_REGISTRY/sentinel/mock-services:$IMAGE_TAG"
docker push "$ECR_REGISTRY/sentinel/frontend:$IMAGE_TAG"

echo ""
echo "[4/5] Updating kubeconfig..."
aws eks update-kubeconfig --name "$EKS_CLUSTER" --region "$AWS_REGION"

echo ""
echo "[5/5] Applying Kubernetes manifests..."
cd k8s/overlays/aws
kustomize edit set image \
  "sentinel-backend=$ECR_REGISTRY/sentinel/backend:$IMAGE_TAG" \
  "sentinel-mock-services=$ECR_REGISTRY/sentinel/mock-services:$IMAGE_TAG" \
  "sentinel-frontend=$ECR_REGISTRY/sentinel/frontend:$IMAGE_TAG"
kubectl apply -k .

echo ""
echo "Waiting for rollouts..."
kubectl -n sentinel rollout status deployment/backend --timeout=120s
kubectl -n sentinel rollout status deployment/frontend --timeout=120s

echo ""
echo "=== Deploy complete ==="
kubectl -n sentinel get pods
echo ""
echo "Ingress:"
kubectl -n sentinel get ingress
