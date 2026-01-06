# Flux de Récupération de Packages - WebAlea

> Documentation technique du flux de données entre le Frontend et le Backend pour la gestion des packages OpenAlea.

---

## Table des matières

1. [Architecture Générale](#architecture-générale)
2. [Flux 1 : Liste des Packages Disponibles](#flux-1--liste-des-packages-disponibles-onglet-install)
3. [Flux 2 : Liste des Packages Visuels](#flux-2--liste-des-packages-visuels-onglet-packages)
4. [Flux 3 : Récupération des Nodes](#flux-3--récupération-des-nodes-dun-package)
5. [Flux 4 : Installation d'un Package](#flux-4--installation-dun-package)
6. [Référence des Fichiers](#référence-des-fichiers)
7. [Types de Données](#types-de-données)

---

## Architecture Générale

```
┌─────────────────────────────────────────────────────────────────┐
│                          FRONTEND                               │
│  (React + MUI)                                                  │
├─────────────────────────────────────────────────────────────────┤
│  UI Components    →    Service Layer    →    API Layer          │
│  (PanelXXX.jsx)        (PackageService.js)   (managerAPI.js)    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (REST API)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                │
│  (FastAPI + Python)                                             │
├─────────────────────────────────────────────────────────────────┤
│  API Routes       →    Inspector/Utils   →    Subprocess        │
│  (manager.py)          (OpenAleaInspector)    (conda, python3)  │
│                        (Conda)                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Flux 1 : Liste des Packages Disponibles (Onglet Install)

### Description
Récupère tous les packages OpenAlea disponibles sur le canal conda `openalea3` avec leur dernière version.

### Séquence

```
PanelInstallPackage.jsx
        │
        │ useEffect() au montage
        ▼
PackageService.getPackagesList()
        │
        ▼
managerAPI.fetchLatestPackageVersions()
        │
        │ GET /api/v1/manager/latest
        ▼
manager.py: fetch_latest_package_versions()
        │
        ▼
Conda.list_latest_packages()
        │
        │ subprocess: conda search --override-channels -c openalea3 openalea* --json
        ▼
Retourne les packages avec leur dernière version
```

### Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/v1/manager/latest` | Liste des packages avec dernière version |

### Format des Données

**Réponse Backend :**
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

**Après normalisation (PackageService) :**
```javascript
[
  { name: "openalea.plantgl", version: "3.22.3" },
  { name: "openalea.lpy", version: "3.15.4" }
]
```

### Fichiers Impliqués

| Couche | Fichier | Fonction |
|--------|---------|----------|
| UI | `PanelInstallPackage.jsx` | `useEffect()` → fetch au montage |
| Service | `PackageService.js` | `getPackagesList()` |
| API | `managerAPI.js` | `fetchLatestPackageVersions()` |
| Route | `manager.py` | `fetch_latest_package_versions()` |
| Utils | `conda_utils.py` | `Conda.list_latest_packages()` |

---

## Flux 2 : Liste des Packages Visuels (Onglet Packages)

### Description
Récupère uniquement les packages installés qui possèdent des nodes visuels (entry points `wralea`).

### Séquence

```
PanelModuleNode.jsx
        │
        │ useEffect() au montage
        ▼
PackageService.getVisualPackagesList()
        │
        ▼
managerAPI.fetchWraleaPackages()
        │
        │ GET /api/v1/manager/wralea
        ▼
manager.py: fetch_wralea_packages()
        │
        ▼
OpenAleaInspector.list_wralea_packages()
        │
        │ subprocess: python3 list_wralea_packages.py
        │ (scanne les entry_points "wralea")
        ▼
Retourne les packages avec wralea
```

### Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/v1/manager/wralea` | Packages avec nodes visuels |

### Format des Données

**Réponse Backend :**
```json
{
  "wralea_packages": [
    { "name": "openalea.plantgl", "module": "openalea.plantgl_wralea" },
    { "name": "openalea.lpy", "module": "openalea.lpy_wralea" }
  ]
}
```

**Après normalisation (PackageService) :**
```javascript
[
  { name: "openalea.plantgl", module: "openalea.plantgl_wralea" },
  { name: "openalea.lpy", module: "openalea.lpy_wralea" }
]
```

### Fichiers Impliqués

| Couche | Fichier | Fonction |
|--------|---------|----------|
| UI | `PanelModuleNode.jsx` | `useEffect()` → fetch au montage |
| Service | `PackageService.js` | `getVisualPackagesList()` |
| API | `managerAPI.js` | `fetchWraleaPackages()` |
| Route | `manager.py` | `fetch_wralea_packages()` |
| Inspector | `openalea_inspector.py` | `list_wralea_packages()` |
| Script | `list_wralea_packages.py` | Scan des entry_points |

---

## Flux 3 : Récupération des Nodes d'un Package

### Description
Récupère tous les nodes (NodeFactory) d'un package quand l'utilisateur expand un package dans le TreeView.

### Séquence

```
PanelModuleNode.jsx
        │
        │ handleItemExpansionToggle() ou handleItemClick()
        │     └─ loadPackageNodes(packageId)
        ▼
PackageService.getNodesList({ name: packageId })
        │
        ├─── 1. Vérifie si installé ───────────────────┐
        │    isInstalledPackage(name)                  │
        │         │                                    │
        │         ▼                                    │
        │    fetchInstalledOpenAleaPackages()          │
        │         │ GET /api/v1/manager/installed      │
        │         ▼                                    │
        │    Retourne boolean                          │
        │                                              │
        ├─── 2. Si non installé, installe ─────────────┤
        │    installPackage(pkg)                       │
        │         │ POST /api/v1/manager/install       │
        │                                              │
        └─── 3. Récupère les nodes ────────────────────┘
             fetchPackageNodes(name)
                  │
                  │ GET /api/v1/manager/installed/{name}
                  ▼
             manager.py: fetch_package_nodes()
                  │
                  ▼
             OpenAleaInspector.describe_openalea_package()
                  │
                  │ subprocess: python3 describe_openalea_package.py {name}
                  ▼
             Retourne la description du package avec ses nodes
```

### Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/v1/manager/installed` | Liste packages installés |
| GET | `/api/v1/manager/installed/{name}` | Détail d'un package |
| POST | `/api/v1/manager/install` | Installation (si nécessaire) |

### Format des Données

**Réponse Backend (`/installed/{name}`) :**
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

**Après normalisation (PackageService) :**
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

### Fichiers Impliqués

| Couche | Fichier | Fonction |
|--------|---------|----------|
| UI | `PanelModuleNode.jsx` | `loadPackageNodes()` |
| Service | `PackageService.js` | `getNodesList()`, `isInstalledPackage()` |
| API | `managerAPI.js` | `fetchPackageNodes()`, `fetchInstalledOpenAleaPackages()` |
| Route | `manager.py` | `fetch_package_nodes()` |
| Inspector | `openalea_inspector.py` | `describe_openalea_package()` |
| Script | `describe_openalea_package.py` | Introspection OpenAlea |

---

## Flux 4 : Installation d'un Package

### Description
Installe un package conda dans l'environnement OpenAlea.

### Séquence

```
PanelInstallPackage.jsx
        │
        │ handleInstall(pkg) → onClick bouton
        ▼
PackageService.installPackage({ name: pkg.name })
        │
        ▼
managerAPI.installPackages([{ name, version }], envName)
        │
        │ POST /api/v1/manager/install
        │ Body: { packages: [...], env_name: null }
        ▼
manager.py: install_packages_in_env(request)
        │
        ▼
Conda.install_package_list(env_name, package_list)
        │
        │ Pour chaque package:
        │ subprocess: conda install -n {env} -c openalea3 -c conda-forge {pkg} -y
        ▼
Retourne { installed: [...], failed: [...] }
```

### Endpoints

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/v1/manager/install` | Installation de packages |

### Format des Données

**Requête Frontend :**
```json
{
  "packages": [
    { "name": "openalea.plantgl", "version": null }
  ],
  "env_name": null
}
```

> **Note:** `version: null` permet à conda de résoudre automatiquement une version compatible avec Python.

**Réponse Backend (succès) :**
```json
{
  "installed": ["openalea.plantgl"],
  "failed": []
}
```

**Réponse Backend (échec) :**
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

**Après normalisation (PackageService) :**
```javascript
{
  success: true,  // ou false
  installed: ["openalea.plantgl"],
  failed: [{ package: "...", error: "..." }]
}
```

### Fichiers Impliqués

| Couche | Fichier | Fonction |
|--------|---------|----------|
| UI | `PanelInstallPackage.jsx` | `handleInstall()` |
| Service | `PackageService.js` | `installPackage()` |
| API | `managerAPI.js` | `installPackages()` |
| Route | `manager.py` | `install_packages_in_env()` |
| Utils | `conda_utils.py` | `Conda.install_package_list()`, `Conda.install_package()` |

---

## Référence des Fichiers

### Frontend (`webAleaFront/src/`)

#### UI Components
| Fichier | Rôle |
|---------|------|
| `features/package-manager/ui/PackageManager.jsx` | Container principal avec tabs |
| `features/package-manager/ui/type/PanelModuleNode.jsx` | TreeView des packages visuels |
| `features/package-manager/ui/type/PanelInstallPackage.jsx` | Liste d'installation |
| `features/package-manager/ui/type/PanelPrimitiveNode.jsx` | Nodes primitifs (Float, String, Boolean) |

#### Service Layer
| Fichier | Fonctions exportées |
|---------|---------------------|
| `service/PackageService.js` | `getPackagesList()`, `getVisualPackagesList()`, `getNodesList()`, `installPackage()`, `isInstalledPackage()`, `getInstalledPackagesList()` |

#### API Layer
| Fichier | Fonctions exportées |
|---------|---------------------|
| `api/managerAPI.js` | `fetchLatestPackageVersions()`, `fetchWraleaPackages()`, `fetchPackageNodes()`, `fetchInstalledOpenAleaPackages()`, `installPackages()` |

### Backend (`webAleaBack/`)

#### API Routes
| Fichier | Routes |
|---------|--------|
| `api/v1/endpoints/manager.py` | `GET /`, `GET /latest`, `POST /install`, `GET /installed`, `GET /wralea`, `GET /installed/{name}` |

#### Utils & Services
| Fichier | Classe/Méthodes |
|---------|-----------------|
| `model/utils/conda_utils.py` | `Conda.list_packages()`, `Conda.list_latest_packages()`, `Conda.install_package()`, `Conda.install_package_list()` |
| `model/openalea/inspector/openalea_inspector.py` | `OpenAleaInspector.list_installed_openalea_packages()`, `OpenAleaInspector.list_wralea_packages()`, `OpenAleaInspector.describe_openalea_package()` |

#### Scripts Python (subprocess)
| Fichier | Rôle |
|---------|------|
| `model/openalea/inspector/runnable/list_installed_openalea_packages.py` | Liste les packages OpenAlea installés |
| `model/openalea/inspector/runnable/list_wralea_packages.py` | Liste les packages avec entry_points wralea |
| `model/openalea/inspector/runnable/describe_openalea_package.py` | Décrit les NodeFactory d'un package |

---

## Types de Données

### Frontend (JSDoc)

```typescript
// Package disponible pour installation
interface Package {
  name: string;      // ex: "openalea.plantgl"
  version: string;   // ex: "3.22.3"
}

// Package avec nodes visuels
interface VisualPackage {
  name: string;      // ex: "openalea.plantgl"
  module: string;    // ex: "openalea.plantgl_wralea"
}

// Port d'un node (input ou output)
interface NodePort {
  name: string;      // ex: "radius"
  interface: string; // ex: "IFloat", "IStr", "None"
  optional: boolean;
  desc: string;
}

// Node d'un package
interface PackageNode {
  name: string;           // ex: "Sphere"
  description: string;
  inputs: NodePort[];
  outputs: NodePort[];
  callable: string | null; // ex: "openalea.plantgl.scenegraph.Sphere"
}

// Résultat d'installation
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

## Diagramme de Séquence Global

```
┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────┐     ┌─────────────────┐     ┌───────┐
│    UI    │     │PackageService│     │ managerAPI│     │ manager  │     │OpenAleaInspector│     │ Conda │
│Component │     │              │     │           │     │  (route) │     │                 │     │       │
└────┬─────┘     └──────┬───────┘     └─────┬─────┘     └────┬─────┘     └────────┬────────┘     └───┬───┘
     │                  │                   │                │                    │                  │
     │ getPackagesList()│                   │                │                    │                  │
     │─────────────────>│                   │                │                    │                  │
     │                  │ fetchLatest()     │                │                    │                  │
     │                  │──────────────────>│                │                    │                  │
     │                  │                   │ GET /latest    │                    │                  │
     │                  │                   │───────────────>│                    │                  │
     │                  │                   │                │ list_latest()      │                  │
     │                  │                   │                │───────────────────────────────────────>│
     │                  │                   │                │                    │  conda search    │
     │                  │                   │                │<───────────────────────────────────────│
     │                  │                   │<───────────────│                    │                  │
     │                  │<──────────────────│                │                    │                  │
     │<─────────────────│                   │                │                    │                  │
     │                  │                   │                │                    │                  │
     │ getNodesList()   │                   │                │                    │                  │
     │─────────────────>│                   │                │                    │                  │
     │                  │ fetchNodes()      │                │                    │                  │
     │                  │──────────────────>│                │                    │                  │
     │                  │                   │GET /installed/X│                    │                  │
     │                  │                   │───────────────>│                    │                  │
     │                  │                   │                │ describe_package() │                  │
     │                  │                   │                │───────────────────>│                  │
     │                  │                   │                │                    │ python3 script   │
     │                  │                   │                │<───────────────────│                  │
     │                  │                   │<───────────────│                    │                  │
     │                  │<──────────────────│                │                    │                  │
     │<─────────────────│                   │                │                    │                  │
     │                  │                   │                │                    │                  │
```

---

*Document généré le 29/12/2025 - WebAlea v1.0*
