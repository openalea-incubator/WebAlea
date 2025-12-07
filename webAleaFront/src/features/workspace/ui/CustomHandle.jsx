import { useEffect } from 'react';
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  useReactFlow,
} from '@xyflow/react';

export default function CustomHandle({ id, label, style, onChange = null, dataType }) {
  const connections = useNodeConnections({
    handleType: 'target',
    handleId: id,
  });

  const nodeData = useNodesData(connections?.[0]?.source);
  const nodeOutputs = nodeData?.data?.outputs || [];

  useEffect(() => {
    if (onChange && nodeOutputs.length > 0) {
      onChange(nodeOutputs[0]?.value);
    }
  }, [nodeData]);
  
  return (
    <div>
      <Handle
        type={dataType === 'input' ? 'target' : 'source'}
        position={dataType === 'input' ? Position.Left : Position.Right}
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