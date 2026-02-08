import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import { fetchJSON } from "../../../src/api/utils";

globalThis.fetch = jest.fn();

describe("fetchJSON", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("returns JSON on success", async () => {
        const mockResponse = { ok: true };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const data = await fetchJSON("/test");
        expect(fetch).toHaveBeenCalledWith(
            "/test",
            expect.objectContaining({ method: "GET" })
        );
        expect(data).toEqual(mockResponse);
    });

    test("throws on non-ok response", async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({})
        });

        await expect(fetchJSON("/fail")).rejects.toThrow("HTTP 500");
    });

    test("rethrows AbortError", async () => {
        const abortError = new Error("aborted");
        abortError.name = "AbortError";
        fetch.mockRejectedValueOnce(abortError);

        await expect(fetchJSON("/abort")).rejects.toThrow("aborted");
    });
});
