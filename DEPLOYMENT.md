# Production Deployment Guide

This guide covers deploying GenAI Stack to production environments.

## Pre-Deployment Checklist

- [ ] Supabase production project created
- [ ] All API keys obtained (Groq, SerpAPI)
- [ ] Domain name configured (if applicable)
- [ ] SSL certificates ready (for non-Kubernetes deployments)
- [ ] Backup strategy defined
- [ ] Monitoring tools selected

## Security Hardening

### 1. Update Database Policies

Replace public policies with authenticated user policies:

```sql
-- Remove public policies
DROP POLICY IF EXISTS "Allow public read access to stacks" ON stacks;
DROP POLICY IF EXISTS "Allow public insert to stacks" ON stacks;

-- Add authenticated policies
CREATE POLICY "Users can read own stacks"
  ON stacks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stacks"
  ON stacks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### 2. Environment Variables

Never commit `.env` files. Use secure secret management:

- **Docker**: Use Docker secrets
- **Kubernetes**: Use Kubernetes secrets
- **Cloud**: Use cloud provider secret managers (AWS Secrets Manager, GCP Secret Manager)

### 3. API Key Management

- Store API keys in backend only
- Never expose in frontend code
- Rotate keys regularly
- Use different keys for dev/staging/prod

## Docker Deployment

### 1. Build Images

```bash
# Build backend
cd backend
docker build -t genai-stack-backend:v1.0.0 .

# Build frontend
cd ..
docker build -t genai-stack-frontend:v1.0.0 .
```

### 2. Tag for Registry

```bash
# For Docker Hub
docker tag genai-stack-backend:v1.0.0 yourusername/genai-stack-backend:v1.0.0
docker tag genai-stack-frontend:v1.0.0 yourusername/genai-stack-frontend:v1.0.0

# For AWS ECR
docker tag genai-stack-backend:v1.0.0 123456789.dkr.ecr.us-east-1.amazonaws.com/genai-stack-backend:v1.0.0
docker tag genai-stack-frontend:v1.0.0 123456789.dkr.ecr.us-east-1.amazonaws.com/genai-stack-frontend:v1.0.0
```

### 3. Push Images

```bash
# Docker Hub
docker push yourusername/genai-stack-backend:v1.0.0
docker push yourusername/genai-stack-frontend:v1.0.0

# AWS ECR (authenticate first)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/genai-stack-backend:v1.0.0
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/genai-stack-frontend:v1.0.0
```

### 4. Deploy with Docker Compose

```bash
# Create production docker-compose.yml
cp docker-compose.yml docker-compose.prod.yml

# Edit for production (add restart policies, health checks)
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Kubernetes Deployment

### 1. Prepare Cluster

```bash
# For AWS EKS
eksctl create cluster --name genai-stack-cluster --region us-east-1

# For GCP GKE
gcloud container clusters create genai-stack-cluster --zone us-central1-a

# For Azure AKS
az aks create --resource-group genai-stack-rg --name genai-stack-cluster

# For local testing (minikube)
minikube start --cpus 4 --memory 8192
```

### 2. Create Secrets

```bash
# Create secrets from .env file
cd k8s

# Copy and edit secrets template
cp secrets.yaml.template secrets.yaml
# Edit secrets.yaml with your actual credentials

# Apply secrets
kubectl apply -f secrets.yaml
```

### 3. Deploy Application

```bash
# Deploy backend
kubectl apply -f backend-deployment.yaml

# Deploy frontend
kubectl apply -f frontend-deployment.yaml

# Verify deployments
kubectl get deployments
kubectl get pods
kubectl get services
```

### 4. Configure Ingress (Optional)

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: genai-stack-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - genai-stack.yourdomain.com
    secretName: genai-stack-tls
  rules:
  - host: genai-stack.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: genai-stack-frontend
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: genai-stack-backend
            port:
              number: 8000
```

```bash
kubectl apply -f ingress.yaml
```

### 5. Setup Auto-scaling

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: genai-stack-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

```bash
kubectl apply -f hpa.yaml
```

## Monitoring Setup

### Prometheus & Grafana

```bash
# Add Prometheus Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack

# Access Grafana
kubectl port-forward svc/prometheus-grafana 3000:80

# Default credentials:
# Username: admin
# Password: prom-operator
```

### Custom Dashboards

1. Import dashboard for FastAPI: Dashboard ID `14410`
2. Import dashboard for Nginx: Dashboard ID `12708`
3. Create custom dashboard for workflow metrics

### Application Metrics

Add to `backend/main.py`:

```python
from prometheus_client import Counter, Histogram, generate_latest

workflow_executions = Counter('workflow_executions_total', 'Total workflow executions')
workflow_duration = Histogram('workflow_duration_seconds', 'Workflow execution duration')

@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type="text/plain")
```

## Logging Setup

### ELK Stack

```bash
# Create namespace
kubectl create namespace logging

# Install Elasticsearch
helm install elasticsearch elastic/elasticsearch -n logging

# Install Logstash
helm install logstash elastic/logstash -n logging

# Install Kibana
helm install kibana elastic/kibana -n logging

# Access Kibana
kubectl port-forward svc/kibana-kibana 5601:5601 -n logging
```

### Centralized Logging

Update deployments to output structured JSON logs:

```python
# backend/main.py
import logging
import json

logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)

logger = logging.getLogger(__name__)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "method": request.method,
        "url": str(request.url),
        "client_ip": request.client.host,
    }
    logger.info(json.dumps(log_data))
    response = await call_next(request)
    return response
```

## Backup Strategy

### Database Backups

```bash
# Supabase automatically backs up your database
# Configure retention in Supabase dashboard

# Manual backup
pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql

# Schedule backups with cron
0 2 * * * /path/to/backup-script.sh
```

### ChromaDB Backups

```python
# Add backup endpoint in backend
@app.post("/admin/backup/chromadb")
async def backup_chromadb():
    # Implement ChromaDB persistence
    vector_store.persist()
    return {"message": "Backup completed"}
```

## Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_stacks_user_id ON stacks(user_id);
CREATE INDEX idx_documents_stack_id ON documents(stack_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM documents WHERE stack_id = 'xxx';
```

### 2. Caching Layer

Add Redis for caching:

```python
from redis import Redis

redis_client = Redis(host='redis', port=6379, decode_responses=True)

@app.get("/stacks/{stack_id}")
async def get_stack(stack_id: str):
    # Check cache first
    cached = redis_client.get(f"stack:{stack_id}")
    if cached:
        return json.loads(cached)

    # Fetch from database
    result = supabase.table("stacks").select("*").eq("id", stack_id).execute()

    # Cache for 5 minutes
    redis_client.setex(f"stack:{stack_id}", 300, json.dumps(result.data))

    return result.data
```

### 3. CDN Configuration

```nginx
# nginx.conf for frontend
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Health Checks

### Backend Health Check

```python
@app.get("/health")
async def health_check():
    checks = {
        "database": False,
        "vector_store": False,
    }

    try:
        supabase.table("stacks").select("count").execute()
        checks["database"] = True
    except:
        pass

    checks["vector_store"] = True  # Add actual check

    status = "healthy" if all(checks.values()) else "unhealthy"
    return {"status": status, "checks": checks}
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## SSL/TLS Configuration

### Let's Encrypt with Cert-Manager

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Disaster Recovery

### 1. Backup Plan

- Daily database backups
- Weekly full system backups
- Offsite backup storage
- Regular backup testing

### 2. Recovery Procedure

```bash
# Restore database
psql -h db.your-project.supabase.co -U postgres -d postgres < backup.sql

# Redeploy application
kubectl apply -f k8s/

# Verify services
kubectl get pods
kubectl logs -f deployment/genai-stack-backend
```

## Cost Optimization

1. **Right-size resources**: Adjust CPU/memory based on actual usage
2. **Use spot instances**: For non-critical workloads
3. **Implement autoscaling**: Scale down during low traffic
4. **Optimize images**: Use multi-stage builds, Alpine base images
5. **Cache effectively**: Reduce API calls to external services

## Production Checklist

- [ ] All secrets stored securely
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Health checks implemented
- [ ] SSL/TLS certificates configured
- [ ] Auto-scaling configured
- [ ] Disaster recovery plan documented
- [ ] Performance testing completed
- [ ] Security audit passed
- [ ] Documentation updated

## Maintenance

### Regular Tasks

- **Daily**: Check monitoring dashboards
- **Weekly**: Review logs for errors
- **Monthly**: Update dependencies
- **Quarterly**: Security audit, backup testing

### Update Procedure

```bash
# 1. Build new version
docker build -t genai-stack-backend:v1.1.0 .

# 2. Test in staging
kubectl apply -f k8s/ --namespace staging

# 3. Deploy to production
kubectl set image deployment/genai-stack-backend backend=genai-stack-backend:v1.1.0

# 4. Monitor rollout
kubectl rollout status deployment/genai-stack-backend

# 5. Rollback if needed
kubectl rollout undo deployment/genai-stack-backend
```

## Support

For production support:
- Monitor application logs
- Set up alerts for critical errors
- Maintain runbook for common issues
- Document incident response procedures
