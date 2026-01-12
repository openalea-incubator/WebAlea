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
    addEdge: jest.fn((params, edges) => [
        ...edges,
        { id: 'e1', ...params }
    ])
}));

jest.mock(
    '../../../../../src/features/logger/providers/LogContextDefinition.jsx',
    () => ({
        useLog: () => ({
            addLog: jest.fn()
        })
    })
);

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

/**
 * FlowContext.test.jsx
 */

import { render, screen, renderHook, act } from '@testing-library/react';
import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { FlowProvider } from '../../../../../src/features/workspace/providers/FlowContext.jsx';
import { useFlow } from '../../../../../src/features/workspace/providers/FlowContextDefinition.jsx';
import { useNodesState, useEdgesState } from '@xyflow/react';

/* =========================================================
    HELPERS
   ========================================================= */

const wrapper = ({ children }) => (
    <FlowProvider>{children}</FlowProvider>
);

const createSetStateMock = (initial = []) =>
    jest.fn((updater) =>
        typeof updater === 'function' ? updater(initial) : updater
    );

/* =========================================================
    TESTS
   ========================================================= */

describe('FlowProvider', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();

        useNodesState.mockReturnValue([
            [],
            createSetStateMock([]),
            jest.fn()
        ]);

        useEdgesState.mockReturnValue([
            [],
            createSetStateMock([]),
            jest.fn()
        ]);
    });

    /* ----------------------------------------------------- */

    test('renders children', () => {
        render(
            <FlowProvider>
                <div>Flow OK</div>
            </FlowProvider>
        );

        expect(screen.getByText('Flow OK')).toBeInTheDocument();
    });

    /* ----------------------------------------------------- */

    test('exposes flow context', () => {
        const { result } = renderHook(() => useFlow(), { wrapper });

        expect(result.current.nodes).toEqual([]);
        expect(result.current.edges).toEqual([]);
        expect(result.current.executionStatus).toBe('idle');
        expect(typeof result.current.addNode).toBe('function');
    });

    /* ----------------------------------------------------- */

    test('addNode adds a serialized node', () => {
        const setNodesMock = createSetStateMock([]);

        useNodesState.mockReturnValue([[], setNodesMock, jest.fn()]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        const node = {
            id: 'n1',
            title: 'Node 1',
            inputs: [],
            outputs: [],
            serialize: jest.fn().mockReturnValue({
                id: 'n1',
                data: { label: 'Node 1' }
            })
        };

        act(() => {
            result.current.addNode(node);
        });

        expect(node.serialize).toHaveBeenCalled();
        expect(setNodesMock).toHaveBeenCalled();

        const updated = setNodesMock.mock.calls[0][0]([]);
        expect(updated).toHaveLength(1);
    });

    /* ----------------------------------------------------- */

    test('setNodesAndEdges sets both', () => {
        const setNodesMock = jest.fn();
        const setEdgesMock = jest.fn();

        useNodesState.mockReturnValue([[], setNodesMock, jest.fn()]);
        useEdgesState.mockReturnValue([[], setEdgesMock, jest.fn()]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.setNodesAndEdges(
                [{ id: 'n1' }],
                [{ source: 'n1', target: 'n2' }]
            );
        });

        expect(setNodesMock).toHaveBeenCalledWith([{ id: 'n1' }]);
        expect(setEdgesMock).toHaveBeenCalledWith([{ source: 'n1', target: 'n2' }]);
    });

    /* ----------------------------------------------------- */

    test('updateNode updates node data', () => {
        const initial = [{ id: 'n1', data: { label: 'Old' } }];
        const setNodesMock = createSetStateMock(initial);

        useNodesState.mockReturnValue([initial, setNodesMock, jest.fn()]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.updateNode('n1', { label: 'New' });
        });

        const updated = setNodesMock.mock.calls[0][0](initial);
        expect(updated[0].data.label).toBe('New');
    });

    /* ----------------------------------------------------- */

    test('deleteNode removes node and related edges', () => {
        const nodes = [{ id: 'n1' }, { id: 'n2' }];
        const edges = [{ source: 'n1', target: 'n2' }];

        const setNodesMock = createSetStateMock(nodes);
        const setEdgesMock = createSetStateMock(edges);

        useNodesState.mockReturnValue([nodes, setNodesMock, jest.fn()]);
        useEdgesState.mockReturnValue([edges, setEdgesMock, jest.fn()]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.deleteNode('n1');
        });

        expect(setNodesMock.mock.calls[0][0](nodes)).toEqual([{ id: 'n2' }]);
        expect(setEdgesMock.mock.calls[0][0](edges)).toEqual([]);
    });

    /* ----------------------------------------------------- */

    test('resetAllNodesStatus sets same status on all nodes', () => {
        const nodes = [
            { id: 'n1', data: { status: 'done' } },
            { id: 'n2', data: { status: 'error' } }
        ];

        const setNodesMock = createSetStateMock(nodes);
        useNodesState.mockReturnValue([nodes, setNodesMock, jest.fn()]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.resetAllNodesStatus('queued');
        });

        const updated = setNodesMock.mock.calls[0][0](nodes);

        updated.forEach(n =>
            expect(n.data.status).toBe('queued')
        );
    });

    /* ----------------------------------------------------- */

    test('onConnect adds edge if compatible', () => {
        const nodes = [
            {
                id: 'n1',
                data: { outputs: [{ id: 'o1', type: 'any' }] }
            },
            {
                id: 'n2',
                data: { inputs: [{ id: 'i1', type: 'any' }] }
            }
        ];

        const setEdgesMock = createSetStateMock([]);
        useNodesState.mockReturnValue([nodes, jest.fn(), jest.fn()]);
        useEdgesState.mockReturnValue([[], setEdgesMock, jest.fn()]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.onConnect({
                source: 'n1',
                sourceHandle: 'o1',
                target: 'n2',
                targetHandle: 'i1'
            });
        });

        const edges = setEdgesMock.mock.calls[0][0]([]);
        expect(edges).toHaveLength(1);
    });

    test('onConnect does nothing when source === target', () => {
        const setEdgesMock = jest.fn();
        useEdgesState.mockReturnValue([[], setEdgesMock, jest.fn()]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.onConnect({
                source: 'n1',
                target: 'n1'
            });
        });

        expect(setEdgesMock).not.toHaveBeenCalled();
    });

    test('onConnect refuses incompatible types', () => {
        const nodes = [
            { id: 'n1', data: { outputs: [{ id: 'o1', type: 'number' }] } },
            { id: 'n2', data: { inputs: [{ id: 'i1', type: 'string' }] } }
        ];

        const setEdgesMock = jest.fn();
        useNodesState.mockReturnValue([nodes, jest.fn(), jest.fn()]);
        useEdgesState.mockReturnValue([[], setEdgesMock, jest.fn()]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.onConnect({
                source: 'n1',
                sourceHandle: 'o1',
                target: 'n2',
                targetHandle: 'i1'
            });
        });

        expect(setEdgesMock).not.toHaveBeenCalled();
    });



    /* ----------------------------------------------------- */

    test('onNodeClick sets currentNode', () => {
        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.onNodeClick(null, {
                id: 'n1',
                data: { label: 'Node 1' },
                type: 'custom'
            });
        });

        expect(result.current.currentNode).toBe('n1');
    });

    /* ----------------------------------------------------- */

    test('executeWorkflow binds model and starts engine', async () => {
        const { result } = renderHook(() => useFlow(), { wrapper });

        let execResult;
        await act(async () => {
            execResult = await result.current.executeWorkflow();
        });

        expect(result.current.engine.bindModel).toHaveBeenCalled();
        expect(result.current.engine.start).toHaveBeenCalled();
        expect(execResult).toBe(true);
    });

    test('stopWorkflow stops engine', () => {
        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.stopWorkflow();
        });

        expect(result.current.engine.stop).toHaveBeenCalled();
    });

    test('onNodeExecute executes node manually', () => {
        const nodes = [{
            id: 'n1',
            type: 'custom',
            data: { inputs: [], outputs: [] }
        }];

        useNodesState.mockReturnValue([nodes, jest.fn(), jest.fn()]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.onNodeExecute('n1');
        });

        expect(result.current.engine.executeNodeManual).toHaveBeenCalled();
    });

    test('onNodeExecute does nothing if node does not exist', () => {
        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.onNodeExecute('unknown');
        });

        expect(result.current.engine.executeNodeManual).not.toHaveBeenCalled();
    });

    test('updateNodeStatus updates node status', () => {
        const nodes = [{ id: 'n1', data: { status: 'ready' } }];
        const setNodesMock = createSetStateMock(nodes);

        useNodesState.mockReturnValue([nodes, setNodesMock, jest.fn()]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.updateNodeStatus('n1', 'running');
        });

        const updated = setNodesMock.mock.calls[0][0](nodes);
        expect(updated[0].data.status).toBe('running');
    });

    test('updateNodeOutputs updates first output when scalar result', () => {
        const nodes = [{
            id: 'n1',
            data: { outputs: [{ id: 'o1', value: null }] }
        }];

        const setNodesMock = createSetStateMock(nodes);
        useNodesState.mockReturnValue([nodes, setNodesMock, jest.fn()]);

        const { result } = renderHook(() => useFlow(), { wrapper });

        act(() => {
            result.current.updateNodeOutputs('n1', 42);
        });

        const updated = setNodesMock.mock.calls[0][0](nodes);
        expect(updated[0].data.outputs[0].value).toBe(42);
    });

    /* ----------------------------------------------------- */

    test('nodes and edges are saved to localStorage', () => {
        const nodes = [{ id: 'n1' }];
        const edges = [{ source: 'n1', target: 'n2' }];

        useNodesState.mockReturnValue([nodes, jest.fn(), jest.fn()]);
        useEdgesState.mockReturnValue([edges, jest.fn(), jest.fn()]);

        render(<FlowProvider><div /></FlowProvider>);

        expect(localStorage.getItem('reactFlowCacheNodes')).toBe(JSON.stringify(nodes));
        expect(localStorage.getItem('reactFlowCacheEdges')).toBe(JSON.stringify(edges));
    });


});
