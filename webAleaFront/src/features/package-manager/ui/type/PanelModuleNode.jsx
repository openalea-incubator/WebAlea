import * as React from 'react';
import Box from '@mui/material/Box';
import { Menu, MenuItem } from "@mui/material";
import { RichTreeView, useTreeViewApiRef } from '@mui/x-tree-view';
import TreePackage from '../../model/TreePackage.jsx';
import TreeNode from '../../model/TreeNode.jsx';
import { Node } from '../../../workspace/model/Node.jsx';

const ALEA_NODES = [
    new Node({ id: 'grid-community', label: '@mui/x-data-grid', inputs: [{"id": "in-grid-community-0", "name": "Test", "type": "string", "value": "coubeh"}], outputs: [{ "id": "out-grid-community-0", "name": "Value", "type": "float", "value": 0 }] }),
    new Node({ id: 'grid-pro', label: '@mui/x-data-grid-pro', inputs: [{ "id": "in-grid-pro-0", "name": "a", "type": "float", "value": 0 }, { "id": "in-grid-pro-1", "name": "b", "type": "float", "value": 0 }] }),
    new Node({ id: 'grid-premium', label: '@mui/x-data-grid-premium', outputs: [{ "id": "out-grid-premium-0", "name": "Value1", "type": "boolean", "value": false }, { "id": "out-grid-premium-1", "name": "Value2", "type": "boolean", "value": false }] })
];

const TREE_VIEW_NODES = [
    new Node({ id: 'tree-view-community', label: '@mui/x-tree-view', inputs: [{"id": "in-tree-view-community-0", "name": "Test", "type": "float", "value": 0}], outputs: [{"id": "out-tree-view-community-0", "name": "Value", "type": "float", "value": 0 }] }),
    new Node({ id: 'tree-view-pro', label: '@mui/x-tree-view-pro', inputs: [{ "id": "in-tree-view-pro-0", "name": "Value", "type": "string", "value": "" }] })
];

const OPENALEA_NODES = [
    new TreePackage('openalea', 'OpenAlea', [
        new TreeNode(ALEA_NODES[0]),
        new TreeNode(ALEA_NODES[1]),
        new TreeNode(ALEA_NODES[2])
        ]
    ),
    new TreePackage('tree-view', 'Tree View', [
        new TreeNode(TREE_VIEW_NODES[0]),
        new TreeNode(TREE_VIEW_NODES[1])
        ]
    )
];


export default function PanelModuleNode({ onAddNode }) {

    const [menu, setMenu] = React.useState(null);
    const [selectedItem, setSelectedItem] = React.useState(null);

    const handleRightClick = (event) => {
        event.preventDefault();

        setMenu(menu === null ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 } : null);
        setSelectedItem(event.target);

        const selection = document.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);

            setTimeout(() => {
                selection.addRange(range);
            });
        }
    };

    const handleClose = () => {
        setMenu(null);
    };

    const apiRef = useTreeViewApiRef();

    return (
        <Box sx={{ minHeight: 352, minWidth: 250 }} onContextMenu={handleRightClick}>
            <div>
                <RichTreeView
                    apiRef={apiRef}
                    items={OPENALEA_NODES.map(node => node.serialize())}

                    sx={{ userSelect: 'none' }}

                    onItemClick={(_event, treeNode) => {
                        if (apiRef.current) {
                            treeNode = apiRef.current.getItem(treeNode);
                            if (treeNode.children && treeNode.children.length > 0) {
                                return;
                            }
                            onAddNode(treeNode);
                        }
                    }
                    }
                />
            </div>
            <Menu
                open={menu !== null}
                onClose={handleClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    menu !== null ? { top: menu.mouseY, left: menu.mouseX } : undefined
                }
            >
                <MenuItem onClick={() => {
                    console.log("Renommer", selectedItem);
                    handleClose();
                }}>
                    Renommer
                </MenuItem>
                <MenuItem onClick={() => {
                    console.log("Supprimer", selectedItem);
                    handleClose();
                }}>
                    Supprimer
                </MenuItem>
            </Menu>
        </Box>
    );
}