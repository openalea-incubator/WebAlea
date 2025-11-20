from fastapi import APIRouter, Depends, HTTPException, status
from conda.conda import Conda

router = APIRouter()

@router.get("/")
def fetch_package_list():
    """Fetch the list of all conda packages."""
    return Conda.list_packages()

@router.get("/latest")
def fetch_latest_package_versions():
    """Fetch the latest versions of all conda packages."""
    return Conda.list_latest_packages()
