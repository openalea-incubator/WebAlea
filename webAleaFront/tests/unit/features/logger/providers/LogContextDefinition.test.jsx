import { renderHook } from '@testing-library/react';
import { useLog, LogContext } from '../../../../../src/features/logger/providers/LogContextDefinition.jsx';

describe('useLog', () => {

    test('should throw an error if used outside of LogProvider', () => {
        // Expect an error to be thrown
        expect(() => {
            renderHook(() => useLog());
        }).toThrow('useLog must be used within a LogProvider');
    });

    test('should return the context when used within LogProvider', () => {
        const mockContext = { logs: [], addLog: jest.fn() };

        const wrapper = ({ children }) => (
            <LogContext.Provider value={mockContext}>
                {children}
            </LogContext.Provider>
        );

        const { result } = renderHook(() => useLog(), { wrapper });

        expect(result.current).toEqual(mockContext);
    });
});
