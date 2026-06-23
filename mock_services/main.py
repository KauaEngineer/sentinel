import random
from fastapi import FastAPI, Response

app = FastAPI(title="Mock Services")

SERVICES = {
    "payment-api": {"fail_rate": 0.15},
    "user-service": {"fail_rate": 0.05},
    "inventory-api": {"fail_rate": 0.10},
    "notification-service": {"fail_rate": 0.20},
    "auth-service": {"fail_rate": 0.03},
}


@app.get("/health/{service_name}")
def health_check(service_name: str, response: Response):
    service = SERVICES.get(service_name)
    if not service:
        response.status_code = 404
        return {"error": f"Service '{service_name}' not found"}

    if random.random() < service["fail_rate"]:
        response.status_code = 503
        return {
            "service": service_name,
            "status": "unhealthy",
            "message": "Service temporarily unavailable",
        }

    return {"service": service_name, "status": "healthy"}


@app.get("/services")
def list_services():
    return {"services": list(SERVICES.keys())}
