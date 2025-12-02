import * as React from 'react';
import Box from '@mui/material/Box';
import { Menu, MenuItem } from "@mui/material";
import { RichTreeView, useTreeViewApiRef } from '@mui/x-tree-view';
import { Node } from '../../../workspace/model/Node.jsx';
import TreeNode from '../../model/TreeNode.jsx';

const FLOAT_NODE = new Node({ id: 'float', label: 'Float input', type: "float", outputs: [{ "name": "Value", "type": "float", "default": 0 }] })
const STRING_NODE = new Node({ id: 'string', label: 'String input', type: "string", outputs: [{ "name": "Value", "type": "string", "default": "" }] })
const BOOLEAN_NODE = new Node({ id: 'boolean', label: 'Boolean input', type: "boolean", outputs: [{ "name": "Value", "type": "boolean", "default": false }] })

const PRIMITIVE_NODES = [
    new TreeNode(FLOAT_NODE),
    new TreeNode(STRING_NODE),
    new TreeNode(BOOLEAN_NODE)
];

export default function PanelPrimitiveNode({ onAddNode }) {

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
                    items={PRIMITIVE_NODES.map(node => node.serialize())}

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