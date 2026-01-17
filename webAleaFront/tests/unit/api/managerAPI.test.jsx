import { 
    fetchInstalledOpenAleaPackages, 
    fetchLatestPackageVersions,
    fetchPackageList,
    fetchPackageNodes,
    fetchWraleaPackages,
    installPackages,
    executeNode
}  
from "../../../src/api/managerAPI";

import { 
    jest, beforeEach, test, expect, describe
} 
from "@jest/globals";
import { API_BASE_URL } from "../../../src/config/api";

// Mock global fetch
globalThis.fetch = jest.fn();

// Mock the API_BASE_URL to avoid using the real environment variable
jest.mock("../../../src/config/api", () => ({
    API_BASE_URL: "http://test-api",
}));

describe("managerAPI", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("fetchInstalledOpenAleaPackages calls the correct endpoint and returns data", async () => {
        const mockResponse = ["packageA", "packageB"];
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });
        const data = await fetchInstalledOpenAleaPackages();
        expect(fetch).toHaveBeenCalledWith(API_BASE_URL + "/installed", expect.any(Object));
        expect(data).toEqual(mockResponse);
    });

    test("fetchLatestPackageVersions calls the correct endpoint and returns data", async () => {
        const mockResponse = { packageA: "1.2.0", packageB: "2.3.4" };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });
        const data = await fetchLatestPackageVersions();
        expect(fetch).toHaveBeenCalledWith(API_BASE_URL + "/latest", expect.any(Object));
        expect(data).toEqual(mockResponse);
    });

    test("fetchPackageList calls the correct endpoint and returns data", async () => {
        const mockResponse = [{ name: "packageA" }, { name: "packageB" }];
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });
        const data = await fetchPackageList();
        expect(fetch).toHaveBeenCalledWith(API_BASE_URL + "/", expect.any(Object));
        expect(data).toEqual(mockResponse);
    });

    test("fetchWraleaPackages calls the correct endpoint and returns data", async () => {
        const mockResponse = ["wraleaPackageA", "wraleaPackageB"];
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });
        const data = await fetchWraleaPackages();
        expect(fetch).toHaveBeenCalledWith(API_BASE_URL + "/wralea", expect.any(Object));
        expect(data).toEqual(mockResponse);
    });

    test("fetchPackageNodes calls the correct endpoint and returns data", async () => {
        const mockResponse = { package_name: "packageA", nodes: { node1: {}, node2: {} }, has_wralea: true };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });
        const data = await fetchPackageNodes("packageA");
        expect(fetch).toHaveBeenCalledWith(API_BASE_URL + "/installed/packageA", expect.any(Object));
        expect(data).toEqual(mockResponse);
    });

    test("installPackages calls the correct endpoint with POST and returns data", async () => {
        const mockResponse = { success: true };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });
        const data = await installPackages([{name: "packageA", version: "1.2"}], "env1");
        expect(fetch).toHaveBeenCalledWith(API_BASE_URL + "/install", expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
                packages: [{name: "packageA", version: "1.2"}],
                env_name: "env1"
            })
        }));
        expect(data).toEqual(mockResponse);
    });

    test("executeNode calls the correct endpoint with POST and returns data", async () => {
        const mockResponse = { result: "success" };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse,
        });
        const nodeData = {
            nodeId: "node1",
            packageName: "packageA",
            nodeName: "nodeName",
            inputs: [
                { id: "input1", name: "inputName1", type: "string", value: "value1" },
                { id: "input2", name: "inputName2", type: "number", value: 42 }
            ]
        };
        const data = await executeNode(nodeData);
        expect(fetch).toHaveBeenCalledWith(API_BASE_URL + "/execute/node", expect.objectContaining({
            method: "POST",
            body: JSON.stringify({
                node_id: "node1",
                package_name: "packageA",
                node_name: "nodeName",
                inputs: [
                    { id: "input1", name: "inputName1", type: "string", value: "value1" },
                    { id: "input2", name: "inputName2", type: "number", value: 42 }
                ]
            })
        }));
        expect(data).toEqual(mockResponse);

    });

});