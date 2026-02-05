# WebAlea Backend

This README describes the backend package for WebAlea.

## Start The Project
Please refer to the top-level `README.md` for setup and run instructions.

## Best Practices

### API Versioning
When significant changes are introduced, increment the API version.

Example:
- `/api/v1/endpoints` -> `/api/v2/endpoints`

### Routing
Routes are defined in three places:

In the endpoint definition:
Each endpoint defines its final path segment using a decorator.

Example:
```python
router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "Hello, World!"}
```

In `api/v1/router.py`:
Each endpoint router is imported and included with a prefix and tags.

Example:
```python
router = APIRouter()

router.include_router(
    helloWorld.router,
    prefix=f"{settings.API_V1_STR}/hello",
    tags=["hello"],
)
```

In `core/config.py`:
The base API prefix is defined as a constant (`API_V1_STR`).

In `main.py`:
The FastAPI app includes the versioned router.

### Configuration
Configuration values are defined in `core/config.py` and can be overridden via a `.env` file.
