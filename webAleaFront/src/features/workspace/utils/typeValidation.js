/**
 * typeValidation.js
 * 
 * Utilities for type validation and connection compatibility checking.
 */

import { DataType, TypeCompatibility } from '../constants/workflowConstants.js';

/**
 * Check if two types are compatible for connection
 * 
 * @param {string} outputType - Output type
 * @param {string} inputType - Input type
 * @returns {boolean} True if types are compatible
 */
export function areTypesCompatible(outputType, inputType) {
    return TypeCompatibility.areCompatible(
        outputType || DataType.ANY,
        inputType || DataType.ANY
    );
}

/**
 * Get default type value
 * 
 * @param {string} type - Data type
 * @returns {any} Default value for the type
 */
export function getDefaultTypeValue(type) {
    switch (type) {
        case DataType.FLOAT:
        case DataType.INT:
            return 0;
        case DataType.STRING:
            return '';
        case DataType.BOOLEAN:
            return false;
        case DataType.ARRAY:
            return [];
        case DataType.OBJECT:
            return {};
        default:
            return null;
    }
}
