/**
 * Utility functions and constants for workflow management
 */


/**
 * Enum for node execution states
 */
export const NodeState = {
    PENDING: 'pending',     // Waiting for dependencies
    READY: 'ready',         // Ready to run
    RUNNING: 'running',     // In execution
    COMPLETED: 'completed', // Successfully completed
    ERROR: 'error',         // Failed during execution
    SKIPPED: 'skipped',     // Skipped due to dependency failure
    CANCELLED: 'cancelled'  // Cancelled by user
};


export function getColorFromBar(status) {
    return () => {
        switch (status) {
            case NodeState.RUNNING : return '#007bff';
            case NodeState.COMPLETED: return '#28a745';
            case 'failed': return '#dc3545';
            case 'stopped': return '#6c757d';
            default: return '#007bff';
        }
    };
}