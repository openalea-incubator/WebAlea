import { useEffect } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';

export default function CustomHandle({ id, label, style, onChange }) {
  const connections = useNodeConnections({
    handleType: 'target',
    handleId: id,
  });

  const nodeData = useNodesData(connections?.[0]?.source);
  const nodeOutputs = nodeData?.data?.outputs || [];

  console.log(nodeOutputs[0]?.value);

  useEffect(() => {
    onChange(nodeOutputs[0]?.value);
  }, [nodeData]);
  
  return (
    <div>
      <Handle
        type="target"
        position={Position.Left}
        id={id}
        className="node-handle"
        style={style}
      />
      <label htmlFor="red" className="label">
        {label}
      </label>
    </div>
  );
}