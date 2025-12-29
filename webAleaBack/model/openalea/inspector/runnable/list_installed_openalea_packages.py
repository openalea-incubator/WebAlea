"""
This module provides functionality to list all installed OpenAlea packages

This module is dynamically ran by subprocess in order update the python instance used
"""

import json
import logging
import sys
from typing import List

from openalea.core.pkgmanager import PackageManager

def list_installed_openalea_packages() -> List[str]:
    """Lists all installed OpenAlea packages in the current conda environment.

    Returns:
        list: A list of installed OpenAlea package names.
    """
    # initalize package manager
    pm = PackageManager()
    pm.init()
    return list(pm.keys())

if __name__ == "__main__":
    logging.info("fetching the list of installed packages by subprocess")
    try:
        packages = list_installed_openalea_packages()
        print(json.dumps(packages))
    except Exception as e:
        logging.error("Error listing packages: %s", e)
        print(json.dumps([]), file=sys.stdout)
        sys.exit(1)
