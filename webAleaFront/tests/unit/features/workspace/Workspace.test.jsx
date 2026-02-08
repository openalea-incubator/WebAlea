import React from 'react';
import { render, screen } from '@testing-library/react';
import WorkSpace from '../../../../src/features/workspace/Workspace';
import { useFlow } from '../../../../src/features/workspace/providers/FlowContextDefinition.jsx';
import { describe, test, expect, beforeEach } from '@jest/globals';

/* ========================
    Mocks
======================== */

// Mock React Flow components
jest.mock('@xyflow/react', () => ({
    ReactFlow: ({ children }) => <div data-testid="reactflow">{children}</div>,
    Background: () => <div data-testid="background" />,
    Controls: () => <div data-testid="controls" />,
    MiniMap: () => <div data-testid="minimap" />
}));

// Mock useFlow hook
jest.mock('../../../../src/features/workspace/providers/FlowContextDefinition.jsx', () => ({
    useFlow: jest.fn()
}));

/* ========================
    Tests
======================== */

describe('WorkSpace Component', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders ReactFlow container', () => {
        useFlow.mockReturnValue({
            nodes: [],
            edges: [],
            onNodesChange: jest.fn(),
            onEdgesChange: jest.fn(),
            onConnect: jest.fn(),
            nodesTypes: {},
            onNodeClick: jest.fn()
        });

        render(<WorkSpace />);

        expect(screen.getByTestId('reactflow')).toBeInTheDocument();
        expect(screen.getByTestId('background')).toBeInTheDocument();
        expect(screen.getByTestId('controls')).toBeInTheDocument();
        expect(screen.queryByTestId('minimap')).not.toBeInTheDocument();
    });

    test('passes nodes and edges to ReactFlow', () => {
        const nodes = [{ id: 'n1', data: { label: 'Node 1' }, position: { x: 0, y: 0 } }];
        const edges = [{ id: 'e1', source: 'n1', target: 'n2' }];

        useFlow.mockReturnValue({
            nodes,
            edges,
            onNodesChange: jest.fn(),
            onEdgesChange: jest.fn(),
            onConnect: jest.fn(),
            nodesTypes: {},
            onNodeClick: jest.fn()
        });

        render(<WorkSpace />);

        const container = screen.getByTestId('reactflow');
        expect(container).toBeInTheDocument();
    });

    });
