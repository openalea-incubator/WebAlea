import { render, screen, renderHook, act } from '@testing-library/react';
import { LogProvider } from '../../../../../src/features/logger/providers/LogContext.jsx';
import { useLog } from '../../../../../src/features/logger/providers/LogContextDefinition.jsx';
import {describe, test, expect} from "@jest/globals";

describe('LogProvider', () => {

    test('should render children correctly', () => {
        render(
            <LogProvider>
                <div>Test Content</div>
            </LogProvider>
        );
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('should initialize with an empty logs array', () => {
        const { result } = renderHook(() => useLog(), {
            wrapper: LogProvider
        });

        expect(result.current.logs).toEqual([]);
    });

    test('should provide an addLog function', () => {
        const { result } = renderHook(() => useLog(), {
            wrapper: LogProvider
        });

        expect(typeof result.current.addLog).toBe('function');
    });

    test('should add a log with a timestamp', () => {
        const { result } = renderHook(() => useLog(), {
            wrapper: LogProvider
        });

        act(() => {
            result.current.addLog('Test Header', 'Test Value');
        });

        expect(result.current.logs).toHaveLength(1);
        expect(result.current.logs[0]).toMatchObject({
            header: 'Test Header',
            value: 'Test Value'
        });
        expect(result.current.logs[0].timestamp).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    test('should add multiple logs in order', () => {
        const { result } = renderHook(() => useLog(), {
            wrapper: LogProvider
        });

        act(() => {
            result.current.addLog('Header 1', 'Value 1');
            result.current.addLog('Header 2', 'Value 2');
            result.current.addLog('Header 3', 'Value 3');
        });

        expect(result.current.logs).toHaveLength(3);
        expect(result.current.logs[0].header).toBe('Header 1');
        expect(result.current.logs[1].header).toBe('Header 2');
        expect(result.current.logs[2].header).toBe('Header 3');
    });

    test('should preserve existing logs when adding a new one', () => {
        const { result } = renderHook(() => useLog(), {
            wrapper: LogProvider
        });

        act(() => {
            result.current.addLog('First', 'Value 1');
        });

        const firstLog = result.current.logs[0];

        act(() => {
            result.current.addLog('Second', 'Value 2');
        });

        expect(result.current.logs[0]).toEqual(firstLog);
        expect(result.current.logs).toHaveLength(2);
    });

    test('addLog should be stable between renders (useCallback)', () => {
        const { result, rerender } = renderHook(() => useLog(), {
            wrapper: LogProvider
        });

        const firstAddLog = result.current.addLog;

        rerender();

        expect(result.current.addLog).toBe(firstAddLog);
    });
});
