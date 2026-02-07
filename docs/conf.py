import os
import sys

from pathlib import Path
from urllib.parse import urljoin
from urllib.request import pathname2url

import sphinx_js.typedoc as sj_typedoc

if os.name == "nt": # If OS is Windows
    _orig_search = sj_typedoc.search_node_modules

    def _search_node_modules(cmdname, cmdpath, dir):
        p = _orig_search(cmdname, cmdpath, dir)
        if cmdname == "typedoc":
            bin_cmd = Path(p).parents[2] / ".bin" / "typedoc.cmd"
            if bin_cmd.is_file():
                return str(bin_cmd)
        return p

    sj_typedoc.search_node_modules = _search_node_modules

    def _to_file_url(p: str) -> str:
        return urljoin("file:", pathname2url(str(Path(p).resolve())))

    def _to_posix_path(p: str) -> str:
        try:
            return Path(p).resolve().as_posix()
        except (OSError, ValueError):
            return p.replace("\\", "/")

    _OrigCommand = sj_typedoc.Command

    class _Command(_OrigCommand):
        def make(self):
            args = super().make()
            for i in range(len(args) - 1):
                if args[i] == "--import":
                    args[i + 1] = _to_file_url(args[i + 1])
                if args[i] == "--basePath":
                    args[i + 1] = _to_posix_path(args[i + 1])
                if args[i] == "--json":
                    args[i + 1] = _to_posix_path(args[i + 1])
            # Convert any remaining Windows paths (like src paths) to posix.
            args = [
                _to_posix_path(a) if ":" in a and "\\" in a else a
                for a in args
            ]
            return args

    sj_typedoc.Command = _Command

# Backend access
DOCS_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(DOCS_DIR, ".."))

# Access node modules
os.environ["SPHINX_JS_NODE_MODULES"] = os.path.join(PROJECT_ROOT, "webAleaFront", "node_modules")
os.environ["TYPEDOC_NODE_MODULES"] = os.path.join(PROJECT_ROOT, "webAleaFront", "node_modules")
os.environ["NODE_PATH"] = os.path.join(PROJECT_ROOT, "webAleaFront", "node_modules")

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
jsdoc_tsconfig_path = "../webAleaFront/tsconfig.json"

html_theme = "furo"
