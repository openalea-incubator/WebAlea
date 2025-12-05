
/**
 * Library for managing package-related operations in the application.
 */
import { fetchPackageList, fetchPackageNodes } from "../api/managerAPI";


/**
 * Fetches the list of installed OpenAlea packages.
 * @returns {Promise<Array>} A promise that resolves to an array of installed OpenAlea packages.
 */
export async function getPackagesList() {
    const allPackagesObj = await fetchPackageList();
    const allPackages = Array.from(Object.entries(allPackagesObj));
    const formattedPackages = allPackages.map((pkg) => ({
        name: pkg[0],
        version: pkg[1][0].version ?? "unknown",
    })
    );
    console.log("formattedPackages : ", formattedPackages);
    return formattedPackages;
}

export async function getNodesList(pkg) {
    const allNodes = await fetchPackageNodes(pkg);
    const formattedNodes = allNodes.map((nds) => ({
        name: nds.name,
    }));
    return formattedNodes;
}