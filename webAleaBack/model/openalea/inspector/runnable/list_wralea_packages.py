"""
This module lists OpenAlea packages that have visual nodes (wralea entry points).

Only installed packages can be checked for wralea entry points.
"""

import json
import sys
import logging
from importlib.metadata import entry_points
from typing import Dict, List, Optional

from openalea.core.pkgmanager import PackageManager


def _unique(values: List[str]) -> List[str]:
    """Return values without duplicates while preserving order."""
    seen = set()
    out = []
    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        out.append(value)
    return out


def _normalize_package_name(candidate: str, available_keys: set[str]) -> Optional[str]:
    """Normalize a candidate package name against PackageManager keys."""
    if not candidate:
        return None

    if candidate in available_keys:
        return candidate

    if candidate.startswith("openalea."):
        short_name = candidate[len("openalea."):]
        if short_name in available_keys:
            return short_name
    else:
        prefixed = f"openalea.{candidate}"
        if prefixed in available_keys:
            return prefixed

    return None


def _build_name_candidates(entry_name: str, module_path: str, dist_name: Optional[str]) -> List[str]:
    """Build likely package names from wralea metadata."""
    candidates = []

    if entry_name:
        candidates.append(entry_name)
        candidates.append(entry_name.replace("-", "."))
        if not entry_name.startswith("openalea."):
            candidates.append(f"openalea.{entry_name}")
            candidates.append(f"openalea.{entry_name.replace('-', '.')}")

    if module_path:
        module_base = module_path.split(":", 1)[0].strip()
        if module_base:
            candidates.append(module_base)
            if module_base.endswith("_wralea"):
                candidates.append(module_base[:-7])
            parts = module_base.split(".")
            if len(parts) >= 2 and parts[0] == "openalea":
                candidates.append(".".join(parts[:2]))

    if dist_name:
        candidates.append(dist_name)
        candidates.append(dist_name.replace("-", "."))

    return _unique(candidates)


def list_wralea_packages() -> list:
    """Lists all installed packages that have wralea entry points (visual nodes).

    Returns:
        list: A list of dicts with wralea metadata and normalized names.
    """
    wralea_packages: List[Dict[str, Optional[str]]] = []

    try:
        pm = PackageManager()
        pm.init()
        available_keys = set(pm.keys())

        # Get all entry points in the "wralea" group
        eps = entry_points(group="wralea")
        seen_package_names = set()

        for ep in eps:
            entry_name = ep.name
            module_path = ep.value
            dist_name = getattr(getattr(ep, "dist", None), "name", None)

            package_name = None
            for candidate in _build_name_candidates(entry_name, module_path, dist_name):
                normalized = _normalize_package_name(candidate, available_keys)
                if normalized is not None:
                    package_name = normalized
                    break

            if package_name is None:
                package_name = entry_name

            # Avoid duplicate package rows when multiple wralea entry points target same package
            if package_name in seen_package_names:
                continue
            seen_package_names.add(package_name)

            install_name = dist_name or package_name or entry_name

            wralea_packages.append(
                {
                    # Keep backward-compatible "name" key, but now canonicalized when possible.
                    "name": package_name,
                    "package_name": package_name,
                    "entry_name": entry_name,
                    "install_name": install_name,
                    "dist_name": dist_name,
                    "module": module_path,
                }
            )
    except Exception as e:
        logging.error("Error listing wralea entry points: %s", e)

    return wralea_packages


if __name__ == "__main__":
    try:
        packages = list_wralea_packages()
        print(json.dumps(packages))
    except Exception as e:
        logging.error("Error: %s", e)
        print(json.dumps([]))
        sys.exit(1)
