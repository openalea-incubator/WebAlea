import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PanelModuleNode from '../../../../../../src/features/package-manager/ui/type/PanelModuleNode';
import {
    getVisualPackagesList,
    getNodesList
} from '../../../../../../src/service/PackageService.js';
import { jest, beforeEach, test, expect, describe } from "@jest/globals";

/* ===========================
    Mocks
=========================== */

jest.mock('../../../../../../src/service/PackageService.js');

jest.mock('@mui/x-tree-view', () => ({
    RichTreeView: ({ items, onItemClick, onItemExpansionToggle }) => {
    const renderItems = (nodes) =>
        nodes.map(item => (
        <div key={item.id}>
            <button onClick={() => onItemClick(null, item.id)}>
                {item.label}
            </button>

            {!item.isNode && (
            <button onClick={() => onItemExpansionToggle(null, item.id, true)}>
                expand-{item.id}
            </button>
            )}

            {item.children && renderItems(item.children)}
        </div>
        ));

    return <div>{renderItems(items)}</div>;
    }
}));

jest.mock("../../../../../../src/config/api", () => ({
    API_BASE_URL: "http://test-api"
}));


const baseProps = {
    onAddNode: jest.fn(),
    version: '1.0',
    treeItems: [],
    setTreeItems: jest.fn(),
    loading: false,
    setLoading: jest.fn(),
    loadingPackage: null,
    setLoadingPackage: jest.fn(),
    loadedPackages: new Set(),
    setLoadedPackages: jest.fn(),
    expandedItems: [],
    setExpandedItems: jest.fn(),
};

/* ===========================
    Tests
=========================== */

describe('PanelModuleNode', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });
    // ---------- GLOBAL STATES ----------

    test('shows global loader when loading is true', () => {
        render(<PanelModuleNode {...baseProps} loading={true} />);
        expect(screen.getByText(/Loading packages/i)).toBeInTheDocument();
    });

    test('shows empty state when no packages exist', () => {
        render(
            <PanelModuleNode
            {...baseProps}
            treeItems={[{ id: 'root', children: [] }]}
            />
        );
        expect(screen.getByText(/No visual packages installed/i)).toBeInTheDocument();
    });

    // ---------- INITIAL FETCH ----------

    test('fetches visual packages on mount', async () => {
        getVisualPackagesList.mockResolvedValue([
            { name: 'pkgA', module: 'modA' }
        ]);

        render(<PanelModuleNode {...baseProps} />);

        await waitFor(() => {
            expect(getVisualPackagesList).toHaveBeenCalled();
        });
    });

    test('does not fetch packages if treeItems already exists', () => {
        render(
            <PanelModuleNode
                {...baseProps}
                treeItems={[{ id: 'root', children: [{ id: 'pkgA' }] }]}
            />
        );
        expect(getVisualPackagesList).not.toHaveBeenCalled();
    });

    // ---------- PACKAGE INTERACTIONS ----------

    test('loads nodes when clicking on a package', async () => {
        getNodesList.mockResolvedValue([
            { name: 'node1', callable: true }
        ]);

        const tree = [{
            id: 'root',
            children: [{ id: 'pkgA', label: 'pkgA', children: [] }]
        }];

        render(
            <PanelModuleNode
            {...baseProps}
            treeItems={tree}
            />
        );

        fireEvent.click(screen.getByText('pkgA'));

        await waitFor(() => {
            expect(getNodesList).toHaveBeenCalledWith({
                name: 'pkgA',
                packageName: 'pkgA',
                installName: 'pkgA',
            });
        });
    });

    test('loads nodes when expanding a package', async () => {
        getNodesList.mockResolvedValue([{ name: 'nodeX' }]);

        const tree = [{
            id: 'root',
            children: [{ id: 'pkgA', label: 'pkgA', children: [] }]
        }];

        render(
            <PanelModuleNode
            {...baseProps}
            treeItems={tree}
            />
        );

        fireEvent.click(screen.getByText('expand-pkgA'));

        await waitFor(() => {
            expect(getNodesList).toHaveBeenCalled();
        });
    });

    test('does not reload already loaded package', async () => {
        const tree = [{
            id: 'root',
            children: [{ id: 'pkgA', label: 'pkgA', children: [] }]
        }];

        render(
            <PanelModuleNode
            {...baseProps}
            treeItems={tree}
            loadedPackages={new Set(['pkgA'])}
            />
    );

    fireEvent.click(screen.getByText('pkgA'));
    expect(getNodesList).not.toHaveBeenCalled();
    });

    // ---------- NODE INTERACTIONS ----------

    test('calls onAddNode when clicking a node', async () => {
        const onAddNode = jest.fn();

        const tree = [{
            id: 'root',
            children: [{
            id: 'pkgA',
            children: [{
                id: 'pkgA::node1',
                label: 'node1',
                isNode: true
            }]
            }]
        }];

        render(
            <PanelModuleNode
            {...baseProps}
            onAddNode={onAddNode}
            treeItems={tree}
            />
        );

        fireEvent.click(screen.getByText('node1'));

        expect(onAddNode).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'pkgA::node1' })
        );
        });
});
