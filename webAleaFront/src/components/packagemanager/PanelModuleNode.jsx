import * as React from 'react';
import Box from '@mui/material/Box';
import { Menu, MenuItem } from "@mui/material";
import { RichTreeView, useTreeViewApiRef } from '@mui/x-tree-view';

const OPENALEA_NODES = [
    { 
        id: 'openalea',
        label: 'OpenAlea',
        children: [
            { id: 'grid-community', label: '@mui/x-data-grid', data: {inputs: [{name: "input1", type: "float", default: 0}], outputs: [{name: "output1", type: "float", value: 0}]} },
            { id: 'grid-pro', label: '@mui/x-data-grid-pro', data: {inputs: [{name: "input1", type: "float", default: 0}], outputs: [{name: "output1", type: "float", value: 0}]} },
            { id: 'grid-premium', label: '@mui/x-data-grid-premium', data: {inputs: [{name: "input1", type: "float", default: 0}], outputs: [{name: "output1", type: "float", value: 0}]} },
        ],
    },
    {
        id: 'pickers',
        label: 'Date and Time Pickers',
        children: [
            { id: 'pickers-community', label: '@mui/x-date-pickers', data: {inputs: [{name: "input1", type: "float", default: 0}], outputs: [{name: "output1", type: "float", value: 0}, {name: "output2", type: "float", value: 0}]} },
            { id: 'pickers-pro', label: '@mui/x-date-pickers-pro', data: {inputs: [{name: "input1", type: "float", default: 0}, {name: "input2", type: "float", default: 0}], outputs: [{name: "output1", type: "float", value: 0}]} },
        ],
    },
    {
        id: 'charts',
        label: 'Charts',
        children: [
            { id: 'charts-community', label: '@mui/x-charts', data: {inputs: [{name: "input1", type: "float", default: 0}], outputs: [{name: "output1", type: "float", value: 0}]} },
            { id: 'charts-pro', label: '@mui/charts-pro', data: {inputs: [{name: "input1", type: "float", default: 0}], outputs: [{name: "output1", type: "float", value: 0}]} },
        ],
    },
    {
        id: 'tree-view',
        label: 'Tree View',
        children: [
            { id: 'tree-view-community', label: '@mui/x-tree-view', data: {inputs: [{name: "input1", type: "float", default: 0}], outputs: [{name: "output1", type: "float", value: 0}]} },
            { id: 'tree-view-pro', label: '@mui/x-tree-view-pro', data: {inputs: [{name: "input1", type: "float", default: 0}], outputs: [{name: "output1", type: "float", value: 0}]} },
        ],
    },
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
                    items={OPENALEA_NODES}

                    sx={{ userSelect: 'none' }}

                    onItemClick={(_event, item) => {
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