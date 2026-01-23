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

import { useCallback, useEffect, useState, useRef } from 'react';
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
import { useLog } from '../../logger/providers/LogContextDefinition.jsx';
import { WorkflowEngine } from '../engine/WorkflowEngine.jsx';
import { NodeState } from '../Utils/nodeUtils.js';
import { buildGraphModel, WFNode } from '../model/WorkflowGraph.jsx';

const FLOW_KEY_NODES = 'reactFlowCacheNodes';
const FLOW_KEY_EDGES = 'reactFlowCacheEdges';

// State to status mapping
const stateToStatus = {
    [NodeState.PENDING]: 'queued',
    [NodeState.READY]: 'queued',
    [NodeState.RUNNING]: 'running',
    [NodeState.COMPLETED]: 'done',
    [NodeState.ERROR]: 'error',
    [NodeState.SKIPPED]: 'skipped',
    [NodeState.CANCELLED]: 'ready'
};

const getInitialState = (key) => {
    try {
        const savedState = localStorage.getItem(key);
        return savedState ? JSON.parse(savedState) : [];
    } catch (error) {
        console.error(`Error parsing saved state for ${key}:`, error);
        return [];
    }
};

/**
 * FlowProvider component - provides the FlowContext to its children.
 * Manages the state of nodes and edges, and handles workflow execution.
 * @param children - The child components
 * @returns {React.ReactNode} - The FlowProvider component
 */
export const FlowProvider = ({ children }) => {
    const initialNodes = getInitialState(FLOW_KEY_NODES);
    const initialEdges = getInitialState(FLOW_KEY_EDGES);

    const { addLog } = useLog();

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [currentNode, setCurrentNode] = useState(null);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Execution state
    const [executionStatus, setExecutionStatus] = useState('idle');
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
                    newOutputs = currentOutputs.map((output, index) =>
                        index === 0 ? { ...output, value: outputs } : output
                    );
                } else {
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

    // =========================================================================
    // WORKFLOW ENGINE 
    // =========================================================================

    const engineRef = useRef(null);
    if (!engineRef.current) {
        engineRef.current = new WorkflowEngine();
    }
    const engine = engineRef.current;

    /**
     * Handler for workflow engine events
     */
    const handleEngineEvent = useCallback((event, payload) => {
        console.log("WorkflowEngine event:", event, payload);

        switch (event) {
            case "workflow-start":
                console.log("Workflow started with", payload.totalNodes, "nodes");
                setExecutionStatus(NodeState.RUNNING);
                setExecutionProgress({
                    total: payload.totalNodes,
                    completed: 0,
                    failed: 0,
                    percent: 0
                });
                resetAllNodesStatus("queued");
                addLog("Workflow execution started", { totalNodes: payload.totalNodes });
                break;

            case "node-state-change": {
                const { id, state } = payload;
                const status = stateToStatus[state] || NodeState.READY;
                updateNodeStatus(id, status);
                break;
            }

            case "node-start": {
                const { id, label } = payload;
                addLog(`Node "${label}" started`, { nodeId: id });
                break;
            }

            case "node-result": {
                const { id, result } = payload;
                updateNodeOutputs(id, result);
                setExecutionProgress(prev => ({
                    ...prev,
                    completed: prev.completed + 1,
                    percent: Math.round(((prev.completed + 1) / prev.total) * 100)
                }));
                break;
            }

            case "node-done": {
                const { id, label } = payload;
                addLog(`Node "${label}" completed`, { nodeId: id });
                break;
            }

            case "node-error": {
                const { id, error } = payload;
                const failedNode = nodesRef.current.find(n => n.id === id);
                const nodeLabel = failedNode?.data?.label || id;
                addLog(`Node "${nodeLabel}" failed: ${error}`, { nodeId: id, error });
                setExecutionProgress(prev => ({
                    ...prev,
                    failed: prev.failed + 1
                }));
                break;
            }

            case "node-skipped": {
                const { id, reason } = payload;
                addLog(`Node "${id}" skipped: ${reason}`, { nodeId: id });
                break;
            }

            case "workflow-done":
                if (payload.success) {
                    console.log("Workflow  completed successfully");
                    setExecutionStatus(NodeState.COMPLETED);
                    addLog("Workflow completed successfully", {
                        results: Object.keys(payload.results).length
                    });
                } else {
                    console.log("Workflow completed with errors");
                    setExecutionStatus(NodeState.FAILED);
                    addLog("Workflow completed with errors");
                }
                break;

            case "workflow-error":
                console.error("Workflow failed:", payload.error);
                setExecutionStatus(NodeState.FAILED);
                addLog("Workflow failed: " + payload.error, { error: payload.error });
                break;

            case "workflow-stopped":
                console.log("Workflow stopped by user");
                setExecutionStatus('stopped');
                resetAllNodesStatus("ready");
                addLog("Workflow stopped by user");
                break;

            case "validation-error":
                console.error("Validation errors:", payload.errors);
                setExecutionStatus('validation-error');
                payload.errors.forEach(err => {
                    addLog(`Validation error: ${err.message}`, err);
                });
                break;

            case "validation-warnings":
                payload.warnings.forEach(warn => {
                    addLog(`Warning: ${warn.message}`, warn);
                });
                break;

            default:
                console.log("Unknown event:", event);
        }
    }, [resetAllNodesStatus, updateNodeStatus, updateNodeOutputs, addLog]);

    // Register the event handler and initialize listeners
    useEffect(() => {
        engine.listeners = [];
        engine.onUpdate(handleEngineEvent);
    }, [handleEngineEvent, engine]);

    // =========================================================================
    // EXECUTION FUNCTIONS
    // =========================================================================

    /**
     * Execute the entire workflow
     */
    const executeWorkflow = useCallback(async () => {
        const { graph, edges: customEdges } = buildGraphModel(nodes, edges);

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

        return result;
    }, [nodes, edges, engine, addLog]);

    /**
     * Stop the workflow execution
     */
    const stopWorkflow = useCallback(() => {
        engine.stop();
    }, [engine]);

    /**
     * Execute a single node manually
     */
    const onNodeExecute = useCallback((nodeId) => {
        const currentNodes = nodesRef.current;
        const curNode = currentNodes.find(n => n.id === nodeId);
        if (!curNode) {
            console.warn("Node not found for execution:", nodeId);
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
    }, [engine, addLog]);

    const nodesTypes = {
        custom: CustomNode,
        float: FloatNode,
        string: StringNode,
        boolean: BoolNode,
    };

    /**
     * Persist nodes and edges to localStorage on changes
     */
    useEffect(() => {
        if (edges) {
            localStorage.setItem(FLOW_KEY_EDGES, JSON.stringify(edges));
        }
        if (nodes && nodes.length > 0) {
            localStorage.setItem(FLOW_KEY_NODES, JSON.stringify(nodes));
        } else if (nodes && nodes.length === 0) {
            localStorage.setItem(FLOW_KEY_NODES, '[]');
        }
    }, [nodes, edges]);

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

        const outputType = output?.type || 'any';
        const inputType = input?.type || 'any';
        const isCompatible = outputType === inputType ||
                             outputType === 'any' ||
                             inputType === 'any';

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
     * Updates properties of an existing node.
     * @type {(function(*, *): void)|*}
     * @param {string} id - The ID of the node to update
     * @param {Object} updatedProperties - The properties to update
     */
    const updateNode = useCallback((id, updatedProperties) => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === id ? { ...n, data: { ...n.data, ...updatedProperties } } : n
            )
        );
        addLog("Node updated", { id, updatedProperties });
    }, [setNodes, addLog]);

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

    const contextValue = {
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
    };

    return (
        <FlowContext.Provider value={contextValue}>
            {children}
        </FlowContext.Provider>
    );
};

export default FlowProvider;