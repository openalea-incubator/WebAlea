# Package Manager Panels

This folder contains the UI panels used by the Package Manager sidebar:

- `PanelModuleNode.jsx`: list and browse installed visual packages and their nodes.
- `PanelPrimitiveNode.jsx`: primitive nodes (float, string, boolean, enum).
- `PanelInstallPackage.jsx`: install new packages from the backend.

`PanelModuleNode` and `PanelInstallPackage` share similar UI patterns (lists, loading states).
If you refactor, consider extracting shared components to avoid duplication.
