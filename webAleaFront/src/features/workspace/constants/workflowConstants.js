/**
 * workflowConstants.js
 * 
 * Centralized constants for workflow-related values.
 * Eliminates magic numbers and strings throughout the codebase.
 */

/**
 * Node types used in the workflow
 */
export const NodeType = {
    CUSTOM: 'custom',
    FLOAT: 'float',
    STRING: 'string',
    BOOLEAN: 'boolean',
    ARRAY: 'array'
};

/**
 * Data types for node inputs/outputs
 */
export const DataType = {
    ANY: 'any',
    FLOAT: 'float',
    STRING: 'string',
    BOOLEAN: 'boolean',
    INT: 'int',
    ENUM: 'enum',
    ARRAY: 'array',
    OBJECT: 'object',
    FILE: 'file',
    PATH: 'path',
    COLOR: 'color',
    FUNCTION: 'function',
    NONE: 'none'
};

/**
 * LocalStorage keys for persistence
 */
export const StorageKeys = {
    NODES: 'reactFlowCacheNodes',
    EDGES: 'reactFlowCacheEdges'
};

/**
 * Default values for primitive node types
 */
export const DefaultValues = {
    FLOAT: 0,
    STRING: '',
    BOOLEAN: false,
    ARRAY: []
};

/**
 * Workflow engine event names
 */
export const WorkflowEvents = {
    WORKFLOW_START: 'workflow-start',
    WORKFLOW_DONE: 'workflow-done',
    WORKFLOW_ERROR: 'workflow-error',
    WORKFLOW_STOPPED: 'workflow-stopped',
    NODE_STATE_CHANGE: 'node-state-change',
    NODE_START: 'node-start',
    NODE_RESULT: 'node-result',
    NODE_DONE: 'node-done',
    NODE_ERROR: 'node-error',
    NODE_SKIPPED: 'node-skipped',
    VALIDATION_ERROR: 'validation-error',
    VALIDATION_WARNINGS: 'validation-warnings'
};

/**
 * Debounce delay for localStorage persistence (in milliseconds)
 */
export const PERSISTENCE_DEBOUNCE_MS = 500;

/**
 * Index constants
 */
export const INDEX = {
    FIRST: 0,
    DEFAULT_OUTPUT: 0
};

/**
 * Type compatibility rules
 */
export const TypeCompatibility = {
    /**
     * Check if two types are compatible for connection
     * @param {string} outputType - Output type
     * @param {string} inputType - Input type
     * @returns {boolean} True if types are compatible
     */
    areCompatible: (outputType, inputType) => {
        return outputType === inputType ||
               outputType === DataType.ANY ||
               inputType === DataType.ANY;
    }
};
