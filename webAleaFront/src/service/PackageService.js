
/**
 * Library for managing package-related operations in the application.
 */
import { fetchPackageList, fetchPackageNodes, installPackages, fetchInstalledOpenAleaPackages } from "../api/managerAPI";


/**
 * Fetches the list of installed OpenAlea packages.
 * @returns {Promise<Array>} An array of installed OpenAlea packages.
 */
export async function getPackagesList() {
    const allPackagesObj = await fetchPackageList();
    const allPackages = Array.from(Object.entries(allPackagesObj));
    const formattedPackages = allPackages.map((pkg) => ({
        name: pkg[0],
        version: pkg[1][0].version ?? "unknown",
    })
    );
    return formattedPackages;
}

export async function isInstalledPackage(packageName) {
    const installePackages = await fetchInstalledOpenAleaPackages();
    const arrayPackages = Array.from(Object.entries(installePackages));
    const formattedPackages = arrayPackages.map((pkg) => pkg.name);
    return formattedPackages.includes(packageName);
}

export async function installPackage(pkg) {
    const installPkg = await installPackages([pkg]);
        console.log("installPkg :", installPkg);
    return installPkg;
}

export async function getNodesList(pkg) {
    try {
        // Installer si nécessaire
        if (!(await isInstalledPackage(pkg.name))) {
            console.log(`Package "${pkg.name}" is not installed. Installing...`);
            await installPackage(pkg);
        }

        // Récupération des nodes
        const allNodes = await fetchPackageNodes(pkg.name);
        console.log("allNodes :", allNodes);

        return allNodes.map(([name, data]) => ({
            name,
            data: data[0]
        }));

    } catch (error) {
        console.error(`Error : impossible to fetch nodes for package "${pkg}":`, error);
        return [];
    }
}
