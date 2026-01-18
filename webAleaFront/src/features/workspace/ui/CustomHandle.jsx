import { useEffect, useMemo } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useNodeId,
} from '@xyflow/react';
import { useFlow } from '../providers/FlowContextDefinition.jsx';

// Mapping from types/interfaces to colors
const typeColors = {
  string: "#1976d2",
  float: "#8e24aa",
  int: "#6a1b9a",
  boolean: "#2b8a3e",
  enum: "#ff6f00",
  file: "#5d4037",
  path: "#5d4037",
  array: "#00838f",
  object: "#4527a0",
  color: "#c62828",
  function: "#558b2f",
  any: "#757575",
  none: "#757575",
  default: "#555",
};

/**
 * Get color based on type or interface name.
 * @param {string} typeOrInterface - The type or interface name.
 * @returns {string} - The corresponding color.
 */
function getColorFromType(typeOrInterface) {
  if (!typeOrInterface) return typeColors.any;

  const t = typeOrInterface.toLowerCase();

  // Direct match (for frontend types: float, string, boolean, array, etc.)
  if (typeColors[t]) return typeColors[t];

  // Map OpenAlea interface names (IFloat, IInt, IStr, etc.)
  if (t.includes("float") || t.includes("ifloat")) return typeColors.float;
  if (t.includes("int") || t.includes("iint")) return typeColors.int;
  if (t.includes("str") || t.includes("istr")) return typeColors.string;
  if (t.includes("bool") || t.includes("ibool")) return typeColors.boolean;
  if (t.includes("enum")) return typeColors.enum;
  if (t.includes("file") || t.includes("path") || t.includes("dir")) return typeColors.file;
  if (t.includes("sequence") || t.includes("tuple")) return typeColors.array;
  if (t.includes("dict")) return typeColors.object;
  if (t.includes("rgb") || t.includes("color")) return typeColors.color;
  if (t.includes("function")) return typeColors.function;
  if (t === "none" || t === "any") return typeColors.any;

  return typeColors.default;
}

export default function CustomHandle({ id, label, style, interfaceType, onChange = null, dataType }) {

  // Check if this is an input or output handle
  const isInput = dataType === 'input';
  const handleType = isInput ? 'target' : 'source';

  const parentNodeId = useNodeId();
  const { setNodes } = useFlow();

  // Get connections for this handle
  const connections = useNodeConnections({
    handleType,
    handleId: id,
  });

  const connection = connections?.[0];

  const connectedNodeId = isInput
    ? connection?.source
    : connection?.target;

  const connectedHandleId = isInput
    ? connection?.sourceHandle
    : connection?.targetHandle;

  // Get data of the connected node
  const connectedNode = useNodesData(connectedNodeId);

  // Get the IO (input/output) definitions of the connected node
  // - If this handle is target (input) => We read OUTPUTS of the source
  // - If this handle is source (output) => We read INPUTS of the target
  const connectedIO = isInput
    ? connectedNode?.data?.outputs // target → outputs
    : connectedNode?.data?.inputs; // source → inputs

    // Find the connected IO definition by its handle ID
  const linkedValue = connectedIO?.find((io) => io.id === connectedHandleId);

    // Effect to update parent node's input value when connection changes
  useEffect(() => {
    if (!isInput || !parentNodeId) return;

    // First case: A connection exists - update the input value
    if (connection && linkedValue !== undefined) {
      const newValue = linkedValue?.value;

      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id !== parentNodeId) return node;

          const updatedInputs = (node.data.inputs || []).map((input) => {
            if (input.id === id) {
              if (input.value !== newValue || !input.fromConnection) {
                return { ...input, value: newValue, fromConnection: true };
              }
            }
            return input;
          });

          return {
            ...node,
            data: { ...node.data, inputs: updatedInputs }
          };
        })
      );

      if (onChange) {
        onChange(newValue);
      }
    }

    // Case 2: No connection - remove the fromConnection flag
    else if (!connection) {
      setNodes((prevNodes) =>
        prevNodes.map((node) => {
          if (node.id !== parentNodeId) return node;

          const updatedInputs = (node.data.inputs || []).map((input) => {
            if (input.id === id && input.fromConnection) {
              // Remove fromConnection flag but keep current value
              const { fromConnection, ...rest } = input;
              return rest;
            }
            return input;
          });

          return {
            ...node,
            data: { ...node.data, inputs: updatedInputs }
          };
        })
      );
    }
  }, [linkedValue, connection, onChange, isInput, parentNodeId, id, setNodes]);

  // Memoized style with color based on interfaceType
  // Override background color if interfaceType is provided
  // (for non-primitive types)
  const handleStyle = useMemo(() => {
    if (interfaceType) {
      const color = getColorFromType(interfaceType);
      return { ...style, background: color };
    }
    // No interfaceType provided, return original style
    return style;
  }, [style, interfaceType]);

  return (
    <Handle
      type={handleType}
      position={isInput ? Position.Left : Position.Right}
      id={id}
      className="node-handle"
      style={handleStyle}
    />
  );
}
