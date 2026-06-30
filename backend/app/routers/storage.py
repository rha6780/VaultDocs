from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.deps import get_current_user
from app.models.user import User
from app.services.storage import get_presigned_upload_url, get_presigned_download_url

router = APIRouter()


class PresignRequest(BaseModel):
    key: str


class PresignResponse(BaseModel):
    url: str
    key: str


@router.post('/presign/upload', response_model=PresignResponse)
async def presign_upload(body: PresignRequest, _: User = Depends(get_current_user)):
    url = get_presigned_upload_url(body.key)
    return PresignResponse(url=url, key=body.key)


@router.post('/presign/download', response_model=PresignResponse)
async def presign_download(body: PresignRequest, _: User = Depends(get_current_user)):
    url = get_presigned_download_url(body.key)
    return PresignResponse(url=url, key=body.key)
