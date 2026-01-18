import { render, screen, renderHook, act } from '@testing-library/react';
import LogProvider from '../../../../../src/features/logger/providers/LogContext.jsx';
import { useLog } from '../../../../../src/features/logger/providers/LogContextDefinition.jsx';
import { describe, test, expect, beforeEach } from "@jest/globals";

describe('LogProvider Units Tests', () => {

    // Function to wrap the hook with the LogProvider
    const wrapper = ({ children }) => <LogProvider>{children}</LogProvider>;

    let hookResult;

    // Initialisation of the hook before each test
    beforeEach(() => {
        const { result } = renderHook(() => useLog(), { wrapper });
        hookResult = result;
    });

    test('should render children correctly', () => {
        render(
            <LogProvider>
                <div>Test Content</div>
            </LogProvider>
        );
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('should initialize with an empty logs array', () => {
        expect(hookResult.current.logs).toEqual([]);
    });

    test('should provide an addLog function', () => {
        expect(typeof hookResult.current.addLog).toBe('function');
    });

    test('should add a log with a timestamp', () => {
        act(() => {
            hookResult.current.addLog('Test Header', 'Test Value');
        });

        expect(hookResult.current.logs).toHaveLength(1);
        expect(hookResult.current.logs[0]).toMatchObject({
            header: 'Test Header',
            value: 'Test Value'
        });
        expect(hookResult.current.logs[0].timestamp).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    test('should add multiple logs in order', () => {
        act(() => {
            hookResult.current.addLog('Header 1', 'Value 1');
            hookResult.current.addLog('Header 2', 'Value 2');
            hookResult.current.addLog('Header 3', 'Value 3');
        });

        expect(hookResult.current.logs).toHaveLength(3);
        expect(hookResult.current.logs[0].header).toBe('Header 1');
        expect(hookResult.current.logs[1].header).toBe('Header 2');
        expect(hookResult.current.logs[2].header).toBe('Header 3');
    });

    test('should preserve existing logs when adding a new one', () => {
        act(() => {
            hookResult.current.addLog('First', 'Value 1');
        });

        const firstLog = hookResult.current.logs[0];

        act(() => {
            hookResult.current.addLog('Second', 'Value 2');
        });

        expect(hookResult.current.logs[0]).toEqual(firstLog);
        expect(hookResult.current.logs).toHaveLength(2);
    });

    test('addLog should be stable between renders (useCallback)', () => {
        const { result, rerender } = renderHook(() => useLog(), { wrapper });
        const firstAddLog = result.current.addLog;
        rerender();
        expect(result.current.addLog).toBe(firstAddLog);
    });

});
