/**
 * useLocalStorage.js
 * 
 * Custom hook for localStorage with debounced persistence.
 * Prevents excessive writes to localStorage by debouncing save operations.
 */

import { useEffect, useRef } from 'react';

/**
 * Custom hook for localStorage with debounced persistence
 * 
 * @param {string} key - localStorage key
 * @param {any} value - Value to persist
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 500)
 */
export function useLocalStorage(key, value, debounceMs = 500) {
    const timeoutRef = useRef(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
        // Skip on initial mount to avoid overwriting with initial state
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout for debounced save
        timeoutRef.current = setTimeout(() => {
            try {
                if (value === null || value === undefined) {
                    localStorage.removeItem(key);
                } else {
                    const serialized = JSON.stringify(value);
                    localStorage.setItem(key, serialized);
                }
            } catch (error) {
                console.error(`Error saving to localStorage (${key}):`, error);
            }
        }, debounceMs);

        // Cleanup on unmount or value change
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [key, value, debounceMs]);
}

/**
 * Load value from localStorage
 * 
 * @param {string} key - localStorage key
 * @param {any} defaultValue - Default value if key doesn't exist
 * @returns {any} Parsed value or default
 */
export function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        if (item === null) {
            return defaultValue;
        }
        return JSON.parse(item);
    } catch (error) {
        console.error(`Error loading from localStorage (${key}):`, error);
        return defaultValue;
    }
}
