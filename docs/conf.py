import os
import sys

# Backend access
DOCS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(DOCS_DIR, ".."))

sys.path.insert(0, os.path.join(PROJECT_ROOT, "webAleaBack"))

# project = "My Project"
# author = "Your Team"

extensions = [
    "sphinx.ext.autodoc",
    "sphinx.ext.autosummary",
    "sphinx.ext.napoleon",
    "sphinx_autodoc_typehints",
    "myst_parser",
    "sphinx_js",
]

autosummary_generate = True
autodoc_default_options = {
    "members": True,
    "undoc-members": False,
    "show-inheritance": True,
}

# Frontend access
js_language = "typescript"
js_source_path = "../webAleaFront/src"
js_entry_points = ["index.js"]
js_entry_point_strategy = "resolve"
js_tsconfig_path = "../webAleaFront/tsconfig.json"

html_theme = "furo"
