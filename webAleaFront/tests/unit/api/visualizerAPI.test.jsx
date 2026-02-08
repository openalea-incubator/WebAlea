import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { fetchNodeScene } from "../../../src/api/visualizerAPI";
import { API_BASE_URL_VISUALIZER } from "../../../src/config/api";

jest.mock("../../../src/features/visualizer/utils/debug", () => ({
    debugLog: jest.fn()
}));

jest.mock("../../../src/config/api", () => ({
    API_BASE_URL_VISUALIZER: "http://test-visualizer"
}));

globalThis.fetch = jest.fn();

describe("visualizerAPI", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("fetchNodeScene posts visualization payload", async () => {
        const mockResponse = { success: true };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const payload = {
            nodeId: "node-1",
            visualizationData: { scene_ref: "abc", outputs: [] }
        };

        const data = await fetchNodeScene(payload);

        expect(fetch).toHaveBeenCalledWith(
            `${API_BASE_URL_VISUALIZER}/visualize`,
            expect.objectContaining({
                method: "POST",
                body: JSON.stringify({
                    node_id: "node-1",
                    visualization_data: payload.visualizationData
                })
            })
        );
        expect(data).toEqual(mockResponse);
    });
});
