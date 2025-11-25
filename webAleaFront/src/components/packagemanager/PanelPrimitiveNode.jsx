import * as React from 'react';
import Box from '@mui/material/Box';
import { Menu, MenuItem } from "@mui/material";
import { RichTreeView, useTreeViewApiRef } from '@mui/x-tree-view';

const PRIMITIVE_NODES = [
    { id: 'float', label: 'Float input', outputs: [{"name": "outputs", "type": "float", "default": 0}] },
    { id: 'string', label: 'String input', outputs: [{"name": "outputs", "type": "string", "default": ""}] },
    { id: 'boolean', label: 'Boolean input', outputs: [{"name": "outputs", "type": "boolean", "default": false}] }
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
            items={PRIMITIVE_NODES}

            sx={{ userSelect: 'none' }}

            onItemClick= {(_event, item) => 
            {
                if (apiRef.current) {
                    item = apiRef.current.getItem(item);
                    if (item.children && item.children.length > 0) {
                        return;
                    }
                    onAddNode(item);
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