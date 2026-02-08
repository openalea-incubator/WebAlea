# Package Retrieval Flow - WebAlea

> Technical documentation of the data flow between the frontend and the backend for OpenAlea package management.

---

## Table of Contents

1. [Overall Architecture](#overall-architecture)
2. [Flow 1: Available Packages List (Install tab)](#flow-1-available-packages-list-install-tab)
3. [Flow 2: Visual Packages List (Packages tab)](#flow-2-visual-packages-list-packages-tab)
4. [Flow 3: Fetch Nodes for a Package](#flow-3-fetch-nodes-for-a-package)
5. [Flow 4: Package Installation](#flow-4-package-installation)
6. [File Reference](#file-reference)
7. [Data Types](#data-types)

---

## Overall Architecture

```
+-------------------------------+
| FRONTEND (React + MUI)        |
| UI -> Service -> API          |
| Panel*.jsx -> PackageService  |
| -> managerAPI.js              |
+-------------------------------+
                |
                | HTTP (REST API)
                v
+-------------------------------+
| BACKEND (FastAPI + Python)    |
| Routes -> Inspector/Utils     |
| -> Subprocess (conda, python) |
+-------------------------------+
```

---

## Flow 1: Available Packages List (Install tab)

### Description
Fetches all OpenAlea packages available on the `openalea3` conda channel with their latest version.

### Sequence

```
PanelInstallPackage.jsx
  -> useEffect() on mount
  -> PackageService.getPackagesList()
  -> managerAPI.fetchLatestPackageVersions()
  -> GET /api/v1/manager/latest
  -> manager.py: fetch_latest_package_versions()
  -> Conda.list_latest_packages()
  -> subprocess: conda search --override-channels -c openalea3 openalea* --json
  -> returns packages with latest version
```

### Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/v1/manager/latest` | List of packages with latest version |

### Data Format

**Backend response:**
```json
{
  "openalea.plantgl": {
    "version": "3.22.3",
    "build": "py312h...",
    "channel": "openalea3"
  },
  "openalea.lpy": {
    "version": "3.15.4",
    "build": "py312h..."
  }
}
```

**After normalization (PackageService):**
```javascript
[
  { name: "openalea.plantgl", version: "3.22.3" },
  { name: "openalea.lpy", version: "3.15.4" }
]
```

### Files Involved

| Layer | File | Function |
|-------|------|----------|
| UI | `PanelInstallPackage.jsx` | `useEffect()` -> fetch on mount |
| Service | `PackageService.js` | `getPackagesList()` |
| API | `managerAPI.js` | `fetchLatestPackageVersions()` |
| Route | `manager.py` | `fetch_latest_package_versions()` |
| Utils | `conda_utils.py` | `Conda.list_latest_packages()` |

---

## Flow 2: Visual Packages List (Packages tab)

### Description
Fetches only installed packages that expose visual nodes (wralea entry points).

### Sequence

```
PanelModuleNode.jsx
  -> useEffect() on mount
  -> PackageService.getVisualPackagesList()
  -> managerAPI.fetchWraleaPackages()
  -> GET /api/v1/manager/wralea
  -> manager.py: fetch_wralea_packages()
  -> OpenAleaInspector.list_wralea_packages()
  -> subprocess: python3 list_wralea_packages.py
  -> returns packages with wralea
```

### Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/v1/manager/wralea` | Packages with visual nodes |

### Data Format

**Backend response:**
```json
{
  "wralea_packages": [
    { "name": "openalea.plantgl", "module": "openalea.plantgl_wralea" },
    { "name": "openalea.lpy", "module": "openalea.lpy_wralea" }
  ]
}
```

**After normalization (PackageService):**
```javascript
[
  { name: "openalea.plantgl", module: "openalea.plantgl_wralea" },
  { name: "openalea.lpy", module: "openalea.lpy_wralea" }
]
```

### Files Involved

| Layer | File | Function |
|-------|------|----------|
| UI | `PanelModuleNode.jsx` | `useEffect()` -> fetch on mount |
| Service | `PackageService.js` | `getVisualPackagesList()` |
| API | `managerAPI.js` | `fetchWraleaPackages()` |
| Route | `manager.py` | `fetch_wralea_packages()` |
| Inspector | `openalea_inspector.py` | `list_wralea_packages()` |
| Script | `list_wralea_packages.py` | Scan wralea entry_points |

---

## Flow 3: Fetch Nodes for a Package

### Description
Fetches all nodes (NodeFactory) of a package when the user expands a package in the TreeView.

### Sequence

```
PanelModuleNode.jsx
  -> handleItemExpansionToggle() or handleItemClick()
     -> loadPackageNodes(packageId)
  -> PackageService.getNodesList({ name: packageId })
  -> Step 1: check if installed
     -> isInstalledPackage(name)
     -> fetchInstalledOpenAleaPackages()
     -> GET /api/v1/manager/installed
     -> returns boolean
  -> Step 2: if not installed, install
     -> installPackage(pkg)
     -> POST /api/v1/manager/install
  -> Step 3: fetch nodes
     -> fetchPackageNodes(name)
     -> GET /api/v1/manager/installed/{name}
     -> manager.py: fetch_package_nodes()
     -> OpenAleaInspector.describe_openalea_package()
     -> subprocess: python3 describe_openalea_package.py {name}
     -> returns package description with nodes
```

### Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/v1/manager/installed` | List installed packages |
| GET | `/api/v1/manager/installed/{name}` | Package details |
| POST | `/api/v1/manager/install` | Installation (if needed) |

### Data Format

**Backend response (`/installed/{name}`):**
```json
{
  "package_name": "openalea.plantgl",
  "has_wralea": true,
  "nodes": {
    "Sphere": {
      "description": "Create a sphere geometry",
      "inputs": [
        {
          "name": "radius",
          "interface": "IFloat",
          "optional": false,
          "desc": "Sphere radius"
        }
      ],
      "outputs": [
        {
          "name": "geometry",
          "interface": "IGeometry",
          "optional": false,
          "desc": ""
        }
      ],
      "callable": "openalea.plantgl.scenegraph.Sphere"
    },
    "Cylinder": { ... }
  }
}
```

**After normalization (PackageService):**
```javascript
[
  {
    name: "Sphere",
    description: "Create a sphere geometry",
    inputs: [
      { name: "radius", interface: "IFloat", optional: false, desc: "Sphere radius" }
    ],
    outputs: [
      { name: "geometry", interface: "IGeometry", optional: false, desc: "" }
    ],
    callable: "openalea.plantgl.scenegraph.Sphere"
  }
]
```

### Files Involved

| Layer | File | Function |
|-------|------|----------|
| UI | `PanelModuleNode.jsx` | `loadPackageNodes()` |
| Service | `PackageService.js` | `getNodesList()`, `isInstalledPackage()` |
| API | `managerAPI.js` | `fetchPackageNodes()`, `fetchInstalledOpenAleaPackages()` |
| Route | `manager.py` | `fetch_package_nodes()` |
| Inspector | `openalea_inspector.py` | `describe_openalea_package()` |
| Script | `describe_openalea_package.py` | OpenAlea introspection |

---

## Flow 4: Package Installation

### Description
Installs a conda package into the OpenAlea environment.

### Sequence

```
PanelInstallPackage.jsx
  -> handleInstall(pkg) on button click
  -> PackageService.installPackage({ name: pkg.name })
  -> managerAPI.installPackages([{ name, version }], envName)
  -> POST /api/v1/manager/install
  -> Body: { packages: [...], env_name: null }
  -> manager.py: install_packages_in_env(request)
  -> Conda.install_package_list(env_name, package_list)
  -> For each package:
     subprocess: conda install -n {env} -c openalea3 -c conda-forge {pkg} -y
  -> returns { installed: [...], failed: [...] }
```

### Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/v1/manager/install` | Package installation |

### Data Format

**Frontend request:**
```json
{
  "packages": [
    { "name": "openalea.plantgl", "version": null }
  ],
  "env_name": null
}
```

> Note: `version: null` lets conda resolve a compatible version automatically.

**Backend response (success):**
```json
{
  "installed": ["openalea.plantgl"],
  "failed": []
}
```

**Backend response (failure):**
```json
{
  "installed": [],
  "failed": [
    {
      "package": "openalea.plantgl",
      "error": "Conda install failed for openalea.plantgl (exit code 1)"
    }
  ]
}
```

**After normalization (PackageService):**
```javascript
{
  success: true,  // or false
  installed: ["openalea.plantgl"],
  failed: [{ package: "...", error: "..." }]
}
```

### Files Involved

| Layer | File | Function |
|-------|------|----------|
| UI | `PanelInstallPackage.jsx` | `handleInstall()` |
| Service | `PackageService.js` | `installPackage()` |
| API | `managerAPI.js` | `installPackages()` |
| Route | `manager.py` | `install_packages_in_env()` |
| Utils | `conda_utils.py` | `Conda.install_package_list()`, `Conda.install_package()` |

---

## File Reference

### Frontend (`webAleaFront/src/`)

#### UI Components
| File | Role |
|------|------|
| `features/package-manager/ui/PackageManager.jsx` | Main container with tabs |
| `features/package-manager/ui/type/PanelModuleNode.jsx` | TreeView of visual packages |
| `features/package-manager/ui/type/PanelInstallPackage.jsx` | Installation list |
| `features/package-manager/ui/type/PanelPrimitiveNode.jsx` | Primitive nodes (Float, String, Boolean) |

#### Service Layer
| File | Exported functions |
|------|-------------------|
| `service/PackageService.js` | `getPackagesList()`, `getVisualPackagesList()`, `getNodesList()`, `installPackage()`, `isInstalledPackage()`, `getInstalledPackagesList()` |

#### API Layer
| File | Exported functions |
|------|-------------------|
| `api/managerAPI.js` | `fetchLatestPackageVersions()`, `fetchWraleaPackages()`, `fetchPackageNodes()`, `fetchInstalledOpenAleaPackages()`, `installPackages()` |

### Backend (`webAleaBack/`)

#### API Routes
| File | Routes |
|------|--------|
| `api/v1/endpoints/manager.py` | `GET /`, `GET /latest`, `POST /install`, `GET /installed`, `GET /wralea`, `GET /installed/{name}` |

#### Utils and Services
| File | Classes/Methods |
|------|-----------------|
| `model/utils/conda_utils.py` | `Conda.list_packages()`, `Conda.list_latest_packages()`, `Conda.install_package()`, `Conda.install_package_list()` |
| `model/openalea/inspector/openalea_inspector.py` | `OpenAleaInspector.list_installed_openalea_packages()`, `OpenAleaInspector.list_wralea_packages()`, `OpenAleaInspector.describe_openalea_package()` |

#### Python Scripts (subprocess)
| File | Role |
|------|------|
| `model/openalea/inspector/runnable/list_installed_openalea_packages.py` | Lists installed OpenAlea packages |
| `model/openalea/inspector/runnable/list_wralea_packages.py` | Lists packages with wralea entry_points |
| `model/openalea/inspector/runnable/describe_openalea_package.py` | Describes NodeFactory objects in a package |

---

## Data Types

### Frontend (JSDoc)

```typescript
// Package available for installation
interface Package {
  name: string;      // e.g. "openalea.plantgl"
  version: string;   // e.g. "3.22.3"
}

// Package with visual nodes
interface VisualPackage {
  name: string;      // e.g. "openalea.plantgl"
  module: string;    // e.g. "openalea.plantgl_wralea"
}

// Node port (input or output)
interface NodePort {
  name: string;      // e.g. "radius"
  interface: string; // e.g. "IFloat", "IStr", "None"
  optional: boolean;
  desc: string;
}

// Node in a package
interface PackageNode {
  name: string;            // e.g. "Sphere"
  description: string;
  inputs: NodePort[];
  outputs: NodePort[];
  callable: string | null; // e.g. "openalea.plantgl.scenegraph.Sphere"
}

// Installation result
interface InstallResult {
  success: boolean;
  installed: string[];
  failed: Array<{ package: string; error: string }>;
}
```

### Backend (Pydantic)

```python
class PackageSpec(BaseModel):
    name: str
    version: Optional[str] = None

class InstallRequest(BaseModel):
    packages: List[PackageSpec]
    env_name: Optional[str] = None
```

---

## Global Sequence Diagram

```
UI Component -> PackageService -> managerAPI -> manager route -> OpenAleaInspector -> Conda

Examples:
- list latest packages: PackageService.getPackagesList() -> ... -> Conda.list_latest_packages()
- fetch nodes: PackageService.getNodesList() -> ... -> OpenAleaInspector.describe_openalea_package()
```

---

*Document generated on 2025-12-29 - WebAlea v1.0*
