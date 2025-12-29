
/**
 * Library for managing package-related operations in the application.
 */
import { fetchPackageList, fetchPackageNodes, installPackages, fetchInstalledOpenAleaPackages } from "../api/managerAPI";


/**
 * Fetches the list of installed OpenAlea packages.
 * @returns {Promise<Array<Object>>} A Promise that resolves to an array of all the packages (Objects) of the OpenAlea ecosystem.
 */
export async function getPackagesList() {
    const allPackagesObj = await fetchPackageList();
    const allPackages = Array.from(Object.entries(allPackagesObj));
    console.log("allPackages :", allPackages);
    const formattedPackages = allPackages.map((pkg) => ({
        name: pkg[0],
        version: pkg[1][0].version ?? "unknown",
    })
    );
    return formattedPackages;
}

/**
 * 
 * @param {String} packageName 
 * @returns {Promise<Boolean>} A Promise that resolves to a boolean indicating if the package is installed.
 */
export async function isInstalledPackage(packageName) {
    const installedPackages = await fetchInstalledOpenAleaPackages();
    const formattedPackages = Object.keys(installedPackages);
    return formattedPackages.includes(packageName);
}


/**
 * 
 * @param {Object} pkg 
 * @returns {Promise<Object>} A Promise that resolves to the installation result.
 */
export async function installPackage(pkg) {
    const installPkg = await installPackages([pkg]);
        console.log("installPkg :", installPkg);
    return installPkg;
}

/**
 * 
 * @param {Object} pkg 
 * @returns {Promise<Array<Object>>} A Promise that resolves to an array of nodes of the package.
 */
export async function getNodesList(pkg) {
    try {
        // Install the package if not already installed
        if (!(await isInstalledPackage(pkg.name))) {
            console.log(`Package "${pkg.name}" is not installed. Installing...`);
            await installPackage(pkg);
        }

        // Fetching nodes
        const allNodes = await fetchPackageNodes(pkg.name);
        console.log("allNodes :", allNodes);

        return allNodes.map(([name, data]) => ({
            name,
            data: data[0]
        }));

    } catch (error) {
        console.error(`Error : impossible to fetch nodes for package "${pkg.name}":`, error);
        return [];
    }
}
