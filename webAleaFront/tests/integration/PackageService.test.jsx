import { 
    jest, beforeEach, test, expect, describe
} 
from "@jest/globals";

import { getPackagesList, getVisualPackagesList, isInstalledPackage, getInstalledPackagesList, getNodesList, installPackage  } from "../../src/service/PackageService";
import { fetchLatestPackageVersions, installPackages  } from "../../src/api/managerAPI";
import { fetchWraleaPackages, fetchInstalledOpenAleaPackages, fetchPackageNodes } from "../../src/api/inspectorAPI";

/* ========================
    Mocks
======================== */

jest.mock("../../src/api/managerAPI", () => ({
    fetchLatestPackageVersions: jest.fn(),
    installPackages: jest.fn(),
}));

jest.mock("../../src/api/inspectorAPI", () => ({
    fetchWraleaPackages: jest.fn(),
    fetchInstalledOpenAleaPackages: jest.fn(),
    fetchPackageNodes: jest.fn(),
}));

jest.mock('../../src/config/api', () => ({
    API_BASE_URL: 'http://testapi.local'
}));

/* ========================
    Tests
======================== */

describe("PackageService Unit Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("getPackagesList returns formatted package list", async () => {
        fetchLatestPackageVersions.mockResolvedValue({
            "openalea.plantgl": { version: "3.22.3" },
            "openalea.core": { version: "2.0.0" },
        });

        const result = await getPackagesList();

        expect(result).toEqual([
            { name: "openalea.plantgl", version: "3.22.3" },
            { name: "openalea.core", version: "2.0.0" },
        ]);
    });

    test("getPackagesList handles invalid response", async () => {
        fetchLatestPackageVersions.mockResolvedValue(null);
        const result = await getPackagesList();
        expect(result).toEqual([]);
    });

    test("getVisualPackagesList returns visual packages only", async () => {
        fetchWraleaPackages.mockResolvedValue({
            wralea_packages: [
                { name: "plantgl", module: "openalea.plantgl_wralea" },
            ],
        });


        const result = await getVisualPackagesList();

        expect(result).toEqual([
            {
                name: "plantgl",
                packageName: "plantgl",
                installName: "plantgl",
                entryName: "plantgl",
                distName: "",
                module: "openalea.plantgl_wralea",
            },
        ]);
    });

    test("getVisualPackagesList handles missing wralea_packages", async () => {
        fetchWraleaPackages.mockResolvedValue({});
        const result = await getVisualPackagesList();
        expect(result).toEqual([]);
    });

    test("isInstalledPackage correctly identifies installed packages", async () => {
        fetchInstalledOpenAleaPackages.mockResolvedValue({
            installed_openalea_packages: ["openalea.plantgl"],
        });

        const isInstalled = await isInstalledPackage("openalea.plantgl");
        const isNotInstalled = await isInstalledPackage("openalea.nonexistent");

        expect(isInstalled).toBe(true);
        expect(isNotInstalled).toBe(false);
    });

    test("isInstalledPackage returns false on invalid package name", async () => {
        fetchInstalledOpenAleaPackages.mockResolvedValue({
            installed_openalea_packages: ["openalea.plantgl"]
        });
        const result = await isInstalledPackage(null);
        expect(result).toBe(false);
    });

    test("getInstalledPackagesList returns list of installed packages", async () => {
        fetchInstalledOpenAleaPackages.mockResolvedValue({
            installed_openalea_packages: [
                "openalea.plantgl",
                "openalea.core",
            ],
        });

        const result = await getInstalledPackagesList();

        expect(result).toEqual([
            "openalea.plantgl",
            "openalea.core",
        ]);
    });


    test("getNodesList returns nodes for a given package", async () => {

        fetchInstalledOpenAleaPackages.mockResolvedValue({
            installed_openalea_packages: ["openalea.plantgl"]
        });


        fetchPackageNodes.mockResolvedValue({
            package_name: "openalea.plantgl",
            has_wralea: true,
            nodes: {
                Node1: {
                    description: "Node 1 desc",
                    inputs: [],
                    outputs: [],
                },
                Node2: {
                    description: "Node 2 desc",
                    inputs: [],
                    outputs: [],
                },
            },
        });

        const result = await getNodesList({ name: "openalea.plantgl" });

        expect(result).toEqual([
            {
                name: "Node1",
                description: "Node 1 desc",
                inputs: [],
                outputs: [],
                callable: null,
                nodekind: "atomic",
                graph: null
            },
            {
                name: "Node2",
                description: "Node 2 desc",
                inputs: [],
                outputs: [],
                callable: null,
                nodekind: "atomic",
                graph: null
            },
        ]);
    });

    test("getNodesList handles package without visual nodes", async () => {
        fetchPackageNodes.mockResolvedValue({
            package_name: "pkg",
            has_wralea: false,
            nodes: {}
        });
        const result = await getNodesList({ name: "pkg" });
        expect(result).toEqual([]);
    });

    test("getNodesList handles invalid responses format", async () => {
        fetchPackageNodes.mockResolvedValue(null);
        const result = await getNodesList({ name: "pkg" });
        expect(result).toEqual([]);
    });

    test("getNodesList has to install package before fetching nodes", async () => {
        fetchInstalledOpenAleaPackages.mockResolvedValue({
            installed_openalea_packages: []
        });
        installPackages.mockResolvedValue({
            success: true,
            installed: ["openalea.plantgl"],
            failed: [],
        });
        fetchPackageNodes.mockResolvedValue({
            package_name: "openalea.plantgl",
            has_wralea: true,
            nodes: {
                Node1: {
                    description: "Node 1 desc",
                    inputs: [],
                    outputs: [],
                },
            },
        });
        const result = await getNodesList({ name: "openalea.plantgl" });
        expect(result).toEqual([
            {
                name: "Node1",
                description: "Node 1 desc",
                inputs: [],
                outputs: [],
                callable: null,
                nodekind: "atomic",
                graph: null
            },
        ]);
    });

    test("getNodesList fails if package installation fails", async () => {
        fetchInstalledOpenAleaPackages.mockResolvedValue({
            installed_openalea_packages: []
        });
        installPackages.mockResolvedValue({
            success: false,
            installed: [],
            failed: [{ package: "openalea.plantgl", error: "error" }],
        });
        fetchPackageNodes.mockRejectedValueOnce(new Error("not installed"));
        const result = await getNodesList({ name: "openalea.plantgl" });
        expect(result).toEqual([]);
    });

    test("installPackage calls installPackages API with correct parameters", async () => {
        installPackages.mockResolvedValue({
            installed: ["openalea.plantgl"],
            failed: [],
        });

        const result = await installPackage({
            name: "openalea.plantgl",
            version: "3.22.3",
        });

        expect(installPackages).toHaveBeenCalledWith([
            { name: "openalea.plantgl", version: "3.22.3" }
        ]);

        expect(result).toEqual({
            success: true,
            installed: ["openalea.plantgl"],
            failed: [],
        });
    });

    test("installPackage returns failure on invalid pkg", async () => {
    const result = await installPackage({});
    expect(result.success).toBe(false);
    expect(result.failed.length).toBe(1);
});

    test("installPackage handles failed installation from API", async () => {
        installPackages.mockResolvedValue({
            installed: [],
            failed: [{ package: "openalea.plantgl", error: "error" }]
        });
        const result = await installPackage({ name: "openalea.plantgl" });
        expect(result.success).toBe(false);
        expect(result.failed).toHaveLength(1);
    });
});
