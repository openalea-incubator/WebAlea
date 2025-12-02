import { useCallback, useEffect, useState } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import { FlowContext } from './FlowContextDefinition';
import CustomNode from '../components/workspace/CustomNode.jsx';
import FloatNode from '../components/workspace/FloatNode.jsx';
import StringNode from '../components/workspace/StringNode.jsx';
import BoolNode from '../components/workspace/BoolNode.jsx';
import { useLog } from './LogContextDefinition.jsx';

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
  
  const nodesTypes = { 
    custom: CustomNode,
    float: FloatNode,
    string: StringNode,
    boolean: BoolNode,
};

  // --- Synchronisation avec localStorage ---

  // Sauvegarde les nodes chaque fois que 'nodes' change
  useEffect(() => {
    if (nodes && nodes.length > 0) {
      localStorage.setItem(FLOW_KEY_NODES, JSON.stringify(nodes));
    } else if (nodes && nodes.length === 0) {
      localStorage.setItem(FLOW_KEY_NODES, '[]');
    }
  }, [nodes]);

  // Sauvegarde les edges chaque fois que 'edges' change
  useEffect(() => {
    if (edges) {
      localStorage.setItem(FLOW_KEY_EDGES, JSON.stringify(edges));
    }
  }, [edges]);

  // --- Fonctions de gestion ---
  // Fonction pour ajouter une nouvelle connexion (edge)
  const onConnect = useCallback((params) => {
    if (params.source === params.target) {
      return;
    }
    setEdges((eds) => addEdge(params, eds));
    addLog("Edge added", { param: params });
  }, [setEdges, addLog]);

  // Fonction pour ajouter un nouveau noeud
  const addNode = useCallback((newNode) => {
    setNodes((nds) => [...nds, newNode.serialize()]);
    addLog("Node added", {id : newNode.id, title: newNode.title});
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

    addLog("Node updated", { id, updatedProperties });
  }, [setNodes, addLog]);

  // Fonction pour supprimer un noeud
  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter(node => node.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    addLog("Node deleted", { id: nodeId });
  }, [setNodes, setEdges, addLog]);

  const onNodeClick = useCallback((event, node) => {
    console.log("Clicked:", node.id);
    setCurrentNode(node.id);   // OK
    addLog("Node selected", { id: node.id, label: node.data.label });
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
    // reactFlowInstance,
  };

  return (
    <FlowContext.Provider value={contextValue}>
      {children}
    </FlowContext.Provider>
  );
};