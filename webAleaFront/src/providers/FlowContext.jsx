import { useCallback, useEffect, useState } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import { FlowContext } from './FlowContextDefinition';
import CustomNode from '../components/workspace/CustomNode.jsx';

const FLOW_KEY_NODES = 'reactFlowCacheNodes';
const FLOW_KEY_EDGES = 'reactFlowCacheEdges';

// Fonction utilitaire pour charger l'état initial
const getInitialState = (key, fallback) => {
  try {
    const savedState = localStorage.getItem(key);
    // Si des données existent, parsez-les. Sinon, utilisez le fallback (tableau vide).
    return savedState ? JSON.parse(savedState) : fallback;
  } catch (error) {
    console.error(`Erreur de chargement du localStorage pour ${key}:`, error);
    return fallback;
  }
};

// Le Provider qui gère l'état et les fonctions
export const FlowProvider = ({ children }) => {

  const initialNodes = getInitialState(FLOW_KEY_NODES, []);
  const initialEdges = getInitialState(FLOW_KEY_EDGES, []);

  /*
  const initialNodes = [
    new Node({ id: "n1", title: "Node 1", metadata: { info: "This is node 1", author: ["Author 1", "Author 2"] } }).serialize(),
  ];

  const initialEdges = [
    { id: 'n1-n2', source: 'n1', target: 'n2' },
  ];
  */

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [currentNode, setCurrentNode] = useState(null);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const nodesTypes = { custom: CustomNode };

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
  }, [setEdges]);

  // Fonction pour ajouter un nouveau noeud
  const addNode = useCallback((newNode) => {
    setNodes((nds) => [...nds, newNode.serialize()]);
  }, [setNodes]);

  // Fonction pour définir le workflow
  const setNodesAndEdges = useCallback((newNodes, newEdges) => {
    console.log("Setting nodes and edges...", newNodes, newEdges);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  const updateNode = useCallback((id, updatedProperties) => {
    
    setNodes((nds) =>
      nds.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...updatedProperties } } : n
      )
    );
  }, [setNodes]);

  // Fonction pour supprimer un noeud
  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter(node => node.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  const onNodeClick = useCallback((event, node) => {
    console.log('Node clicked:', node);
    setCurrentNode(node);
  }, []);

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