import React from 'react';
import { render, screen } from '@testing-library/react';
import {ProgressBar, StatusIndicator} from '../../../../../src/features/toolbar/ui/ToolBar.jsx';
import {describe, test, expect} from "@jest/globals";

// Define test id for StatusIndicator
jest.mock('react-icons/fa', () => ({
    FaSpinner: () => <span data-testid="spinner-icon">Spinner</span>,
    FaCheckCircle: () => <span data-testid="check-icon">Check</span>,
    FaExclamationTriangle: () => <span data-testid="warning-icon">Warning</span>,
    FaStop: () => <span data-testid="stop-icon">Stop</span>
}));


describe('ToolBar', () => {
    describe('ProgressBar', () => {
        test('should render nothing when status is idle', () => {
            const progress = { completed: 0, total: 10, failed: 0, percent: 0 };
            const { container } = render(<ProgressBar progress={progress} status="idle" />);

            expect(container.firstChild).toBeNull();
        });

        test('should display the progress bar with correct values', () => {
            const progress = { completed: 5, total: 10, failed: 0, percent: 50 };

            render(<ProgressBar progress={progress} status="running" />);

            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toBeInTheDocument();
            expect(progressBar).toHaveStyle({ width: '50%' });
            expect(screen.getByText('5/10')).toBeInTheDocument();
        });

        test('should display a green bar for "completed" status', () => {
            const progress = { completed: 10, total: 10, failed: 0, percent: 100 };
            render(<ProgressBar progress={progress} status="completed" />);

            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toHaveStyle({ backgroundColor: '#28a745' }); // Green bar
        });

        test('should display a blue bar for "running" status', () => {
            const progress = { completed: 5, total: 10, failed: 0, percent: 50 };
            render(<ProgressBar progress={progress} status="running" />);

            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toHaveStyle({ backgroundColor: '#007bff' }); // Blue bar
        });

        test('should display a red bar for "failed" status', () => {
            const progress = { completed: 5, total: 10, failed: 2, percent: 50 };
            render(<ProgressBar progress={progress} status="failed" />);

            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toHaveStyle({ backgroundColor: '#dc3545' }); // Red bar
        });

        test('should display a gray bar for "stopped" status', () => {
            const progress = { completed: 5, total: 10, failed: 0, percent: 50 };
            render(<ProgressBar progress={progress} status="stopped" />);

            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toHaveStyle({ backgroundColor: '#6c757d' }); // Gray bar
        });

        test('should display a blue bar by default for unknown status', () => {
            const progress = { completed: 5, total: 10, failed: 0, percent: 50 };
            render(<ProgressBar progress={progress} status="unknown" />);

            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toHaveStyle({ backgroundColor: '#007bff' }); // Blue bar
        });

        test('should display number of errors when failed > 0', () => {
            const progress = { completed: 8, total: 10, failed: 3, percent: 80 };

            render(<ProgressBar progress={progress} status="running" />);

            expect(screen.getByText('8/10')).toBeInTheDocument();
            expect(screen.getByText('(3 err)')).toBeInTheDocument();
        });

        test('should not display errors when failed = 0', () => {
            const progress = { completed: 5, total: 10, failed: 0, percent: 50 };

            render(<ProgressBar progress={progress} status="running" />);

            expect(screen.getByText('5/10')).toBeInTheDocument();
            expect(screen.queryByText(/err/)).not.toBeInTheDocument();
        });
    });

    describe('StatusIndicator', () => {
        test('should render nothing when status is idle', () => {
            const { container } = render(<StatusIndicator status="idle" />);

            expect(container.firstChild).toBeNull();
        });

        test('should display spinner icon and text for running status', () => {
            render(<StatusIndicator status="running" />);

            expect(screen.getByTestId('spinner-icon')).toBeInTheDocument();
            expect(screen.getByText('Running...')).toBeInTheDocument();
        });

        test('should display check icon and text for completed status', () => {
            render(<StatusIndicator status="completed" />);

            expect(screen.getByTestId('check-icon')).toBeInTheDocument();
            expect(screen.getByText('Completed')).toBeInTheDocument();
        });

        test('should display warning icon and text for failed status', () => {
            render(<StatusIndicator status="failed" />);

            expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
            expect(screen.getByText('Error')).toBeInTheDocument();
        });

        test('should display warning icon and text for validation-error status', () => {
            render(<StatusIndicator status="validation-error" />);

            expect(screen.getByTestId('warning-icon')).toBeInTheDocument();
            expect(screen.getByText('Validation failed')).toBeInTheDocument();
        });

        test('should display stop icon and text for stopped status', () => {
            render(<StatusIndicator status="stopped" />);

            expect(screen.getByTestId('stop-icon')).toBeInTheDocument();
            expect(screen.getByText('Stopped')).toBeInTheDocument();
        });

        test('should display no icon for unknown status', () => {
            const { container } = render(<StatusIndicator status="unknown" />);

            expect(screen.queryByTestId('spinner-icon')).not.toBeInTheDocument();
            expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
            expect(screen.queryByTestId('warning-icon')).not.toBeInTheDocument();
            expect(screen.queryByTestId('stop-icon')).not.toBeInTheDocument();

            // No text for unknown status
            const smallElement = container.querySelector('small.text-muted');
            expect(smallElement).toBeInTheDocument();
            expect(smallElement.textContent).toBe('');
        });
    })
});