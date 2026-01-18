import { renderHook } from '@testing-library/react';
import { useFlow, FlowContext } from '../../../../../src/features/workspace/providers/FlowContextDefinition.jsx';
import {describe, test, expect} from "@jest/globals";

/* ========================================================= */
/* TESTS */
/* ========================================================= */

describe('FlowContextDefinition Units Tests', () => {

    test('should throw an error if used outside of FlowProvider', () => {
        // Expect an error to be thrown
        expect(() => {
            renderHook(() => useFlow());
        }).toThrow('useFlow must be used within a FlowContextProvider');
    });

    test('should return the context when used within FlowContextProvider', () => {
        const mockContext = { logs: [], addLog: jest.fn() };

        const wrapper = ({ children }) => (
            <FlowContext.Provider value={mockContext}>
                {children}
            </FlowContext.Provider>
        );

        const { result } = renderHook(() => useFlow(), { wrapper });

        expect(result.current).toEqual(mockContext);
    });
});
