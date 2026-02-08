const DEBUG_FLAG = import.meta.env?.VITE_VISUALIZER_DEBUG;
const ENABLE_DEBUG = DEBUG_FLAG !== undefined
    ? String(DEBUG_FLAG).toLowerCase() === "true"
    : Boolean(import.meta.env?.DEV);

export function debugLog(...args) {
    if (ENABLE_DEBUG) {
        console.log(...args);
    }
}
