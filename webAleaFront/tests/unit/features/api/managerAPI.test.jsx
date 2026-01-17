import { 
    fetchInstalledOpenAleaPackages, 
    fetchLatestPackageVersions,
    fetchPackageList,
    fetchPackageNodes,
    fetchWraleaPackages
}  
from "../../../../src/api/managerAPI.js";

// Mock global fetch
globalThis.fetch = jest.fn();

describe("managerAPI", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("fetchInstalledOpenAleaPackages calls the correct endpoint and returns data", async () => {
        const mockResponse = [{ name: "packageA" }, { name: "packageB" }];
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });
        const data = await fetchInstalledOpenAleaPackages();
        expect(fetch).toHaveBeenCalledWith("/api/packages/installed_openalea");
        expect(data).toEqual(mockResponse);
    });

    test("fetchLatestPackageVersions calls the correct endpoint and returns data", async () => {
        const mockResponse = { packageA: "1.2.0", packageB: "2.3.1" };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });
        const data = await fetchLatestPackageVersions();
        expect(fetch).toHaveBeenCalledWith("/api/packages/latest_versions");
        expect(data).toEqual(mockResponse);
    });

    test("fetchPackageList calls the correct endpoint and returns data", async () => {
        const mockResponse = [{ name: "packageA" }, { name: "packageB" }];
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });
        const data = await fetchPackageList();
        expect(fetch).toHaveBeenCalledWith("/api/packages/list");
        expect(data).toEqual(mockResponse);
    });

    test("fetchPackageNodes calls the correct endpoint with packageName and returns data", async () => {
        const packageName = "packageA";
        const mockResponse = [{ id: "node1" }, { id: "node2" }];
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });
        const data = await fetchPackageNodes(packageName);
        expect(fetch).toHaveBeenCalledWith(`/api/packages/${packageName}/nodes`);
        expect(data).toEqual(mockResponse);
    });

    test("fetchWraleaPackages calls the correct endpoint and returns data", async () => {
        const mockResponse = { wralea_packages: [] };
        fetch.mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

        const data = await fetchWraleaPackages();

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost:8000/api/v1/manager/wralea",
            expect.objectContaining({ method: "GET" })
        );

        expect(data).toEqual(mockResponse);
    });

});
