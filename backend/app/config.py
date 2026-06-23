from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://monitor:monitor@db:5432/monitor"
    mock_services_url: str = "http://mock-services:8001"
    check_interval_seconds: int = 30

    model_config = {"env_prefix": "MONITOR_"}


settings = Settings()
