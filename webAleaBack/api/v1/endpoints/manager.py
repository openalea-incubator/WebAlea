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

@router.post("/install")
def install_package_in_env(package_name: str, version: str = None, env_name: str = None):
    """install a package from a specific environment, in a specific version

    Args:
        package_name (str): the package name to install
        version (str, optional): the version of the package to install. Defaults to None.
        env_name (str, optional): the name of the conda environment. Defaults to settings.CONDA_ENV_NAME.

    Raises:
        HTTPException: If installation fails.

    Returns:
        dict: A message indicating the result of the installation.
    """
    try:
        Conda.install_package(package_name, version, env_name)
        env_name = env_name or "deafault environment"
        return {"message": f"Package {package_name} installed successfully in environment : {env_name}."}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )