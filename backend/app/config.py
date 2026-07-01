from decouple import config


class Settings:
    debug: bool = config('DEBUG', default=False, cast=bool)
    node_env: str = config('NODE_ENV', default='development')

    # Database
    postgres_db: str = config('POSTGRES_DB', default='vaultdocs')
    postgres_user: str = config('POSTGRES_USER', default='vaultdocs')
    postgres_password: str = config('POSTGRES_PASSWORD', default='password')
    postgres_host: str = config('POSTGRES_HOST', default='localhost')
    postgres_port: str = config('POSTGRES_PORT', default='5432')

    @property
    def database_url(self) -> str:
        # DATABASE_URL 환경변수로 직접 지정 가능 (테스트/SQLite 용도)
        import os
        override = os.environ.get('DATABASE_URL')
        if override:
            return override
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def database_url_sync(self) -> str:
        # Alembic needs a sync URL
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # JWT
    jwt_secret: str = config('JWT_SECRET', default='dev-secret')
    jwt_refresh_secret: str = config('JWT_REFRESH_SECRET', default='dev-refresh-secret')
    jwt_algorithm: str = 'HS256'
    jwt_access_expire_minutes: int = 15
    jwt_refresh_expire_days: int = 7

    # Google OAuth
    google_client_id: str = config('GOOGLE_CLIENT_ID', default='')
    google_client_secret: str = config('GOOGLE_CLIENT_SECRET', default='')
    google_callback_url: str = config(
        'GOOGLE_CALLBACK_URL',
        default='http://localhost:4000/api/auth/google/callback',
    )

    # MinIO
    minio_endpoint: str = config('MINIO_ENDPOINT', default='localhost')
    minio_port: str = config('MINIO_PORT', default='9000')
    minio_use_ssl: bool = config('MINIO_USE_SSL', default='false').lower() == 'true'
    minio_access_key: str = config('MINIO_ACCESS_KEY', default='vaultdocs')
    minio_secret_key: str = config('MINIO_SECRET_KEY', default='password')
    minio_bucket: str = config('MINIO_BUCKET', default='vaultdocs')

    @property
    def minio_endpoint_url(self) -> str:
        scheme = 'https' if self.minio_use_ssl else 'http'
        return f"{scheme}://{self.minio_endpoint}:{self.minio_port}"

    # Frontend
    frontend_url: str = config('FRONTEND_URL', default='http://localhost:3000')
    cors_origins: list[str] = config(
        'CORS_ALLOWED_ORIGINS',
        default='http://localhost:3000',
    ).split(',')

    # Anthropic
    anthropic_api_key: str = config('ANTHROPIC_API_KEY', default='')

    # Celery / Redis
    celery_broker_url: str = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
    celery_result_backend: str = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')


settings = Settings()
