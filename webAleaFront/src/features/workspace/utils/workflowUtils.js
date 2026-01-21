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


// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
