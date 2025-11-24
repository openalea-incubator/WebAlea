import { useEffect, useRef } from "react";
import { useLog } from "../../providers/LogContextDefinition.jsx";
import LogLine from "./LogLine.jsx";

export default function ConsoleLog() {

const { logs } = useLog();
const containerRef = useRef(null);

useEffect(() => {
    if (containerRef.current) {
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
}, [logs]);

return (
    <div className="container-fluid p-3 d-flex flex-column" style={{ height: '100%' }}>
    <h6 className="text-lg font-bold mb-2">Détails des opérations</h6>
    <hr className="border-top border-dark mb-2" />

    <div ref={containerRef} className="flex-fill overflow-auto">
        {logs.map((log, i) => (
        <LogLine key={i} header={log.header} value={log.value} />
        ))}
    </div>
    </div>
);
}
