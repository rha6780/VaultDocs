import boto3
from botocore.client import Config
from app.config import settings


def _s3_client():
    return boto3.client(
        's3',
        endpoint_url=settings.minio_endpoint_url,
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
        config=Config(signature_version='s3v4'),
        region_name='us-east-1',
    )


def get_presigned_upload_url(key: str, expires: int = 900) -> str:
    return _s3_client().generate_presigned_url(
        'put_object',
        Params={'Bucket': settings.minio_bucket, 'Key': key},
        ExpiresIn=expires,
    )


def get_presigned_download_url(key: str, expires: int = 900) -> str:
    return _s3_client().generate_presigned_url(
        'get_object',
        Params={'Bucket': settings.minio_bucket, 'Key': key},
        ExpiresIn=expires,
    )
