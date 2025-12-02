import * as React from 'react';
import {Node} from '../../workspace/model/Node.jsx';
import { useFlow } from '../../workspace/providers/FlowContextDefinition.jsx';
import PanelModuleNode from './type/PanelModuleNode.jsx';
import PanelPrimitiveNode from './type/PanelPrimitiveNode.jsx';
import '../../../assets/css/package_manager.css';

export default function PackageManager() {

  const { addNode } = useFlow();
  const [currentPanel, setCurrentPanel] = React.useState("conda");

  /*const handleAddNode = (item) => {
    addNode(new Node({id : `n${Math.floor(Math.random() * 10000)}-${item.id}`, type: "custom", label : item.label, inputs: item.data.inputs ? item.data.inputs : [], outputs: item.data.outputs ? item.data.outputs : []}));
  };*/

  const handleAddPrimitiveNode = (treeNode) => {
    treeNode.node.id = `n${Math.floor(Math.random() * 10000)}-${treeNode.node.id}`;
    addNode(treeNode.node);
  };

  const renderTabContent = () => {
    switch (currentPanel) {
      case "conda":
        return <PanelModuleNode onAddNode={handleAddPrimitiveNode} />;
      case "primitive":
        return <PanelPrimitiveNode onAddNode={handleAddPrimitiveNode} />;
      default:
        return null;
    }
  };

  return (
    <div className="container-fluid">
      
      {/* --- Barre d’onglets --- */}
      <div className="d-flex justify-content-center mb-3 gap-4">

        {/* onglet conda */}
        <span
          onClick={() => setCurrentPanel("conda")}
          className={currentPanel === "conda" ? "tabStylesActive" : "tabStylesNotActive tabstyles"}
        >
          Conda packages
        </span>

        {/* onglet primitives */}
        <span
          onClick={() => setCurrentPanel("primitive")}
          className={currentPanel === "primitive" ? "tabStylesActive" : "tabStylesNotActive tabstyles"}
        >
          Primitive inputs
        </span>
      </div>

      {/* --- Contenu --- */}
      <div className="p-2">
        {renderTabContent()}
      </div>
    </div>
  );
}
