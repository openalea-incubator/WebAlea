import { useEffect, useMemo } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
} from '@xyflow/react';

// Couleurs par type d'interface
const typeColors = {
  string: "#1976d2",
  float: "#8e24aa",
  int: "#6a1b9a",
  boolean: "#2b8a3e",
  enum: "#ff6f00",
  file: "#5d4037",
  path: "#5d4037",
  none: "#757575",
  default: "#555",
};

/**
 * Détermine la couleur selon le type ou interface
 */
function getColorFromType(typeOrInterface) {
  if (!typeOrInterface) return typeColors.none;

  const t = typeOrInterface.toLowerCase();

  // Match direct
  if (typeColors[t]) return typeColors[t];

  // Map interfaces OpenAlea
  if (t.includes("float") || t.includes("ifloat")) return typeColors.float;
  if (t.includes("int") || t.includes("iint")) return typeColors.int;
  if (t.includes("str") || t.includes("istr")) return typeColors.string;
  if (t.includes("bool") || t.includes("ibool")) return typeColors.boolean;
  if (t.includes("enum")) return typeColors.enum;
  if (t.includes("file") || t.includes("path") || t.includes("dir")) return typeColors.file;
  if (t === "none") return typeColors.none;

  return typeColors.default;
}

export default function CustomHandle({ id, label, style, interfaceType, onChange = null, dataType }) {

  // Détermination du type réel du handle
  const isInput = dataType === 'input';
  const handleType = isInput ? 'target' : 'source';

  // Récupère les connexions de CE handle
  const connections = useNodeConnections({
    handleType,
    handleId: id,
  });

  // Une seule connexion pour ce handle (sinon on prend la première)
  const connection = connections?.[0];

  // Node ID du node connecté
  const connectedNodeId = isInput
    ? connection?.source
    : connection?.target;

  // Handle ID du handle connecté
  const connectedHandleId = isInput
    ? connection?.sourceHandle
    : connection?.targetHandle;

  // Récupère les data du node connecté
  const connectedNode = useNodesData(connectedNodeId);

  // IO du node connecté selon ton besoin :
  // - Si CE handle est target => on lit OUTPUTS du source
  // - Si CE handle est source => on lit INPUTS du target
  const connectedIO = isInput
    ? connectedNode?.data?.outputs // target → lit outputs
    : connectedNode?.data?.inputs; // source → lit inputs

  // On récupère l'IO spécifique correspondant au handle connecté
  const linkedValue = connectedIO?.find((io) => io.id === connectedHandleId);

  // Synchronisation
  useEffect(() => {
    if (onChange && linkedValue) {
      onChange(linkedValue.value);
    }
  }, [linkedValue, onChange]);

  // Calcul de la couleur basée sur le type/interface
  // Si interfaceType est défini, on utilise getColorFromType
  // Sinon, on garde le style.background passé en prop (pour les primitives)
  const handleStyle = useMemo(() => {
    if (interfaceType) {
      const color = getColorFromType(interfaceType);
      return { ...style, background: color };
    }
    // Pas d'interfaceType -> garder le style original (primitives)
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
