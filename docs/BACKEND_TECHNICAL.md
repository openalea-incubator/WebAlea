# Backend Technical Documentation

This document describes the backend architecture, runtime flow, and API surface for the WebAlea backend service.

## Overview
- Framework: FastAPI
- Entry point: `webAleaBack/main.py`
- API base path: `/api/v1` (from `core.config.Settings.API_V1_STR`)
- Domain focus: OpenAlea package inspection and node execution, plus Conda package management

## Project Structure (Backend)
- `webAleaBack/main.py` : FastAPI application, CORS, router inclusion, root endpoint
- `webAleaBack/core/config.py` : Settings + logging configuration
- `webAleaBack/api/v1/router.py` : v1 router, endpoint group registration
- `webAleaBack/api/v1/endpoints/` : REST endpoints
- `webAleaBack/model/` : OpenAlea execution and inspection logic, Conda utilities
- `webAleaBack/tests/` : API and integration tests

## Application Lifecycle
`main.py` defines a FastAPI lifespan context:
- Startup: prints `Application '<PROJECT_NAME>' starting up...`
- Shutdown: prints `Application '<PROJECT_NAME>' shutting down...` and sets `app.state.shutdown_message`

## Configuration
`core/config.py` defines a `Settings` class powered by `pydantic_settings`.

Key settings:
- `PROJECT_NAME` : FastAPI title
- `API_V1_STR` : API prefix (default `/api/v1`)
- `CONDA_ENV_NAME` : default Conda environment name
- `OPENALEA_CHANNEL` : default Conda channel for OpenAlea packages
- `LOG_*` : logging configuration

Logging:
- Console logging enabled by default
- Optional file logging via `LOG_FILE` (default `logs/app.log`)

## API Routing
`api/v1/router.py` registers three routers:
- `manager` -> `/api/v1/manager`
- `runner` -> `/api/v1/runner`
- `inspector` -> `/api/v1/inspector`

Root endpoint:
- `GET /` returns a welcome message and a map of available routes.

## API Endpoints

### Manager Endpoints (`/api/v1/manager`)
Handles Conda package management.

- `GET /latest`
  - Returns the latest versions of OpenAlea packages from the configured channel.
  - Backend flow: `Conda.list_latest_packages()`

- `POST /install`
  - Installs packages into a Conda environment.
  - Request body:
    ```json
    {
      "packages": [{"name": "pkg1", "version": "1.2.3"}, {"name": "pkg2"}],
      "env_name": "webalea_env"
    }
    ```
  - Notes:
    - `env_name` is optional; defaults to `CONDA_ENV_NAME`.
    - Each package is installed via `conda install`.

### Inspector Endpoints (`/api/v1/inspector`)
Inspects OpenAlea packages and visual nodes.

- `GET /installed`
  - Returns all installed OpenAlea packages in the current environment.
  - Backend flow: `OpenAleaInspector.list_installed_openalea_packages()`

- `GET /wralea`
  - Returns installed packages that expose visual nodes (wralea entry points).
  - Backend flow: `OpenAleaInspector.list_wralea_packages()`

- `GET /installed/{package_name}`
  - Returns node descriptions for a specific package.
  - Errors:
    - `404` if package not found
    - `500` for unexpected errors

### Runner Endpoints (`/api/v1/runner`)
Executes OpenAlea nodes.

- `POST /execute`
  - Executes a single OpenAlea node.
  - Request body:
    ```json
    {
      "node_id": "node_1",
      "package_name": "openalea.core",
      "node_name": "addition",
      "inputs": [
        {"id": "in_0", "name": "a", "type": "float", "value": 5},
        {"id": "in_1", "name": "b", "type": "float", "value": 3}
      ]
    }
    ```
  - Response body (example):
    ```json
    {
      "success": true,
      "node_id": "node_1",
      "outputs": [
        {"index": 0, "name": "result", "value": 8, "type": "float"}
      ],
      "error": null
    }
    ```

## Execution Flow: Node Runner
`OpenAleaRunner.execute_node(...)` launches a subprocess:
- Command: `python3 model/openalea/runner/runnable/run_workflow.py <node_info_json>`
- The subprocess loads OpenAlea, instantiates the requested node, injects inputs, evaluates, and returns JSON.

`run_workflow.py` behavior:
1. Initializes `PackageManager` and loads the package.
2. Instantiates the node factory.
3. Applies inputs by name or index.
4. Runs `node.eval()`.
5. Serializes outputs to JSON.

## OpenAlea Inspection
`OpenAleaInspector` uses subprocesses to query installed packages and nodes:
- `list_installed_openalea_packages.py`
- `list_wralea_packages.py`
- `describe_openalea_package.py`

It expects JSON output, with a fallback to `ast.literal_eval` for legacy formats.

## Conda Integration
`model/utils/conda_utils.py` provides:
- `list_packages(channel)`
- `list_latest_packages(channel)`
- `install_package(package_name, version, env_name)`
- `install_package_list(env_name, package_list)`

Package installation:
- Uses `conda install -n <env> -c openalea3 -c conda-forge <pkg> -y`

## Tests
Location: `webAleaBack/tests`
- API-level tests in `tests/api/v1`
- Integration tests in `tests/integration`
- Test resources in `tests/resources`

## Known Assumptions
- The backend expects a Conda environment with OpenAlea packages installed.
- `python3` is available and can import OpenAlea packages from the active environment.
- Subprocess-based execution is used to isolate OpenAlea node execution.

