# Sentinel

Plataforma de monitoramento de servicos em tempo real com deteccao automatica de falhas, analise de padroes e alertas.

**[Demo ao vivo](https://sentinel-demo.vercel.app)** | Sistema completo roda localmente com `docker compose up`

---

## Arquitetura

```
┌─────────────┐     health      ┌────────────────┐
│ Mock APIs   │◄────checks──────│  Monitor       │
│ (5 servicos)│                 │  (FastAPI)     │
└─────────────┘                 └───────┬────────┘
                                        │ publish
                                        ▼
                                ┌────────────────┐
                                │     Kafka      │
                                │ service-events │
                                └──┬──────────┬──┘
                          consume  │          │  consume
                       ┌───────────┘          └──────────────┐
                       ▼                                     ▼
              ┌────────────────┐                    ┌────────────────┐
              │   Persister    │                    │   Alerting     │
              │   (Consumer)   │                    │   (Consumer)   │
              └───────┬────────┘                    └───────┬────────┘
                      │ write                               │ write
                      ▼                                     ▼
              ┌────────────────┐                    ┌────────────────┐
              │  PostgreSQL    │                    │    Alerts      │
              │  (events)      │                    │    (DB)        │
              └───────┬────────┘                    └────────────────┘
                      │ read
                      ▼
              ┌────────────────┐        ┌────────────────┐
              │  API REST      │◄───────│  Dashboard     │
              │  (FastAPI)     │  fetch │  (Next.js)     │
              └────────────────┘        └────────────────┘
```

O **monitor** faz health checks periodicos nos servicos mock e publica eventos no Kafka. Dois consumers independentes processam esses eventos: o **persister** salva no PostgreSQL, e o **alerting** detecta falhas consecutivas e gera alertas. O dashboard consome a API REST e atualiza em tempo real.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | FastAPI (Python), SQLAlchemy async, aiokafka |
| Frontend | Next.js, TypeScript, Tailwind CSS, Recharts |
| Mensageria | Apache Kafka (Confluent) |
| Banco | PostgreSQL 16 |
| Containers | Docker, Docker Compose |
| Orquestracao | Kubernetes (Kustomize, HPA) |
| Cloud | AWS (EKS, RDS, S3, ECR) via Terraform |
| CI/CD | GitHub Actions |

## Rodar localmente

```bash
git clone https://github.com/seu-usuario/sentinel.git
cd sentinel
docker compose up --build -d
```

- Dashboard: http://localhost:3080
- API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

## Estrutura do projeto

```
sentinel/
├── backend/              # FastAPI — API, monitor, consumers
│   ├── app/
│   │   ├── routers/      # Endpoints REST
│   │   ├── models/       # SQLAlchemy models
│   │   ├── services/     # Monitor, producer, consumer, alerting, analysis
│   │   └── config.py     # Settings via env vars
│   ├── tests/            # pytest (13 testes)
│   └── alembic/          # Database migrations
├── frontend/             # Next.js dashboard
│   └── src/
│       ├── app/          # Pages (dashboard, service detail, alerts)
│       ├── components/   # ServiceCard, ResponseTimeChart, UptimeBar
│       └── lib/          # API client + demo data fallback
├── mock_services/        # 5 APIs simuladas com taxas de falha
├── k8s/
│   ├── base/             # Kustomize base (17 resources)
│   └── overlays/aws/     # Overlay para producao (RDS, ECR, ALB)
├── infra/                # Terraform (VPC, EKS, RDS, S3, ECR)
├── .github/workflows/    # CI/CD pipeline
└── docker-compose.yml
```

## Decisoes de arquitetura

**Por que Kafka entre o monitor e o banco?**
Desacopla deteccao de persistencia. Permite adicionar novos consumers (alertas, metricas, webhooks) sem alterar o monitor. Cada consumer tem seu proprio group ID e offset.

**Por que separar API e Worker no Kubernetes?**
O deployment `backend-api` (3 replicas, HPA) serve apenas requisicoes HTTP. O `backend-worker` (1 replica) roda o monitor loop e os consumers. Evita que 3 pods facam health checks duplicados.

**Por que o frontend funciona sem backend?**
No modo demo (Vercel), o dashboard gera dados simulados client-side. Permite que recrutadores vejam o projeto funcionando sem rodar Docker.

## API

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/services/` | Lista todos os servicos e status |
| GET | `/api/services/{name}` | Detalhes + ultimos 50 eventos |
| GET | `/api/services/{name}/events` | Historico de eventos |
| GET | `/api/services/{name}/analysis` | Analise de padroes |
| GET | `/api/alerts/` | Alertas (ativos e resolvidos) |
| GET | `/health` | Health check |

## Testes

```bash
# Rodar via Docker (sem Python local)
docker run --rm -v $(pwd)/backend:/work -w /work python:3.12-slim \
  bash -c "pip install -q -r requirements.txt && python -m pytest tests/ -v"
```

## Deploy AWS

```bash
# 1. Provisionar infra
cd infra
cp terraform.tfvars.example terraform.tfvars  # editar com suas credenciais
terraform init && terraform apply

# 2. Deploy no EKS
./k8s/deploy-aws.sh
```

---

Desenvolvido por **Kaua Santos** — [kauanki.z05@gmail.com](mailto:kauanki.z05@gmail.com)
