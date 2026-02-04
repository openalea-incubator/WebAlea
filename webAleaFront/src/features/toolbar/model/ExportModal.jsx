import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { FiDownload, FiCheck } from "react-icons/fi";
import "../../../assets/css/modal.css";

/**
 * ExportModal
 *
 * Provides a dialog to choose export type (workspace or composite).
 * For composite export, collects minimal metadata.
 *
 * @param {boolean} show
 * @param {function} onClose
 * @param {function} onExport - callback with { mode, packageName, nodeName, description }
 */
export default function ExportModal({ show, onClose, onExport }) {
    const [mode, setMode] = useState("workspace");
    const [packageName, setPackageName] = useState("local_packages");
    const [nodeName, setNodeName] = useState("composite_1");
    const [description, setDescription] = useState("");
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (show) {
            setIsReady(false);
        }
    }, [show]);

    useEffect(() => {
        if (mode === "workspace") {
            setIsReady(true);
        } else {
            setIsReady(Boolean(packageName && nodeName));
        }
    }, [mode, packageName, nodeName]);

    const handleExport = () => {
        if (!isReady) return;
        onExport({
            mode,
            packageName: packageName.trim(),
            nodeName: nodeName.trim(),
            description: description.trim()
        });
        onClose();
    };

    return (
        <Modal show={show} onHide={onClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Export workflow</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Label>Export type</Form.Label>
                        <div className="d-flex gap-4">
                            <Form.Check
                                type="radio"
                                id="export-workspace"
                                label="Workspace"
                                checked={mode === "workspace"}
                                onChange={() => setMode("workspace")}
                            />
                            <Form.Check
                                type="radio"
                                id="export-composite"
                                label="Composite"
                                checked={mode === "composite"}
                                onChange={() => setMode("composite")}
                            />
                        </div>
                    </Form.Group>

                    {mode === "composite" && (
                        <>
                            <Form.Group className="mb-3">
                                <Form.Label>Package name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={packageName}
                                    onChange={(e) => setPackageName(e.target.value)}
                                    placeholder="local_packages"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Composite name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={nodeName}
                                    onChange={(e) => setNodeName(e.target.value)}
                                    placeholder="composite_1"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={2}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Optional description"
                                />
                            </Form.Group>
                        </>
                    )}
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleExport} disabled={!isReady}>
                    {isReady ? <FiDownload /> : <FiCheck />} Export
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
