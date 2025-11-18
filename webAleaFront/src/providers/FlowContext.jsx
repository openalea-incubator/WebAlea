import { useCallback } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import { FlowContext } from './FlowContextDefinition';
import CustomNode from '../components/workspace/CustomNode.jsx';

// Le Provider qui gère l'état et les fonctions
export const FlowProvider = ({ children }) => {
  
  const initialNodes = [];
  const initialEdges = [];

  /*
  const initialNodes = [
    new Node({ id: "n1", title: "Node 1", metadata: { info: "This is node 1", author: ["Author 1", "Author 2"] } }).serialize(),
  ];

  const initialEdges = [
    { id: 'n1-n2', source: 'n1', target: 'n2' },
  ];
  */

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const nodesTypes = { custom: CustomNode };

  // const reactFlowInstance = useReactFlow();

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
    // reactFlowInstance,
  };

  return (
    <FlowContext.Provider value={contextValue}>
      {children}
    </FlowContext.Provider>
  );
};