import os
import sys

# Backend access
sys.path.insert(0, os.path.abspath("../webAleaBack"))

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
    "undoc-members": True,
}

# Frontend access
js_language = "javascript"
js_source_path = "../webAleaFront/src"

html_theme = "furo"
