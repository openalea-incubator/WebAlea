import React, { useState } from "react";

export default function ImportModal({ show, onClose, onImport }) {
    const [fileData, setFileData] = useState(null);

    const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
        const json = JSON.parse(event.target.result);
        setFileData(json);
        } catch (err) {
        alert("Fichier JSON invalide");
        }
    };
    reader.readAsText(file);
    };

    const handleImport = () => {
    if (fileData) {
        onImport(fileData); // renvoie les données au parent
    }
    };

  if (!show) return null; // ne pas afficher si show=false

return (
<div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
    <div className="modal-dialog">
        <div className="modal-content">
            <div className="modal-header">
                <h5 className="modal-title">Importer JSON</h5>
                <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
                <input type="file" accept=".json" onChange={handleFileChange} />
            </div>
            <div className="modal-footer">
                <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
                <button className="btn btn-primary" onClick={handleImport} disabled={!fileData}>
                    Importer
            </button>
            </div>
        </div>
    </div>
</div>
);
}
