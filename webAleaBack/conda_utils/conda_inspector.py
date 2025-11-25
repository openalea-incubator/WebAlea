from openalea.core.pkgmanager import PackageManager

class OpenAleaInspector:
    """Class to inspect OpenAlea packages installed in the current environment."""

    @staticmethod

    def describe_openalea_package(package_name: str) -> dict:
        """Describes the nodes contained with an openalea package

        Args:
            package_name (str): the name of a package

        Raises:
            ValueError: the package was not found

        Returns:
            dict: the package decription
        """
        pm = PackageManager()
        pm.init()
        print( pm.get_packages() )

        if package_name not in pm:
            raise ValueError(f"No OpenAlea package named '{package_name}' found.")

        pkg = pm[package_name]
        nodes = {}

        for node_factory in pkg.values():
            node_desc = {
                "description": node_factory.description,
                "inputs": {port['name']: str(port['interface']) for port in node_factory.inputs},
                "outputs": {port['name']: str(port['interface']) for port in node_factory.outputs},
                "module": node_factory.nodemodule,
                "callable": node_factory.nodeclass,
            }
            nodes[node_factory.name] = node_desc

        return {"nodes": nodes}
