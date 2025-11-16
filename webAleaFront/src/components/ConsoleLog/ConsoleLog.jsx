import LogLine from "./LogLine";
import React, { useEffect, useRef } from "react";

export default function ConsoleLog() {

    const logs = [
    { header: "> API", value: "Request sent to /users" },
    { header: "> STATUS", value: "200 OK" },
    { header: "> DATA", value: "{ name: 'Axel', age: 20 }" },
    ];

    const containerRef = useRef(null);

        useEffect(() => {
            if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
        }, [logs]);

    return (
    <div className="container-fluid p-3 d-flex flex-column" style={{ height: '100%' }}>
    {/* Header fixe */}
    <h6 className="text-lg font-bold mb-2">Détails des opérations</h6>
    <hr className="border-top border-dark mb-2" />

        {/* Zone scrollable */}
        <div
        ref={containerRef}
        className="flex-fill overflow-auto"
        >
        {logs.map((log, i) => (
            <LogLine
            key={i}
            header={log.header}
            value={log.value}
            timestamp={log.timestamp}
            />
        ))}
        </div>
    </div>
);
}
