import { useCallback, useRef, useState } from "react";
import { fetchNodeScene } from "../../../api/visualizerAPI";
import {
    buildOutputSummary,
    buildVisualizationData,
    parseSceneData
} from "../services/visualizerService";
import { debugLog } from "../utils/debug";

export function useVisualizerScene({ currentNodeId, nodes }) {
    const sceneJSONRef = useRef(null);
    const sceneNodeIdRef = useRef(null);

    const [sceneVersion, setSceneVersion] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [warning, setWarning] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const clearScene = useCallback(() => {
        sceneJSONRef.current = null;
        sceneNodeIdRef.current = null;
        setSceneVersion(prev => prev + 1);
        setError(null);
        setWarning(null);
        setShowModal(false);
    }, []);

    const handleRender = useCallback(async () => {
        if (sceneJSONRef.current && sceneNodeIdRef.current === currentNodeId) {
            debugLog("[Visualizer] Reusing cached scene for node", currentNodeId);
            setShowModal(true);
            return;
        }

        if (sceneNodeIdRef.current !== currentNodeId) {
            debugLog("[Visualizer] Switching node, clearing previous scene cache", {
                previousNode: sceneNodeIdRef.current,
                nextNode: currentNodeId
            });
            sceneJSONRef.current = null;
            sceneNodeIdRef.current = null;
        }

        const node = nodes.find(n => n.id === currentNodeId);
        if (!node) {
            setError("No node selected.");
            return;
        }

        const outputs = node.data?.outputs ?? [];
        if (!outputs.length) {
            setError("No outputs available for visualization.");
            return;
        }

        const visualizationData = buildVisualizationData(outputs);
        const outputSummary = buildOutputSummary(outputs);
        debugLog("[Visualizer] Render request payload summary", {
            nodeId: node.id,
            outputCount: outputs.length,
            hasSceneRef: Boolean(visualizationData?.scene_ref),
            outputSummary
        });

        setIsLoading(true);
        setError(null);
        setWarning(null);

        try {
            const sceneData = await fetchNodeScene({
                nodeId: node.id,
                visualizationData
            });

            if (!sceneData?.success) {
                debugLog("[Visualizer] Backend visualize failed", sceneData);
                setError(sceneData?.error || "Rendering failed.");
                return;
            }

            const { parsedScene, objectCount } = parseSceneData(sceneData);
            debugLog("[Visualizer] Scene ready", {
                nodeId: node.id,
                cacheHit: sceneData?.cacheHit,
                warning: sceneData?.warning,
                objects: objectCount
            });

            sceneJSONRef.current = parsedScene;
            sceneNodeIdRef.current = currentNodeId;
            setSceneVersion(prev => prev + 1);

            if (sceneData?.warning) {
                setWarning(sceneData.warning);
            } else if (parsedScene && Array.isArray(parsedScene.objects) && parsedScene.objects.length === 0) {
                setWarning("Scene contains no objects.");
            }
            setShowModal(true);
        } catch (err) {
            debugLog("[Visualizer] Unexpected render error", err);
            setError(err?.message || "Unexpected error while rendering.");
        } finally {
            setIsLoading(false);
        }
    }, [currentNodeId, nodes]);

    return {
        isLoading,
        error,
        warning,
        showModal,
        sceneVersion,
        sceneJSON: sceneJSONRef.current,
        hasScene: Boolean(sceneJSONRef.current),
        setShowModal,
        handleRender,
        clearScene
    };
}
