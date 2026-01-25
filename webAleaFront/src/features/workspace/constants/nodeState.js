/**
 * NodeState.js
 * 
 * Centralized definition of node execution states.
 * This file provides a single source of truth for all node states used throughout the application.
 * 
 * States:
 * - PENDING: Waiting for dependencies to complete
 * - READY: Ready to execute (all dependencies met)
 * - RUNNING: Currently executing
 * - COMPLETED: Successfully completed
 * - ERROR: Execution failed
 * - SKIPPED: Skipped due to dependency failure
 * - CANCELLED: Cancelled by user
 */

export const NodeState = {
    PENDING: 'pending',
    READY: 'ready',
    RUNNING: 'running',
    COMPLETED: 'completed',
    ERROR: 'error',
    SKIPPED: 'skipped',
    CANCELLED: 'cancelled'
};

/**
 * Get the color associated with a node state for UI display
 * @param {string} state - Node state
 * @returns {string} Color hex code
 */
export function getNodeStateColor(state) {
    switch (state) {
        case NodeState.PENDING:
            return '#ff9800';  // Orange - waiting
        case NodeState.READY:
            return '#1976d2';  // Blue - ready/idle
        case NodeState.RUNNING:
            return '#8e24aa';  // Purple - currently executing
        case NodeState.COMPLETED:
            return '#2b8a3e';  // Green - completed successfully
        case NodeState.ERROR:
            return '#c62828';  // Red - failed
        case NodeState.SKIPPED:
            return '#6c757d';  // Gray - skipped
        case NodeState.CANCELLED:
            return '#999';     // Gray - cancelled
        default:
            return '#999';     // Gray - unknown
    }
}

/**
 * Get the color for progress bar based on execution status
 * @param {string} status - Execution status
 * @returns {string} Color hex code
 */
export function getProgressBarColor(status) {
    switch (status) {
        case NodeState.RUNNING:
            return '#007bff';
        case NodeState.COMPLETED:
            return '#28a745';
        case NodeState.ERROR:
            return '#dc3545';
        case 'stopped':
            return '#6c757d';
        default:
            return '#007bff';
    }
}

/**
 * Get a human-readable label for a node state
 * @param {string} state - Node state
 * @returns {string} Human-readable label
 */
export function getNodeStateLabel(state) {
    switch (state) {
        case NodeState.PENDING:
            return 'Pending';
        case NodeState.READY:
            return 'Ready';
        case NodeState.RUNNING:
            return 'Running';
        case NodeState.COMPLETED:
            return 'Completed';
        case NodeState.ERROR:
            return 'Error';
        case NodeState.SKIPPED:
            return 'Skipped';
        case NodeState.CANCELLED:
            return 'Cancelled';
        default:
            return 'Unknown';
    }
}
