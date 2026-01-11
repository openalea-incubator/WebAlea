import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ButtonToolBar from '../../../../../src/features/toolbar/ui/ButtonToolBar.jsx';
import { FiUpload } from 'react-icons/fi';
import {describe, test, expect} from "@jest/globals";

describe('ButtonToolBar', () => {

    test('devrait appeler onClick quand on clique sur le bouton', () => {
        const mockOnClick = jest.fn();

        render(<ButtonToolBar icon={FiUpload} onClick={mockOnClick} />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('devrait rendre l\'icône quand elle est fournie', () => {
        const MockIcon = () => <span data-testid="mock-icon">Icon</span>;

        render(<ButtonToolBar icon={MockIcon} onClick={jest.fn()} />);

        expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
    });
});