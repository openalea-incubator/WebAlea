# WebAlea - BackEnd
**This is the specidfied documentation for the back end**
## start the project
you can run
```bash
../webalea.sh start
```
## Conda environment
A conda environment is deployed in webAleaBack.
It is used to retrieve conda packages and execute them.
Every entrypoints regarding the use of conda is available in the conda package.
### test environment
A test environment is in the project.
In order to pass the pytest the following steps are required : 
```bash
cd webAleaBack
```
```bash
conda env create - tests/environment.yml
```
```bash
conda activate test_env
```
## Best practices
### API versionning
If significant changes are made, it is best to increment the API version.
ex : 
/api/v1/endpoints -> /api/v2/endpoints
### routing
Api routes are defined as following :  
  
**In the endpoint definition :**
The route is defined inside of an annotation, it will represent the final keyword.
*Example :*
```python
router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "Hello, World!"}
```
**In the router.py file**
Each endpoint router is imported, then the path prefix is added with a specification.
*Example:*
```python
router = APIRouter()

# Include the items router
router.include_router(
        helloWorld.router, prefix=f"{settings.API_V1_STR}/hello", tags=["hello"],
    )
```
**in core/config.py file**
You can find the prefix path constant.

**in the main.py file**
The main.py creates a global router and includes others.
### configs
Configs are made and accessed from the core.config file or from a .env file.