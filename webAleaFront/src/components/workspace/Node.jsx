/**
 * Classe utilitaire pour créer et sérialiser les objets Node de React Flow.
 * 
 * Chaque noeud peut avoir un ID, une position, un titre, une couleur, un statut et des métadonnées.
 * 
 * Exemple d'utilisation :
 *  const node = new Node({
 *   id: 'n1',
 *   position: { x: 100, y: 200 },
 *   title: 'Mon Nœud',
 *   color: '#ffcc00',
 *   status: 'ready',
 *  metadata: { info: 'Ceci est un nœud personnalisé' }
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
    constructor({ id, label, position = { x: 0, y: 0 }, color, status, metadata }) {
        this.id = id;
        this.position = position;
        this.data = {
            label: label || null,
            color: color || null,
            status: status || 'ready',
            metadata: metadata || {},
        };
    }
    
    /**
     * Sérialise l'instance du nœud en un objet JavaScript minimal.
     * @returns {object|null} L'objet nœud sérialisé.
     */
    serialize() {
        if (!this.id) return null; // Un nœud sans ID n'est pas valide
        
        const { id, position, data } = this;
        
        // Assure que les propriétés sont définies même si elles sont nulles
        return {
            id,
            type: 'custom',
            position: position ?? { x: 0, y: 0 },
            data: {
                label: data.label ?? null,
                color: data.color ?? null,
                status: data.status ?? 'ready',
                metadata: data.metadata ?? {},
            },
        };
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