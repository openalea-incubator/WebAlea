/**
 * Classe utilitaire pour créer et sérialiser les objets Node de React Flow.
 * 
 * Chaque noeud peut avoir un ID, une position, un titre, une couleur, un statut et des métadonnées.
 * 
 * Exemple d'utilisation :
 *  const node = new Node({
 *   id: 'n1',
 *   position: { x: 100, y: 200 },
 * });
 * 
 * const serializedNode = node.serialize();
 * const jsonString = node.serializeToJSON();
 * 
 */
export class Node {
    
    /**
     * Crée un objet nœud React Flow.
     * @param {object} props - Les propriétés du nœud.
     */
    constructor({ id, label, type = "custom", position = { x: 0, y: 0 }, data, inputs, outputs }) {
        this.id = id;
        this.type = type;
        this.position = position;
        this.type = type;
        this.data = {
            label: label || null,
            color: data?.color || null,
            status: data?.status || 'ready',
            metadata: data?.metadata || {},
            inputs: inputs || [],
            outputs: outputs || [],
            endpoint: data?.endpoint || null,
        };
    }

    /**
     * Sérialise l'instance du nœud en un objet JavaScript minimal.
     * @returns {object|null} L'objet nœud sérialisé.
     */
    serialize() {
        if (!this.id) return null;
        
        const { id, position, type, data } = this;
        return {
            id,
            type: type,
            position: position ?? { x: 0, y: 0 },
            data: {
                label: data.label ?? null,
                color: data.color ?? null,
                status: data.status ?? 'ready',
                metadata: data.metadata ?? {},
                inputs: data.inputs ?? [],
                outputs: data.outputs ?? [],
                endpoint: data.endpoint ?? null,
            },
        };
    }

    serializeData(entries = []) {
        if (entries.length === 0) {
            return entries;
        };
        // TODO
    }


    /**
     * Sérialise l'instance du nœud en une chaîne JSON.
     * @param {number} spacing - Espacement pour l'indentation JSON.
     * @returns {string|null} La chaîne JSON ou null.
     */
    serializeToJSON(spacing = 2) {
        const obj = this.serialize();
        return obj ? JSON.stringify(obj, null, spacing) : null;
    }

}