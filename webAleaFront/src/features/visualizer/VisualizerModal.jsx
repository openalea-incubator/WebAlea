import React, { useEffect, useRef } from "react";
import { Modal, Button } from "react-bootstrap";
import { buildSceneFromJSON } from "./SceneBuilder";
import "../../assets/css/modal.css";

export default function VisualizerModal({ show, onClose, sceneJSON }) {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);

    useEffect(() => {
        if (!show || !sceneJSON || !mountRef.current) return;

        if (sceneRef.current?.dispose) {
            sceneRef.current.dispose();
        }

        const built = buildSceneFromJSON(sceneJSON, mountRef);
        sceneRef.current = built ?? null;

        return () => {
            if (sceneRef.current?.dispose) {
                sceneRef.current.dispose();
            }
            sceneRef.current = null;
        };
    }, [show, sceneJSON]);

    useEffect(() => {
        if (!show && sceneRef.current?.dispose) {
            sceneRef.current.dispose();
            sceneRef.current = null;
        }
    }, [show]);

    return (
        <Modal show={show} onHide={onClose} centered size="xl">
            <Modal.Header closeButton>
                <Modal.Title>3D Viewer</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div
                    ref={mountRef}
                    style={{
                        width: "100%",
                        height: "70vh",
                        background: "#f3f3f3",
                        borderRadius: "6px"
                    }}
                />
                {!sceneJSON && (
                    <div className="text-muted small mt-2">
                        No scene loaded yet. Click "Launch Render" first.
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
