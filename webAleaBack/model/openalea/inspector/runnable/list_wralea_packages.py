"""
This module lists OpenAlea packages that have visual nodes (wralea entry points).

Only installed packages can be checked for wralea entry points.
"""

import json
import sys
import logging
from importlib.metadata import entry_points


def list_wralea_packages() -> list:
    """Lists all installed packages that have wralea entry points (visual nodes).

    Returns:
        list: A list of package names that have visual nodes.
    """
    wralea_packages = []

    try:
        # Get all entry points in the "wralea" group
        eps = entry_points(group="wralea")

        for ep in eps:
            wralea_packages.append({
                "name": ep.name,
                "module": ep.value,
            })
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
