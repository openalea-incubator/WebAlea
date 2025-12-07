import { useCallback, useEffect, useState } from 'react';
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
import { buildGraphModel, WFNode } from '../model/WorkflowGraph.jsx';

const FLOW_KEY_NODES = 'reactFlowCacheNodes';
const FLOW_KEY_EDGES = 'reactFlowCacheEdges';

// Fonction utilitaire pour charger l'état initial
const getInitialState = (key) => {
  try {
    const savedState = localStorage.getItem(key);
    return savedState ? JSON.parse(savedState) : [];
  } catch (error) {
    console.error(`Erreur de chargement du localStorage pour ${key}:`, error);
    return [];
  }
};

// Le Provider qui gère l'état et les fonctions
export const FlowProvider = ({ children }) => {

  const initialNodes = getInitialState(FLOW_KEY_NODES);
  const initialEdges = getInitialState(FLOW_KEY_EDGES);

  const { addLog } = useLog()

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [currentNode, setCurrentNode] = useState(null);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // --- Gestion des événements du moteur ---
  const handleEngineEvent = (event, payload) => {
    console.log("WorkflowEngine event:", event, payload);
    if (event === "node-result") {
      const { id, result } = payload;
      console.log("Updating node result in FlowContext:", id, result);

      updateNode(id, { result });
      console.log("Node updated with result:", id, result);
    }
  };

  // Init Workflow Engine
  const [engine] = useState(() => {
    const workflowEngine = new WorkflowEngine();
    workflowEngine.onUpdate(handleEngineEvent);
    return workflowEngine;
  });

  const nodesTypes = {
    custom: CustomNode,
    float: FloatNode,
    string: StringNode,
    boolean: BoolNode,
  };

  // --- Synchronisation avec localStorage ---
  // Sauvegarde automatique des nodes et edges dans le localStorage
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

  // --- Fonctions de gestion ---
  // Fonction pour ajouter une nouvelle connexion (edge)
  const onConnect = useCallback((params) => {
      
    if (params.source === params.target) {
      return;
    }
    const { source, sourceHandle, target, targetHandle } = params;

    const sourceNode = nodes.find(n => n.id === source);
    const targetNode = nodes.find(n => n.id === target);

    if (!sourceNode || !targetNode) return;

    const output = sourceNode.data.outputs.find(o => o.id === sourceHandle);
    const input = targetNode.data.inputs.find(i => i.id === targetHandle);
    console.log("Connecting:", { output, input });

    // --- Vérification des types ---
    if (output?.type !== input?.type) {
      addLog("❌ Type mismatch", {
        from: `${ source}.${sourceHandle} (${output?.type})`,
        to: `${target}.${targetHandle} (${input?.type})`
      });
      console.warn("Type mismatch:", output?.type, "→", input?.type);
      return; // ❗ REFUSE LA CONNECTION
    }

    // --- OK : on ajoute l’edge ---
    setEdges((eds) => addEdge(params, eds));
    addLog("Edge added", { params });
  }, [nodes, setEdges, addLog]);

  // Fonction pour ajouter un nouveau noeud
  const addNode = useCallback((newNode) => {
    setNodes((nds) => [...nds, newNode.serialize()]);
    addLog("Node added", { id: newNode.id, title: newNode.title, inputs: newNode.inputs, outputs: newNode.outputs });
  }, [setNodes, addLog]);

  // Fonction pour définir le workflow
  const setNodesAndEdges = useCallback((newNodes, newEdges) => {
    console.log("Setting nodes and edges...", newNodes, newEdges);
    setNodes(newNodes);
    setEdges(newEdges);
    addLog("Workflow updated", { nodes: newNodes.length, edges: newEdges.length });
  }, [setNodes, setEdges, addLog]);

  const updateNode = useCallback((id, updatedProperties) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...updatedProperties } } : n
      )
    );
    setCurrentNode(id);
    addLog("Node updated", { id, updatedProperties, inputs: updatedProperties.inputs, outputs: updatedProperties.outputs });
  }, [setNodes, addLog]);

  // Fonction pour supprimer un noeud
  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter(node => node.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    addLog("Node deleted", { id: nodeId });
  }, [setNodes, setEdges, addLog]);

  const onNodeClick = useCallback((event, node) => {
    console.log("Clicked:", node.id);
    setCurrentNode(node.id);
    addLog("Node selected", { id: node.id, label: node.data.label, type: node.type, inputs: node.data.inputs, outputs: node.data.outputs });
  }, [addLog]);

  const onNodeExecute = useCallback((nodeId) => {
    console.log("Executing node:", nodeId);
    const curNode = nodes.find(n => n.id === nodeId);
    if (!curNode) {
      console.warn("Node not found for execution:", nodeId);
      return;
    }
    const formNode = new WFNode({
      id: curNode.id,
      type: curNode.type,
      inputs: curNode.data.inputs ?? [],
      outputs: curNode.data.outputs ?? [],
    });
    engine.executeNode(formNode);
    addLog("Node execution started", { id: nodeId });
  }, [addLog]);


  // --- Valeur fournie par le Context ---
  const contextValue = {
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
    engine,
  };

  return (
    <FlowContext.Provider value={contextValue}>
      {children}
    </FlowContext.Provider>
  );
};