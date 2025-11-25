import * as React from 'react';
import { Node } from '../workspace/Node.jsx';
import { useFlow } from '../../providers/FlowContextDefinition.jsx';
import PanelModuleNode from './PanelModuleNode.jsx';
import PanelPrimitiveNode from './PanelPrimitiveNode.jsx';
import '../../assets/css/package_manager.css'; // Css perso

export default function PackageManager() {

  const { addNode } = useFlow();
  const [currentPanel, setCurrentPanel] = React.useState("conda");

  const handleAddNode = (item) => {
    addNode(
      new Node({
        id: `n${Math.floor(Math.random() * 10000)}-${item.id}`,
        label: item.label,
        inputs: item?.inputs || [],
        outputs: item?.outputs || [],
      })
    );
  };

  const renderTabContent = () => {
    switch (currentPanel) {
      case "conda":
        return <PanelModuleNode onAddNode={handleAddNode} />;
      case "primitive":
        return <PanelPrimitiveNode onAddNode={handleAddNode} />;
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
