/**
 * compositeRuntime.js
 *
 * Helpers for resolving composite node runtime state and outputs
 * from expanded execution results.
 */

import { NodeState } from "../constants/nodeState.js";

/**
 * Collect runtime states for internal nodes of a composite.
 * Falls back to prefix scanning when explicit internal ids are missing.
 * @param {Map<string, string>} engineStateMap
 * @param {object} mapping
 * @returns {string[]} array of node states
 */
export function collectCompositeStates(engineStateMap, mapping) {
    if (!engineStateMap || !mapping) return [];

    const internalIds = new Set();
    if (Array.isArray(mapping.internalIds) && mapping.internalIds.length > 0) {
        mapping.internalIds.forEach(id => internalIds.add(id));
    } else {
        mapping.outputMap?.forEach(m => internalIds.add(`${mapping.compositeId}::${m.nodeId}`));
        mapping.inputMap?.forEach(m => internalIds.add(`${mapping.compositeId}::${m.nodeId}`));
    }

    let states = [...internalIds].map(id => engineStateMap.get(id)).filter(Boolean);
    if (states.length === 0) {
        const prefix = `${mapping.compositeId}::`;
        states = [...engineStateMap.entries()]
            .filter(([id]) => id.startsWith(prefix))
            .map(([, state]) => state)
            .filter(Boolean);
    }

    return states;
}

/**
 * Compute the aggregate composite state from internal node states.
 * @param {string[]} states
 * @returns {string}
 */
export function computeCompositeState(states) {
    if (!Array.isArray(states) || states.length === 0) return NodeState.PENDING;

    if (states.some(s => s === NodeState.ERROR)) return NodeState.ERROR;
    if (states.some(s => s === NodeState.RUNNING)) return NodeState.RUNNING;
    if (states.every(s => s === NodeState.COMPLETED)) return NodeState.COMPLETED;
    if (states.some(s => s === NodeState.SKIPPED)) return NodeState.SKIPPED;
    if (states.some(s => s === NodeState.CANCELLED)) return NodeState.CANCELLED;
    if (states.some(s => s === NodeState.READY)) return NodeState.READY;
    return NodeState.PENDING;
}

/**
 * Resolve a composite output against runtime results, supporting nested composites.
 * @param {object} results
 * @param {object} mapping
 * @param {string} outputId
 * @param {Map<string, object>} mappingById
 * @param {Set<string>} visited
 * @returns {object|null}
 */
export function resolveCompositeOutput(results, mapping, outputId, mappingById, visited = new Set()) {
    if (!mapping?.outputMap) return null;
    const mapped = mapping.outputMap.get(outputId);
    if (!mapped) return null;

    const internalId = `${mapping.compositeId}::${mapped.nodeId}`;
    const internalOutputs = results?.[internalId] || [];
    const match = internalOutputs.find(o =>
        o.id === mapped.handleId ||
        o.name === mapped.handleId ||
        (mapped.handleIndex !== null && mapped.handleIndex === o.index)
    );
    if (match) return match;

    const nested = mappingById?.get?.(internalId);
    if (!nested || visited.has(internalId)) return null;
    visited.add(internalId);
    return resolveCompositeOutput(results, nested, mapped.handleId, mappingById, visited);
}
