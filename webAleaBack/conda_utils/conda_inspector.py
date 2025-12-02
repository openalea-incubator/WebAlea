"""Module to inspect OpenAlea packages in the current conda environment."""
import logging

from typing import Any, Dict, List

from openalea.core.pkgmanager import PackageManager

class OpenAleaInspector:
    """Class to inspect OpenAlea packages installed in the current environment."""


    @staticmethod
    def list_installed_openalea_packages() -> List[str]:
        """Lists all installed OpenAlea packages in the current conda environment.

        Returns:
            list: A list of installed OpenAlea package names.
        """
        # initalize package manager
        pm = PackageManager()
        pm.init()
        return list(pm.keys())

    @staticmethod
    def _serialize_node_puts(puts) -> dict:
        """serialize inputs and outputs of a list inputs/outputs

        Args:
            node_factory : the flow node factory

        Returns:
            dict: serialized inputs and outputs
        """
        serialized = []
        if not puts:
            return serialized # empty array if no inputs/outputs
        for put in puts: # for each input/output
            try:
                # serialize into a json dict
                put_dict = {
                    "name": put.name,
                    "interface": str(put.interface),
                    "optional": put.optional,
                    "desc": put.desc,
                }
                serialized.append(put_dict)
            except AttributeError:
                serialized.append(str(put))
        return serialized

    @staticmethod
    def _serialize_node(node_factory) -> dict:
        """describes a node from its factory

        Args:
            node_factory : the node factory

        Raises:
            ValueError: if no node was found

        Returns:
            dict: the node description
        """
        # serialize node factory information
        inputs = OpenAleaInspector._serialize_node_puts(node_factory.inputs)
        outputs = OpenAleaInspector._serialize_node_puts(node_factory.outputs)

        return {
            "description": node_factory.description,
            "inputs": inputs,
            "outputs": outputs,
            "callable": node_factory.nodeclass,
        }


    @staticmethod
    def describe_openalea_package(package_name: str) -> Dict[str, Any]:
        """Describes the nodes contained in an OpenAlea package.

        Args:
            package_name (str): the name of a package

        Raises:
            ValueError: the package was not found

        Returns:
            dict: the package description (JSON-serializable)
        """
        # initalize package manager
        pm = PackageManager()
        pm.init()
        # check package existence
        if package_name not in pm.keys():
            logging.error("No OpenAlea package named '%s' found.", package_name)
            raise ValueError(f"No OpenAlea package named '{package_name}' found.")
        # retrieve package
        pkg = pm.get(package_name)
        nodes: Dict[str, Any] = {}
        # describe each node in the package
        for node_factory in pkg.values():
            node_name = getattr(node_factory, "name", str(node_factory))
            nodes[node_name] = OpenAleaInspector._serialize_node(node_factory)

        return {"nodes": nodes}
