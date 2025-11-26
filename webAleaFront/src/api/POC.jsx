// use to import functions in other files
// import {getNodes, executeNodes} from "../api/POC.jsx";

export async function getNodes() {
    try {
        console.log("fetch lancé");

        const res = await fetch("http://localhost:8000/api/v1/manager/poc/get_node");
        const data = await res.json();

        console.log("Réponse API :", data);
        return data;
    } catch (err) {
        console.error(err);
    }
}

export async function executeNodes(name, parameters1, parameters2) {
    try {
        console.log("fetch lancé");

        const res = await fetch(
            "http://localhost:8000/api/v1/manager/poc/execute_nodes",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name_node: name,
                    parameters :
                        {parameters1: parameters1, parameters2: parameters2}
                }),
            }
        );

        if (!res.ok) {
            throw new Error(`Erreur HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log("Réponse API :", data);
        return data;
    } catch (err) {
        console.error(err);
    }
}

// getNodes();
// executeNodes("concatenate", "Hello, ", "World!");
// executeNodes("addition", 5, 10);
// executeNodes("subtract", 15, 7);