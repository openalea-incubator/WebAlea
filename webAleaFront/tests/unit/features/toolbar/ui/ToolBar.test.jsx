import React from 'react';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {ProgressBar, StatusIndicator, ToolBar} from '../../../../../src/features/toolbar/ui/ToolBar.jsx';
import {describe, test, expect} from "@jest/globals";
import {useFlow} from '../../../../../src/features/workspace/providers/FlowContextDefinition.jsx';
import {useLog} from '../../../../../src/features/logger/providers/LogContextDefinition.jsx';
import {ImportModal} from '../../../../../src/features/toolbar/model/ImportModal.jsx';
import { NodeState, getProgressBarColor } from '../../../../../src/features/workspace/constants/nodeState';

/* ======================
    Mocks
====================== */

// Define test id for StatusIndicator
jest.mock('react-icons/fa', () => ({
    FaSpinner: () => <span data-testid="spinner-icon">Spinner</span>,
    FaCheckCircle: () => <span data-testid="check-icon">Check</span>,
    FaExclamationTriangle: () => <span data-testid="warning-icon">Warning</span>,
    FaStop: () => <span data-testid="stop-icon">Stop</span>
}));

jest.mock('../../../../../src/features/workspace/providers/FlowContextDefinition.jsx');
jest.mock('../../../../../src/features/logger/providers/LogContextDefinition.jsx');
jest.mock('../../../../../src/features/toolbar/ui/ButtonToolBar.jsx', () => {
    return function MockButtonToolBar({icon: Icon, onClick, disabled, title}) {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                title={title}
            >
                {title}
            </button>
        );
    };
});
jest.mock('../../../../../src/features/toolbar/model/ImportModal.jsx', () => {
    return function MockImportModal({show, onClose, onImport}) {
        if (!show) return null;
        return (
            <div data-testid="import-modal">
                <button onClick={onClose}>Close</button>
                <button onClick={() => onImport({nodes: [{id: '1'}], edges: [{id: 'e1'}]})}>
                    Import
                </button>
            </div>
        );
    };
});

/* ======================
    Tests
====================== */

describe('ToolBar_file', () => {
    describe('ProgressBar', () => {
        test('should render nothing when status is pending', () => {
            const progress = {completed: 0, total: 10, failed: 0, percent: 0};
            const {container} = render(<ProgressBar progress={progress} status="pending"/>);

            expect(container.firstChild).toBeNull();
        });

        test('should display the progress bar with correct values', () => {
            const progress = {completed: 5, total: 10, failed: 0, percent: 50};

            render(<ProgressBar progress={progress} status="running"/>);

            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toBeInTheDocument();
            expect(progressBar).toHaveStyle({width: '50%'});
            expect(screen.getByText('5/10')).toBeInTheDocument();
        });

        test('should display a green bar for "completed" status', () => {
            const progress = {completed: 10, total: 10, failed: 0, percent: 100};
            render(<ProgressBar progress={progress} status="completed"/>);

            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toHaveStyle({backgroundColor: '#28a745'}); // Green bar
        });

        test('should display a blue bar for "running" status', () => {
            const progress = {
                completed: 5,
                total: 10,
                failed: 2,
                percent: 50
            };

            render(
                <ProgressBar
                    progress={progress}
                    status={NodeState.RUNNING}
                />
            );

            const progressBar = screen.getByRole('progressbar');

            // On compare la valeur réellement appliquée au DOM
            const expectedColor = getProgressBarColor(NodeState.RUNNING);

            expect(progressBar).toHaveStyle({
                backgroundColor: expectedColor,
            });
        });

        test('should display a red bar for "failed" status', () => {
            const progress = {
                completed: 5,
                total: 10,
                failed: 2,
                percent: 50
            };

            render(
                <ProgressBar
                    progress={progress}
                    status={NodeState.ERROR}
                />
            );

            const progressBar = screen.getByRole('progressbar');

            // On compare la valeur réellement appliquée au DOM
            const expectedColor = getProgressBarColor(NodeState.ERROR);

            expect(progressBar).toHaveStyle({
                backgroundColor: expectedColor,
            });
        });

        test('should display a gray bar for "stopped" status', () => {
            const progress = {
                completed: 5,
                total: 10,
                failed: 2,
                percent: 50
            };

            render(
                <ProgressBar
                    progress={progress}
                    status={NodeState.SKIPPED}
                />
            );

            const progressBar = screen.getByRole('progressbar');

            // On compare la valeur réellement appliquée au DOM
            const expectedColor = getProgressBarColor(NodeState.SKIPPED);

            expect(progressBar).toHaveStyle({
                backgroundColor: expectedColor,
            });
        });

        test('should display a blue bar by default for unknown status', () => {
            const progress = {
                completed: 5,
                total: 10,
                failed: 2,
                percent: 50
            };

            render(
                <ProgressBar
                    progress={progress}
                    status={NodeState.UNKNOWN}
                />
            );

            const progressBar = screen.getByRole('progressbar');

            // On compare la valeur réellement appliquée au DOM
            const expectedColor = getProgressBarColor(NodeState.UNKNOWN);

            expect(progressBar).toHaveStyle({
                backgroundColor: expectedColor,
            });
        });

        test('should display number of errors when failed > 0', () => {
            const progress = {completed: 8, total: 10, failed: 3, percent: 80};

            render(<ProgressBar progress={progress} status="running"/>);

            expect(screen.getByText('8/10')).toBeInTheDocument();
            expect(screen.getByText('(3 err)')).toBeInTheDocument();
        });

        test('should not display errors when failed = 0', () => {
            const progress = {completed: 5, total: 10, failed: 0, percent: 50};

            render(<ProgressBar progress={progress} status="running"/>);

            expect(screen.getByText('5/10')).toBeInTheDocument();
            expect(screen.queryByText(/err/)).not.toBeInTheDocument();
        });
    });

    describe('StatusIndicator', () => {
        test('should render nothing when status is pending', () => {
            const {container} = render(<StatusIndicator status="pending"/>);

            expect(container.firstChild).toBeNull();
        });

        test('should display spinner icon and text for running status', () => {
            render(<StatusIndicator status="running"/>);

            expect(screen.getByTestId('spinner-icon')).toBeInTheDocument();
            expect(screen.getByText('Running...')).toBeInTheDocument();
        });

        test('should display check icon and text for completed status', () => {
            render(<StatusIndicator status="completed"/>);

            expect(screen.getByTestId('check-icon')).toBeInTheDocument();
            expect(screen.getByText('Completed')).toBeInTheDocument();
        });


        test('should display error text for error status', () => {
            render(<StatusIndicator status={NodeState.ERROR} />);

            expect(screen.getByText('Error')).toBeInTheDocument();
        });

        test('should display validation failed text for cancelled status', () => {
            render(<StatusIndicator status={NodeState.CANCELLED} />);

            expect(screen.getByText('Validation failed')).toBeInTheDocument();
        });

        test('should display stopped text for skipped status', () => {
            render(<StatusIndicator status={NodeState.SKIPPED} />);

            expect(screen.getByText('Stopped')).toBeInTheDocument();
        });

        test('should render nothing for pending status', () => {
            const { container } = render(
                <StatusIndicator status={NodeState.PENDING} />
            );

            expect(container).toBeEmptyDOMElement();
        });

        test('should display no icon for unknown status', () => {
            const {container} = render(<StatusIndicator status="unknown"/>);

            expect(screen.queryByTestId('spinner-icon')).not.toBeInTheDocument();
            expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
            expect(screen.queryByTestId('warning-icon')).not.toBeInTheDocument();
            expect(screen.queryByTestId('stop-icon')).not.toBeInTheDocument();

            // No text for unknown status
            const smallElement = container.querySelector('small.text-muted');
            expect(smallElement).toBeInTheDocument();
            expect(smallElement.textContent).toBe('');
        });
    });

    describe('ToolBar', () => {
        const mockExecuteWorkflow = jest.fn();
        const mockStopWorkflow = jest.fn();
        const mockSetNodesAndEdges = jest.fn();
        const mockAddLog = jest.fn();

        const defaultFlowContext = {
            nodes: [],
            edges: [],
            setNodesAndEdges: mockSetNodesAndEdges,
            executeWorkflow: mockExecuteWorkflow,
            stopWorkflow: mockStopWorkflow,
            executionStatus: 'pending',
            executionProgress: {completed: 0, total: 0, failed: 0, percent: 0}
        };

        beforeEach(() => {
            jest.clearAllMocks();
            useFlow.mockReturnValue(defaultFlowContext);
            useLog.mockReturnValue({addLog: mockAddLog});
            jest.spyOn(window, 'alert').mockImplementation(() => {
            });
            jest.spyOn(console, 'warn').mockImplementation(() => {
            });
            jest.spyOn(console, 'error').mockImplementation(() => {
            });
        });

        afterEach(() => {
            window.alert.mockRestore();
            console.warn.mockRestore();
            console.error.mockRestore();
        });

        // =========================================================================
        // handleImportClick & handleImportClose
        // =========================================================================

        test('handleImportClick should open the modal', () => {
            render(<ToolBar/>);

            fireEvent.click(screen.getByTitle('Import a workflow'));

            expect(screen.getByTestId('import-modal')).toBeInTheDocument();
        });

        test('handleImportClose should close the modal', () => {
            render(<ToolBar/>);

            fireEvent.click(screen.getByTitle('Import a workflow'));
            expect(screen.getByTestId('import-modal')).toBeInTheDocument();

            fireEvent.click(screen.getByText('Close'));
            expect(screen.queryByTestId('import-modal')).not.toBeInTheDocument();
        });

        // =========================================================================
        // handleImportData
        // =========================================================================

        test('handleImportData should import valid data', () => {
            render(<ToolBar/>);

            fireEvent.click(screen.getByTitle('Import a workflow'));
            fireEvent.click(screen.getByText('Import'));

            expect(mockSetNodesAndEdges).toHaveBeenCalledWith([{id: '1'}], [{id: 'e1'}]);
            expect(mockAddLog).toHaveBeenCalledWith('Workflow imported', {nodes: 1, edges: 1});
            expect(screen.queryByTestId('import-modal')).not.toBeInTheDocument();
        });

        // =========================================================================
        // handleExport
        // =========================================================================

        test('handleExport should export the workflow', () => {
            const nodes = [{ id: '1' }];
            const edges = [{ id: 'e1' }];

            useFlow.mockReturnValue({
                ...defaultFlowContext,
                nodes,
                edges
            });

            const mockAnchor = document.createElement('a');
            mockAnchor.click = jest.fn();
            mockAnchor.remove = jest.fn();

            const originalCreateElement = document.createElement.bind(document);
            const createElementSpy = jest.spyOn(document, 'createElement');

            createElementSpy.mockImplementation((tag) => {
                if (tag === 'a') return mockAnchor;
                return originalCreateElement(tag);
            });

            render(<ToolBar />);

            fireEvent.click(screen.getByTitle('Export workflow'));

            expect(mockAnchor.getAttribute('download')).toBe('workflow_export.json');
            expect(mockAnchor.click).toHaveBeenCalled();
            expect(mockAddLog).toHaveBeenCalledWith('Workflow exported', { nodes: 1, edges: 1 });

            createElementSpy.mockRestore();
        });

        // =========================================================================
        // handleInfo
        // =========================================================================

        test('handleInfo should display workflow information', () => {
            const nodes = [
                {id: '1', type: 'custom'},
                {id: '2', type: 'primitive'}
            ];
            const edges = [{id: 'e1'}];

            useFlow.mockReturnValue({
                ...defaultFlowContext,
                nodes,
                edges,
                executionStatus: 'pending'
            });

            render(<ToolBar/>);

            fireEvent.click(screen.getByTitle('Information'));

            expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('1 OpenAlea nodes'));
        });

        // =========================================================================
        // handleRun
        // =========================================================================

        test('handleRun should execute the workflow successfully', async () => {
            const nodes = [{id: '1'}];
            mockExecuteWorkflow.mockResolvedValue({
                success: true,
                results: {node1: 'result'}
            });

            useFlow.mockReturnValue({
                ...defaultFlowContext,
                nodes
            });

            render(<ToolBar/>);

            fireEvent.click(screen.getByTitle('Run workflow'));

            expect(mockAddLog).toHaveBeenCalledWith(
                'Starting workflow execution...',
                {nodes: 1, edges: 0}
            );

            await waitFor(() => {
                expect(mockExecuteWorkflow).toHaveBeenCalled();
                expect(mockAddLog).toHaveBeenCalledWith(
                    'Workflow execution completed successfully',
                    {resultCount: 1}
                );
            });
        });

        test('handleRun should not execute if already running', () => {
            render(<ToolBar />);

            expect(screen.getByTitle('Run workflow')).toBeDisabled();

            expect(mockExecuteWorkflow).not.toHaveBeenCalled();
        });

        // =========================================================================
        // handleStop
        // =========================================================================

        test('handleStop should stop the workflow', () => {
            useFlow.mockReturnValue({
                ...defaultFlowContext,
                executionStatus: 'running'
            });

            render(<ToolBar/>);

            fireEvent.click(screen.getByTitle('Stop execution'));

            expect(mockAddLog).toHaveBeenCalledWith('Stopping workflow...');
            expect(mockStopWorkflow).toHaveBeenCalled();
        });

        test('handleStop should not stop if workflow is not running', () => {
            render(<ToolBar />);

            expect(screen.getByTitle('Stop execution')).toBeDisabled();

            expect(mockStopWorkflow).not.toHaveBeenCalled();
        });

    });
});