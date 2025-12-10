import { useEffect } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
} from '@xyflow/react';

export default function CustomHandle({ id, label, style, onChange = null, dataType }) {

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

  // On récupère l’IO spécifique correspondant au handle connecté
  const linkedValue = connectedIO?.find((io) => io.id === connectedHandleId);

  console.log("CustomHandle:", linkedValue);

  // Synchronisation
  useEffect(() => {
    if (onChange && linkedValue) {
      onChange(linkedValue.value);
    }
  }, [linkedValue]);

  return (
    <div>
      <Handle
        type={handleType}
        position={isInput ? Position.Left : Position.Right}
        id={id}
        className="node-handle"
        style={style}
      />

      <label className="label">{label}</label>
    </div>
  );
}
