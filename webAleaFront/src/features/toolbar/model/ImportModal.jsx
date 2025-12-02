import React, { useState, useRef, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { FiUpload, FiCheck } from "react-icons/fi";
import "../../../assets/css/modal.css"; 

export default function ImportModal({ show, onClose, onImport }) {
    const [fileData, setFileData] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const [isImported, setIsImported] = useState(false);
    const ImportIcon = isImported ? FiCheck : FiUpload;

    useEffect(() => {
    if (show) {
        setIsImported(false);
        setFileData(null); 
    }
    }, [show]);

    const handleFile = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
        const json = JSON.parse(event.target.result);
        setFileData(json);
        } catch (err) {
        alert("Fichier JSON invalide : " + err);
        setIsImported(false);
        }
    };
    reader.readAsText(file);
    setIsImported(true);
    };

    const handleFileChange = (e) => {
    handleFile(e.target.files[0]);
    };

    const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
    };

    const handleImport = () => {
    if (fileData) {
        onImport(fileData);
        onClose();
    }
    };

    return (
    <Modal show={show} onHide={onClose} centered size="lg">
        <Modal.Header closeButton>
        <Modal.Title>Import a workflow</Modal.Title>
        </Modal.Header>

        <Modal.Body>
        <button
            type="button"
            className={`container-fluid  drop-zone ${dragOver ? "drag-over" : ""}`}
            onClick={() => fileInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            onDrop={handleDrop}
            >
            <ImportIcon size={40} className="upload-icon" />
            <p className="drop-text">
                Drag and drop a JSON file here <br /> or click to choose a file
            </p>

            <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                className="file-input"
                onChange={handleFileChange}
            />
        </button>
        </Modal.Body>

        <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
            Cancel
        </Button>
        <Button variant="primary" onClick={handleImport} disabled={!fileData}>
            Import
        </Button>
        </Modal.Footer>
    </Modal>
    );
}
