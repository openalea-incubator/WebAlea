from fastapi import APIRouter, Depends, HTTPException, status

router = APIRouter()

# hello world
@router.get("/")
def read_root():
    return {"message": "Hello, World!"}
