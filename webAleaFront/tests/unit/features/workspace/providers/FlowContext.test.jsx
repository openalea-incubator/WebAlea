/**
 * FlowContext.test.jsx
 * Unit tests for the FlowProvider
 */

/* =========================================================
    MOCKS  (Always before imports)
   ========================================================= */

jest.mock('@xyflow/react', () => ({
    useNodesState: jest.fn(),
    useEdgesState: jest.fn(),
    addEdge: jest.fn()
}));

jest.mock(
    '../../../../../src/features/workspace/engine/WorkflowEngine.jsx',
    () => ({
        WorkflowEngine: jest.fn().mockImplementation(() => ({
            onUpdate: jest.fn(),
            bindModel: jest.fn(),
            start: jest.fn().mockResolvedValue(true),
            stop: jest.fn(),
            executeNodeManual: jest.fn(),
            listeners: []
        })),
        NodeState: {
            PENDING: 'PENDING',
            READY: 'READY',
            RUNNING: 'RUNNING',
            COMPLETED: 'COMPLETED',
            ERROR: 'ERROR',
            SKIPPED: 'SKIPPED',
            CANCELLED: 'CANCELLED'
        }
    })
);

/* =========================================================
    IMPORTS
   ========================================================= */

import { render, screen, renderHook, act } from '@testing-library/react';
import { describe, test, expect, beforeEach } from '@jest/globals';
import { useFlow } from '../../../../../src/features/workspace/providers/FlowContextDefinition.jsx';
import { FlowProvider } from '../../../../../src/features/workspace/providers/FlowContext.jsx';
import { LogProvider } from '../../../../../src/features/logger/providers/LogContext.jsx';
import { useNodesState, useEdgesState } from '@xyflow/react';
import { stat } from 'fs';

/* =========================================================
    TESTS
   ========================================================= */

describe('FlowProvider', () => {

    let setNodesMock;

    const wrapper = ({ children }) => (
        <LogProvider>
            <FlowProvider>
                {children}
            </FlowProvider>
        </LogProvider>
    );

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();

        setNodesMock = jest.fn();

        useNodesState.mockReturnValue([
            [],            // nodes
            setNodesMock,  // setNodes
            jest.fn()      // onNodesChange
        ]);

        useEdgesState.mockReturnValue([
            [],            // edges
            jest.fn(),     // setEdges
            jest.fn()      // onEdgesChange
        ]);
    });

    /* ----------------------------------------------------- */

    test('should render children correctly', () => {
        render(
            <LogProvider>
                <FlowProvider>
                    <div>Test Content</div>
                </FlowProvider>
            </LogProvider>
        );

        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    /* ----------------------------------------------------- */

    test('should expose flow context', () => {
        const { result } = renderHook(() => useFlow(), { wrapper });

        expect(result.current).toBeDefined();
        expect(result.current.nodes).toEqual([]);
        expect(result.current.edges).toEqual([]);
        expect(typeof result.current.addNode).toBe('function');
    });

    /* ----------------------------------------------------- */

    test('should add a node', () => {
        const setNodesMock = jest.fn((updater) => {
            // exécution manuelle du setState
            const nextState = updater([]);
            return nextState;
        });

        useNodesState.mockReturnValue([
            [],
            setNodesMock,
            jest.fn()
        ]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        const fakeNode = {
            id: 'node-1',
            title: 'Node 1',
            inputs: [],
            outputs: [],
            serialize: jest.fn().mockReturnValue({
                id: 'node-1',
                type: 'custom',
                data: { label: 'Node 1' }
            })
        };

        act(() => {
            result.current.addNode(fakeNode);
        });

        expect(fakeNode.serialize).toHaveBeenCalledTimes(1);
        expect(setNodesMock).toHaveBeenCalledTimes(1);
    });

    /* ----------------------------------------------------- */

    test('should initialize execution state correctly', () => {
        const { result } = renderHook(() => useFlow(), { wrapper });

        expect(result.current.executionStatus).toBe('idle');
        expect(result.current.executionProgress).toEqual({
            total: 0,
            completed: 0,
            failed: 0,
            percent: 0
        });
    });

    test('nodes functions', () => {
        // Mock setNodes, setEdges, addLog
        const setNodesMock = jest.fn(() => []);
        const setEdgesMock = jest.fn(() => []);

        // Remplacer useNodesState / useEdgesState et useLog
        useNodesState.mockReturnValue([[], setNodesMock, jest.fn()]);
        useEdgesState.mockReturnValue([[], setEdgesMock, jest.fn()]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        // --- Préparer des nodes et edges ---
        const nodes = [
            { id: 'n1', data: { label: 'Node1' } },
            { id: 'n2', data: { label: 'Node2' } }
        ];
        const edges = [
            { source: 'n1', target: 'n2' }
        ];

        // --- setNodesAndEdges ---
        act(() => {
            result.current.setNodesAndEdges(nodes, edges);
        });

        expect(setNodesMock).toHaveBeenCalledWith(nodes);
        expect(setEdgesMock).toHaveBeenCalledWith(edges);

        // --- updateNode ---
        const updatedProps = { label: 'Updated Node1' };
        act(() => {
            result.current.updateNode('n1', updatedProps);
        });

        expect(setNodesMock).toHaveBeenCalledTimes(2); // 1 précédente + 1 ici

        // --- deleteNode ---
        act(() => {
            result.current.deleteNode('n2');
        });

        expect(setNodesMock).toHaveBeenCalledTimes(3);
        expect(setEdgesMock).toHaveBeenCalledTimes(2); // 1 précédente + 1 ici

        // --- onNodeClick ---
        const node = { id: 'n1', type: 'custom', data: { label: 'Node1' } };
        act(() => {
            result.current.onNodeClick(null, node);
        });

        expect(result.current.currentNode).toBe('n1');
    });

    test('should reset all nodes status', () => {
        const setNodesMock = jest.fn((arg) => (typeof arg === 'function' ? arg([
            { id: 'n1', data: { label: 'Node1', status: 'COMPLETED' }},
            { id: 'n2', data: { label: 'Node2', status: 'ERROR' }}
        ]) : arg));

        useNodesState.mockReturnValue([
            [
                { id: 'n1', data: { label: 'Node1', status: 'COMPLETED', inputs: [], outputs: [] } },
                { id: 'n2', data: { label: 'Node2', status: 'ERROR', inputs: [], outputs: [] } }
            ],
            setNodesMock,
            jest.fn()
        ]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.resetAllNodesStatus('PENDING');
        });

        expect(setNodesMock).toHaveBeenCalledTimes(1);

        const updatedNodes = setNodesMock.mock.calls[0][0]([
            { id: 'n1', data: { label: 'Node1', status: 'COMPLETED' } },
            { id: 'n2', data: { label: 'Node2', status: 'ERROR' } }
        ]);

        expect(updatedNodes).toEqual([
            { id: 'n1', data: { label: 'Node1', status: 'PENDING' } },
            { id: 'n2', data: { label: 'Node2', status: 'PENDING' } }
        ]);
    });



});
