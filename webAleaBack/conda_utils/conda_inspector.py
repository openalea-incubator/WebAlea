"""This module inspects conda packages for their contents."""
import subprocess
import inspect
import importlib

class CondaInspector:
    """
    Class to inspect conda packages for their functions and classes.
    This class uses introspection to extract information about functions and classes
    defined in a given package.
    """

    @staticmethod
    def describe_function(func: callable) -> dict:
        """Extract description, parameters, and return info from a function.
        
        Args:
            func (callable): The function to inspect.

        Returns:
            dict: A dictionary with 'description', 'parameters', and 'return' info.
        """
        signature = inspect.signature(func) # Get function signature
        params = {}
        for name, param in signature.parameters.items():
            params[name] = str(param)

        doc = inspect.getdoc(func) or ""
        return {
            "description": doc.split("\n", maxsplit=1)[0] if doc else "",
            "parameters": params,
            "return": str(signature.return_annotation) if signature.return_annotation is not inspect.Signature.empty else ""
        }
    
    @staticmethod
    def describe_class(cls: type) -> dict:
        """Extract description and methods from a class."""
        doc = inspect.getdoc(cls) or ""

        methods = {}
        for name, member in inspect.getmembers(cls, inspect.isfunction):
            # Filter out private or magic methods if desired
            if name.startswith("_"):
                continue
            methods[name] = CondaInspector.describe_function(member)

        return {
            "description": doc.split("\n", maxsplit=1)[0] if doc else "",
            "methods": methods
        }
    
    @staticmethod
    def describe_module(package_name):
        """Return a dict describing all functions and classes in a module."""
        module = importlib.import_module(package_name)

        functions = {}
        classes = {}

        for name, member in inspect.getmembers(module):
            if inspect.isfunction(member) and member.__module__ == module.__name__:
                functions[name] = CondaInspector.describe_function(member)
    
            if inspect.isclass(member) and member.__module__ == module.__name__:
                classes[name] = CondaInspector.describe_class(member)

        return {
            "functions": functions,
            "classes": classes
        }
