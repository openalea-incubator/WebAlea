"""Conda helper package for WebAlea.

This package exposes the Conda class from the `conda.py` module so that
imports like `from conda.conda import Conda` work in tests and application code.

Note: Naming this package `conda` conflicts with the system `conda` package.
Prefer renaming in future to avoid collisions.
"""
from .conda_utils import Conda
__all__ = ["Conda"]
