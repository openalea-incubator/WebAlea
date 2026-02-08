// utils.js

// ===============================
// WRAPPER UTILS FOR FETCH API
// ===============================
export async function fetchJSON(url, method = "GET", body = null, options = {}) {
    const { signal } = options;
    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : null,
            signal,
        });

        if (!res.ok) {
            throw new Error(`Erreur API : HTTP ${res.status}`);
        }

        return await res.json();

    } catch (err) {
        if (err?.name === "AbortError") {
            throw err;
        }
        console.error("Erreur fetchJSON:", err);
        throw err;
    }
}
