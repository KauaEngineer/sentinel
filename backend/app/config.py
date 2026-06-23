from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://monitor:monitor@db:5432/monitor"
    mock_services_url: str = "http://mock-services:8001"
    check_interval_seconds: int = 30
    kafka_bootstrap_servers: str = "kafka:29092"
    kafka_topic_events: str = "service-events"
    enable_monitor: bool = True
    enable_consumer: bool = True

    model_config = {"env_prefix": "MONITOR_"}


settings = Settings()
