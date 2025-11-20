from fastapi import APIRouter, Depends, HTTPException, status
from conda.conda import Conda

router = APIRouter()

# fetch existing conda packages
@router.get("/")
def fetch_package_list():
    return Conda.list_packages()
