/**
 * FlowContext.jsx
 *
 * Context provider for managing the workflow graph state and execution.
 *
 * Features:
 * - Manages nodes and edges state with persistence in localStorage.
 * - Integrates with WorkflowEngine for executing the workflow.
 * - Provides functions to update node status, outputs, and handle execution events.
 * - Exposes context values for use in the React Flow UI components.
 */

import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
    useNodesState,
    useEdgesState,
    addEdge,
} from '@xyflow/react';
import { FlowContext } from './FlowContextDefinition.jsx';
import CustomNode from '../ui/CustomNode.jsx';
import FloatNode from '../ui/type/FloatNode.jsx';
import StringNode from '../ui/type/StringNode.jsx';
import BoolNode from '../ui/type/BoolNode.jsx';
import ArrayNode from '../ui/type/ArrayNode.jsx';
import DictNode from '../ui/type/DictNode.jsx';
import EnumNode from '../ui/type/EnumNode.jsx';
import { useLog } from '../../logger/providers/LogContextDefinition.jsx';
import { WorkflowEngine } from '../engine/WorkflowEngine.jsx';
import { NodeState } from '../constants/nodeState.js';
import { buildGraphModel, WFNode } from '../model/WorkflowGraph.jsx';
import { StorageKeys, NodeType, DataType, PERSISTENCE_DEBOUNCE_MS } from '../constants/workflowConstants.js';
import { useLocalStorage, loadFromLocalStorage } from '../hooks/useLocalStorage.js';
import { createWorkflowEventHandlers } from '../handlers/workflowEventHandlers.js';
import { areTypesCompatible } from '../utils/typeValidation.js';
import { expandComposites } from '../utils/compositeExpansion.js';
import {
    collectCompositeStates,
    computeCompositeState,
    resolveCompositeOutput
} from '../utils/compositeRuntime.js';

/**
 * FlowProvider component - provides the FlowContext to its children.
 * Manages the state of nodes and edges, and handles workflow execution.
 * @param children - The child components
 * @returns {React.ReactNode} - The FlowProvider component
 */
export const FlowProvider = ({ children }) => {
    const initialNodes = loadFromLocalStorage(StorageKeys.NODES, []);
    const initialEdges = loadFromLocalStorage(StorageKeys.EDGES, []);

    const { addLog } = useLog();

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [currentNode, setCurrentNode] = useState(null);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Execution state
    const [executionStatus, setExecutionStatus] = useState(NodeState.PENDING);
    const [executionProgress, setExecutionProgress] = useState({
        total: 0,
        completed: 0,
        failed: 0,
        percent: 0
    });

    // Get the latest nodes in a ref for engine event handlers
    const nodesRef = useRef(nodes);
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    // =========================================================================
    // NODE HELPERS
    // =========================================================================

    const updateNodeStatus = useCallback((nodeId, status) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, status } }
                    : node
            )
        );
    }, [setNodes]);

    const updateNodeOutputs = useCallback((nodeId, outputs) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== nodeId) return node;

                const currentOutputs = node.data.outputs || [];
                let newOutputs;

                if (!Array.isArray(outputs)) {
                    // Single value update - update first output
                    newOutputs = currentOutputs.map((output, index) =>
                        index === 0 ? { ...output, value: outputs } : output
                    );
                } else {
                    // Array of outputs - match by index, id, or name
                    newOutputs = currentOutputs.map((output, idx) => {
                        const matchingResult = outputs.find((r) =>
                            r.index === idx || r.id === output.id || r.name === output.name
                        );
                        if (matchingResult) {
                            return {
                                ...output,
                                value: matchingResult.value,
                                type: matchingResult.type || output.type
                            };
                        }
                        return output;
                    });
                }

                return {
                    ...node,
                    data: { ...node.data, outputs: newOutputs }
                };
            })
        );
    }, [setNodes]);

    const resetAllNodesStatus = useCallback((status) => {
        setNodes((prevNodes) =>
            prevNodes.map((node) => ({
                ...node,
                data: { ...node.data, status }
            }))
        );
    }, [setNodes]);


    /**
     * Updates properties of an existing node.
     * @param {string} id - The ID of the node to update
     * @param {Object} updatedProperties - The properties to update
     */
    const updateNode = useCallback((id, updatedProperties) => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === id ? { ...n, data: { ...n.data, ...updatedProperties } } : n
            )
        );
        // Only log if not a frequent update (like value changes)
        if (!updatedProperties.outputs) {
            addLog("Node updated", { id, updatedProperties });
        }
    }, [setNodes, addLog]);

    // =========================================================================
    // WORKFLOW ENGINE 
    // =========================================================================

    const engineRef = useRef(null);
    if (!engineRef.current) {
        engineRef.current = new WorkflowEngine();
    }
    const engine = engineRef.current;

    // Helper to get node by ID
    const getNodeById = useCallback((nodeId) => {
        return nodesRef.current.find(n => n.id === nodeId);
    }, []);

    /**
     * Handler for workflow engine events
     */
    const handleEngineEvent = useCallback(
        createWorkflowEventHandlers({
            setExecutionStatus,
            setExecutionProgress,
            resetAllNodesStatus,
            updateNodeStatus,
            updateNodeOutputs,
            addLog,
            getNodeById
        }),
        [resetAllNodesStatus, updateNodeStatus, updateNodeOutputs, addLog, getNodeById]
    );

    // =========================================================================
    // EXECUTION FUNCTIONS
    // =========================================================================

    /**
     * Execute the entire workflow
     */
    const compositeMappingsRef = useRef([]);
    const compositeMappingByIdRef = useRef(new Map());
    const applyInputFallbacks = useCallback((nodesToProcess) => {
        return (nodesToProcess || []).map(node => {
            if (!Array.isArray(node?.data?.inputs)) return node;
            let changed = false;
            const nextInputs = node.data.inputs.map(input => {
                const hasValue = input.value !== undefined && input.value !== null;
                if (hasValue) return input;

                if (input.default !== undefined && input.default !== null) {
                    changed = true;
                    return { ...input, value: input.default };
                }

                const type = (input.type || "").toLowerCase();
                let fallback;
                if (type === "float" || type === "int") fallback = 0;
                else if (type === "boolean") fallback = false;
                else if (type === "string") fallback = "";
                else if (type === "array") fallback = [];
                else if (type === "object" || type === "dict") fallback = {};
                else if (type === "enum") fallback = input.enumOptions?.[0] ?? "";
                else if (type === "any") fallback = "";
                else fallback = null;

                if (fallback === null) return input;
                changed = true;
                return { ...input, value: fallback, _autoFallbackApplied: true };
            });
            if (!changed) return node;
            return { ...node, data: { ...node.data, inputs: nextInputs } };
        });
    }, []);

    /**
     * Aggregate and propagate composite runtime state from internal node states.
     */
    const recomputeCompositeState = useCallback(() => {
        if (!engine?.nodeStates || compositeMappingsRef.current.length === 0) return;

        compositeMappingsRef.current.forEach(mapping => {
            const compositeNode = nodesRef.current.find(n => n.id === mapping.compositeId);
            if (!compositeNode) return;

            const states = collectCompositeStates(engine.nodeStates, mapping);
            if (states.length === 0) return;

            updateNodeStatus(mapping.compositeId, computeCompositeState(states));
        });
    }, [engine, updateNodeStatus]);

    /**
     * Propagate composite outputs from expanded execution results.
     * Supports nested composites via recursive resolution.
     * @param {object} results
     */
    const updateCompositeOutputs = useCallback((results) => {
        if (!results || compositeMappingsRef.current.length === 0) return;

        compositeMappingsRef.current.forEach(mapping => {
            const compositeNode = nodesRef.current.find(n => n.id === mapping.compositeId);
            if (!compositeNode) return;

            const outputs = (compositeNode.data.outputs || []).map(output => {
                const resolved = resolveCompositeOutput(
                    results,
                    mapping,
                    output.id,
                    compositeMappingByIdRef.current
                );
                if (!resolved) return output;
                return { ...output, value: resolved.value, type: resolved.type || output.type };
            });

            updateNode(mapping.compositeId, { outputs });
        });
    }, [updateNode]);

    // Register the event handler and initialize listeners
    useEffect(() => {
        engine.listeners = [];
        engine.onUpdate((event, payload) => {
            handleEngineEvent(event, payload);
            if (event === "node-state-change" || event === "workflow-done" || event === "node-error") {
                recomputeCompositeState();
            }
        });
    }, [handleEngineEvent, engine, recomputeCompositeState]);

    const executeWorkflow = useCallback(async () => {
        const { nodes: expandedNodes, edges: expandedEdges, mappings } = expandComposites(nodes, edges, 8);
        compositeMappingsRef.current = mappings;
        compositeMappingByIdRef.current = new Map(mappings.map(m => [m.compositeId, m]));
        const preparedNodes = applyInputFallbacks(expandedNodes);
        const { graph, edges: customEdges } = buildGraphModel(preparedNodes, expandedEdges);

        console.log("Executing workflow with:", {
            nodes: graph.length,
            edges: customEdges.length
        });

        addLog("Building workflow model", {
            nodes: graph.length,
            edges: customEdges.length
        });

        engine.bindModel(graph, customEdges);
        const result = await engine.start();
        if (result?.results) {
            updateCompositeOutputs(result.results);
        }
        recomputeCompositeState();

        return result;
    }, [nodes, edges, engine, addLog, updateCompositeOutputs, recomputeCompositeState, applyInputFallbacks]);

    /**
     * Stop the workflow execution
     */
    const stopWorkflow = useCallback(() => {
        engine.stop();
    }, [engine]);

    /**
     * Execute a single node manually
     */
    const executeCompositeNode = useCallback(async (compositeNode) => {
        if (!compositeNode?.data?.graph) {
            addLog("Composite execution failed: missing internal graph", { id: compositeNode?.id });
            updateNodeStatus(compositeNode?.id, NodeState.ERROR);
            return;
        }

        updateNodeStatus(compositeNode.id, NodeState.RUNNING);
        updateNode(compositeNode.id, { missingInputs: [] });
        addLog("Composite execution started", { id: compositeNode.id });

        try {
            // Expand the composite into its internal graph (supports nested composites)
            const { nodes: expandedNodes, edges: expandedEdges, mappings } =
                expandComposites([compositeNode], [], 8);

            const topMapping = mappings.find(m => m.compositeId === compositeNode.id);
            if (!topMapping) {
                throw new Error("Composite expansion failed (no mapping found).");
            }

            // Inject composite input values into internal nodes
            const compositeInputs = compositeNode.data.inputs || [];
            const inputValueById = new Map(
                compositeInputs.map(input => [input.id, input.value ?? input.default])
            );

            const internalInputValues = new Map();
            topMapping.inputMap?.forEach((mapped, compositeInputId) => {
                const value = inputValueById.get(compositeInputId);
                if (value === undefined) return;
                const internalId = `${compositeNode.id}::${mapped.nodeId}`;
                if (!internalInputValues.has(internalId)) {
                    internalInputValues.set(internalId, new Map());
                }
                internalInputValues.get(internalId).set(mapped.handleId, value);
            });

            const injectedNodes = expandedNodes.map(node => {
                const updates = internalInputValues.get(node.id);
                if (!updates || !Array.isArray(node?.data?.inputs)) return node;

                const nextInputs = node.data.inputs.map(input => {
                    if (!updates.has(input.id)) return input;
                    return { ...input, value: updates.get(input.id) };
                });

                return {
                    ...node,
                    data: { ...node.data, inputs: nextInputs }
                };
            });

            // Propagate primitive values to custom node inputs (simulate CustomHandle behavior)
            const nodeById = new Map(injectedNodes.map(n => [n.id, n]));
            const withPrimitiveValues = injectedNodes.map(node => {
                if (node.type !== NodeType.CUSTOM || !Array.isArray(node?.data?.inputs)) return node;

                const incomingEdges = expandedEdges.filter(e => e.target === node.id);
                if (incomingEdges.length === 0) return node;

                let inputsChanged = false;
                const nextInputs = node.data.inputs.map(input => {
                    const edge = incomingEdges.find(e => e.targetHandle === input.id);
                    if (!edge) return input;

                    const sourceNode = nodeById.get(edge.source);
                    if (!sourceNode || sourceNode.type === NodeType.CUSTOM) return input;

                    const sourceOutputs = sourceNode.data?.outputs || [];
                    const sourceOutput =
                        sourceOutputs.find(o => o.id === edge.sourceHandle) ||
                        sourceOutputs[0];
                    const sourceValue = sourceOutput?.value;

                    if (sourceValue === undefined || sourceValue === null) return input;
                    if (input.value !== undefined && input.value !== null) return input;

                    inputsChanged = true;
                    return { ...input, value: sourceValue };
                });

                if (!inputsChanged) return node;
                return { ...node, data: { ...node.data, inputs: nextInputs } };
            });

            // Fill missing inputs with defaults or type-based fallbacks
            const withDefaultInputs = applyInputFallbacks(withPrimitiveValues);

            const { graph, edges: customEdges } = buildGraphModel(withDefaultInputs, expandedEdges);

            const compositeEngine = new WorkflowEngine();
            compositeEngine.bindModel(graph, customEdges);
            const result = await compositeEngine.start();

            if (result?.results) {
                const mappingById = new Map(mappings.map(m => [m.compositeId, m]));
                const outputs = (compositeNode.data.outputs || []).map(output => {
                    const resolved = resolveCompositeOutput(
                        result.results,
                        topMapping,
                        output.id,
                        mappingById
                    );
                    if (!resolved) return output;
                    return { ...output, value: resolved.value, type: resolved.type || output.type };
                });

                updateNode(compositeNode.id, { outputs });
            }

            if (!result?.success) {
                const missing = Array.isArray(result?.errors)
                    ? result.errors.filter(e => e?.type === "UNCONNECTED_INPUT")
                    : [];

                if (missing.length > 0) {
                    updateNode(compositeNode.id, { missingInputs: missing });
                    console.warn("Composite missing inputs:", missing);
                    addLog("Composite missing inputs", {
                        id: compositeNode.id,
                        count: missing.length,
                        inputs: missing.map(m => m.message)
                    });
                }

                addLog("Composite execution failed", {
                    id: compositeNode.id,
                    error: result?.error,
                    errors: result?.errors,
                    warnings: result?.warnings
                });
                console.warn("Composite execution failed:", {
                    id: compositeNode.id,
                    error: result?.error,
                    errors: result?.errors,
                    warnings: result?.warnings
                });
            }

            updateNodeStatus(compositeNode.id, result?.success ? NodeState.COMPLETED : NodeState.ERROR);
            addLog("Composite execution completed", {
                id: compositeNode.id,
                success: result?.success ?? false
            });
        } catch (error) {
            console.error("Composite execution error:", error);
            updateNodeStatus(compositeNode.id, NodeState.ERROR);
            addLog("Composite execution error", { id: compositeNode.id, error: error?.message });
        }
    }, [addLog, updateNode, updateNodeStatus]);

    const onNodeExecute = useCallback((nodeId) => {
        const currentNodes = nodesRef.current;
        const curNode = currentNodes.find(n => n.id === nodeId);
        if (!curNode) {
            console.warn("Node not found for execution:", nodeId);
            return;
        }

        if (curNode?.data?.nodekind === "composite") {
            executeCompositeNode(curNode);
            return;
        }

        const formNode = new WFNode({
            id: curNode.id,
            type: curNode.type,
            inputs: curNode.data.inputs ?? [],
            outputs: curNode.data.outputs ?? [],
            packageName: curNode.data.packageName ?? null,
            nodeName: curNode.data.nodeName ?? null,
            label: curNode.data.label ?? null
        });

        engine.executeNodeManual(formNode);
        addLog("Single node execution started", {
            id: nodeId,
            packageName: formNode.packageName,
            nodeName: formNode.nodeName
        });
    }, [engine, addLog, executeCompositeNode]);

    const nodesTypes = useMemo(() => ({
        [NodeType.CUSTOM]: CustomNode,
        [NodeType.FLOAT]: FloatNode,
        [NodeType.STRING]: StringNode,
        [NodeType.BOOLEAN]: BoolNode,
        [NodeType.ARRAY]: ArrayNode,
        [NodeType.DICT]: DictNode,
        [NodeType.ENUM]: EnumNode,
    }), []);

    // Persist nodes and edges to localStorage with debounce
    useLocalStorage(StorageKeys.NODES, nodes.length > 0 ? nodes : [], PERSISTENCE_DEBOUNCE_MS);
    useLocalStorage(StorageKeys.EDGES, edges, PERSISTENCE_DEBOUNCE_MS);

    /**
     * Manages new connections between nodes, enforcing type compatibility.
     * @type {(function(*): void)|*}
     */
    const onConnect = useCallback((params) => {
        if (params.source === params.target) {
            return;
        }

        const { source, sourceHandle, target, targetHandle } = params;
        const sourceNode = nodes.find(n => n.id === source);
        const targetNode = nodes.find(n => n.id === target);

        if (!sourceNode || !targetNode) return;

        const output = sourceNode.data.outputs?.find(o => o.id === sourceHandle);
        const input = targetNode.data.inputs?.find(i => i.id === targetHandle);

        const outputType = output?.type || DataType.ANY;
        const inputType = input?.type || DataType.ANY;
        const isCompatible = areTypesCompatible(outputType, inputType);

        if (!isCompatible) {
            addLog("Type mismatch - connection refused", {
                from: `${source}.${sourceHandle} (${outputType})`,
                to: `${target}.${targetHandle} (${inputType})`
            });
            return;
        }

        setEdges((eds) => addEdge(params, eds));
        addLog("Edge added", { params });
    }, [nodes, setEdges, addLog]);

    /**
     * Adds a new node to the workflow.
     * @type {(function(*): void)|*}
     * @param {Node} newNode - The new node to add
     */
    const addNode = useCallback((newNode) => {
        setNodes((nds) => [...nds, newNode.serialize()]);
        addLog("Node added", {
            id: newNode.id,
            title: newNode.title,
            inputs: newNode.inputs,
            outputs: newNode.outputs
        });
    }, [setNodes, addLog]);

    /**
     * Defines both nodes and edges in a single operation.
     * Sets the workflow graph state.
     * @type {(function(*, *): void)|*}
     */
    const setNodesAndEdges = useCallback((newNodes, newEdges) => {
        setNodes(newNodes);
        setEdges(newEdges);
        addLog("Workflow updated", { nodes: newNodes.length, edges: newEdges.length });
    }, [setNodes, setEdges, addLog]);

    /**
     * Deletes a node and its associated edges from the workflow.
     * @type {(function(*): void)|*}
     * @param {string} nodeId - The ID of the node to delete
     */
    const deleteNode = useCallback((nodeId) => {
        setNodes((nds) => nds.filter(node => node.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
        addLog("Node deleted", { id: nodeId });
    }, [setNodes, setEdges, addLog]);

    /**
     * Handles node click events to set the current node.
     * @type {(function(*, *): void)|*}
     * @param {Object} event - The click event
     * @param {Object} node - The clicked node
     */
    const onNodeClick = useCallback((event, node) => {
        setCurrentNode(node.id);
        addLog("Node selected", {
            id: node.id,
            label: node.data.label,
            type: node.type
        });
    }, [addLog]);

    // =========================================================================
    // CONTEXT VALUE
    // =========================================================================

    const contextValue = useMemo(() => ({
        // Graph state
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        deleteNode,
        setNodes,
        setEdges,
        nodesTypes,
        updateNode,
        setNodesAndEdges,
        currentNode,
        setCurrentNode,
        onNodeClick,

        // Execution
        onNodeExecute,
        executeWorkflow,
        stopWorkflow,
        executionStatus,
        executionProgress,
        engine,

        // Helpers
        updateNodeStatus,
        updateNodeOutputs,
        resetAllNodesStatus
    }), [
        nodes,
        edges,
        onNodesChange,
        onEdgesChange,
        onConnect,
        addNode,
        deleteNode,
        setNodes,
        setEdges,
        nodesTypes,
        updateNode,
        setNodesAndEdges,
        currentNode,
        setCurrentNode,
        onNodeClick,
        onNodeExecute,
        executeWorkflow,
        stopWorkflow,
        executionStatus,
        executionProgress,
        engine,
        updateNodeStatus,
        updateNodeOutputs,
        resetAllNodesStatus
    ]);

    return (
        <FlowContext.Provider value={contextValue}>
            {children}
        </FlowContext.Provider>
    );
};

export default FlowProvider;
