import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportModal from '../../../../../src/features/toolbar/model/ImportModal.jsx';
import {describe, test, expect, beforeEach} from "@jest/globals";

/* ======================
    Mocks
====================== */

// Mock react-icons icons
jest.mock('react-icons/fi', () => ({
    FiUpload: () => <div data-testid="upload-icon">Upload</div>,
    FiCheck: () => <div data-testid="check-icon">Check</div>
}));

/* ======================
    Tests
====================== */

describe('ImportModal', () => {
    const mockOnClose = jest.fn();
    const mockOnImport = jest.fn();
    const defaultProps = {
        show: true,
        onClose: mockOnClose,
        onImport: mockOnImport
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should render the modal when show is true', () => {
        render(<ImportModal {...defaultProps} />);

        expect(screen.getByText('Import a workflow or composite')).toBeInTheDocument();
        expect(screen.getByText(/Drag and drop a JSON file here/i)).toBeInTheDocument();
    });

    test('should not render the modal when show is false', () => {
        render(<ImportModal {...defaultProps} show={false} />);

        expect(screen.queryByText('Import a workflow or composite')).not.toBeInTheDocument();
    });

    test('should display Cancel and Import buttons', () => {
        render(<ImportModal {...defaultProps} />);

        expect(screen.getByText('Cancel')).toBeInTheDocument();
        expect(screen.getByText('Import')).toBeInTheDocument();
    });

    test('Import button should be disabled initially', () => {
        render(<ImportModal {...defaultProps} />);

        const importButton = screen.getByText('Import');
        expect(importButton).toBeDisabled();
    });

    test('should call onClose when Cancel is clicked', () => {
        render(<ImportModal {...defaultProps} />);

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should display the Upload icon by default', () => {
        render(<ImportModal {...defaultProps} />);

        expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
    });

    test('should handle file change via input', async () => {
        render(<ImportModal {...defaultProps} />);

        const jsonData = { test: 'data' };
        const file = new File([JSON.stringify(jsonData)], 'test.json', {
            type: 'application/json'
        });

        const input = screen.getByTestId('file-input');

        await userEvent.upload(input, file);

        await waitFor(() => {
            expect(screen.getByTestId('check-icon')).toBeInTheDocument();
        });
    });

    test('should enable Import button after loading a valid file', async () => {
        render(<ImportModal {...defaultProps} />);

        const jsonData = { workflow: 'test' };
        const file = new File([JSON.stringify(jsonData)], 'workflow.json', {
            type: 'application/json'
        });

        const input = screen.getByTestId('file-input');
        await userEvent.upload(input, file);

        await waitFor(() => {
            const importButton = screen.getByText('Import');
            expect(importButton).not.toBeDisabled();
        });
    });

    test('should display an alert for an invalid JSON file', async () => {
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        render(<ImportModal {...defaultProps} />);

        const invalidFile = new File(['invalid json content'], 'invalid.json', {
            type: 'application/json'
        });

        const input = screen.getByTestId('file-input');
        await userEvent.upload(input, invalidFile);

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith(
                expect.stringContaining('Invalid JSON file')
            );
        });

        alertSpy.mockRestore();
    });

    test('should call onImport and onClose when clicking Import with data', async () => {
        render(<ImportModal {...defaultProps} />);

        const jsonData = { workflow: 'test data' };
        const file = new File([JSON.stringify(jsonData)], 'test.json', {
            type: 'application/json'
        });

        const input = screen.getByTestId('file-input');
        await userEvent.upload(input, file);

        await waitFor(() => {
            expect(screen.getByText('Import')).not.toBeDisabled();
        });

        const importButton = screen.getByText('Import');
        fireEvent.click(importButton);

        expect(mockOnImport).toHaveBeenCalledWith(jsonData);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should handle drag over', () => {
        render(<ImportModal {...defaultProps} />);

        const dropZone = screen.getByRole('button', { name: /drag and drop/i });

        fireEvent.dragOver(dropZone);

        expect(dropZone).toHaveClass('drag-over');
    });

    test('should handle drag leave', () => {
        render(<ImportModal {...defaultProps} />);

        const dropZone = screen.getByRole('button', { name: /drag and drop/i });

        fireEvent.dragOver(dropZone);
        expect(dropZone).toHaveClass('drag-over');

        fireEvent.dragLeave(dropZone);
        expect(dropZone).not.toHaveClass('drag-over');
    });

    test('should handle file drop', async () => {
        render(<ImportModal {...defaultProps} />);

        const jsonData = { dropped: 'file' };
        const file = new File([JSON.stringify(jsonData)], 'dropped.json', {
            type: 'application/json'
        });

        const dropZone = screen.getByRole('button', { name: /drag and drop/i });

        fireEvent.drop(dropZone, {
            dataTransfer: {
                files: [file]
            }
        });

        await waitFor(() => {
            expect(screen.getByTestId('check-icon')).toBeInTheDocument();
        });
    });

    test('should remove the drag-over class after a drop', async () => {
        render(<ImportModal {...defaultProps} />);

        const jsonData = { test: 'data' };
        const file = new File([JSON.stringify(jsonData)], 'test.json', {
            type: 'application/json'
        });

        const dropZone = screen.getByRole('button', { name: /drag and drop/i });

        fireEvent.dragOver(dropZone);
        expect(dropZone).toHaveClass('drag-over');

        fireEvent.drop(dropZone, {
            dataTransfer: {
                files: [file]
            }
        });

        expect(dropZone).not.toHaveClass('drag-over');
    });

    test('should open the file selector when clicking the drop zone', () => {
        render(<ImportModal {...defaultProps} />);

        const input = screen.getByTestId('file-input');
        const clickSpy = jest.spyOn(input, 'click');

        const dropZone = screen.getByRole('button', { name: /drag and drop/i });
        fireEvent.click(dropZone);

        expect(clickSpy).toHaveBeenCalled();
    });

    test('should reset state when the modal is reopened', async () => {
        const { rerender } = render(<ImportModal {...defaultProps} />);

        // Upload a file
        const jsonData = { test: 'data' };
        const file = new File([JSON.stringify(jsonData)], 'test.json', {
            type: 'application/json'
        });

        const input = screen.getByTestId('file-input');
        await userEvent.upload(input, file);

        await waitFor(() => {
            expect(screen.getByTestId('check-icon')).toBeInTheDocument();
        });

        // Close the modal
        rerender(<ImportModal {...defaultProps} show={false} />);

        // Reopen the modal
        rerender(<ImportModal {...defaultProps} show={true} />);

        // Check that state has been reset
        expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
        expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
        expect(screen.getByText('Import')).toBeDisabled();
    });

    test('should do nothing if no file is provided to handleFile', () => {
        render(<ImportModal {...defaultProps} />);

        const input = screen.getByTestId('file-input');

        // Simulate a change event without a file
        fireEvent.change(input, { target: { files: [] } });

        // Import button should remain disabled
        expect(screen.getByText('Import')).toBeDisabled();
    });

    test('should call onImport with fileData and onClose when fileData exists', async () => {
        render(<ImportModal {...defaultProps} />);

        const jsonData = { workflow: 'test data', id: 123 };
        const file = new File([JSON.stringify(jsonData)], 'test.json', {
            type: 'application/json'
        });

        const input = screen.getByTestId('file-input')
        await userEvent.upload(input, file);

        await waitFor(() => {
            expect(screen.getByText('Import')).not.toBeDisabled();
        });

        const importButton = screen.getByText('Import');
        fireEvent.click(importButton);

        expect(mockOnImport).toHaveBeenCalledWith(jsonData);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should do nothing when fileData is null', () => {
        render(<ImportModal {...defaultProps} />);

        const importButton = screen.getByText('Import');
        expect(importButton).toBeDisabled();

        fireEvent.click(importButton);

        expect(mockOnImport).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
    });

});
