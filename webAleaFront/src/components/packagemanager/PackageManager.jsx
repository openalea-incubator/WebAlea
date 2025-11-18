import * as React from 'react';
import Box from '@mui/material/Box';
import { Menu, MenuItem } from "@mui/material";
import { RichTreeView, useTreeViewApiRef } from '@mui/x-tree-view';
import { Node } from '../workspace/Node';

const MUI_X_PRODUCTS = [
  {
    id: 'openalea',
    label: 'OpenAlea',
    children: [
      { id: 'grid-community', label: '@mui/x-data-grid' },
      { id: 'grid-pro', label: '@mui/x-data-grid-pro' },
      { id: 'grid-premium', label: '@mui/x-data-grid-premium' },
    ],
  },
  {
    id: 'pickers',
    label: 'Date and Time Pickers',
    children: [
      { id: 'pickers-community', label: '@mui/x-date-pickers' },
      { id: 'pickers-pro', label: '@mui/x-date-pickers-pro' },
    ],
  },
  {
    id: 'charts',
    label: 'Charts',
    children: [
      { id: 'charts-community', label: '@mui/x-charts' },
      { id: 'charts-pro', label: '@mui/charts-pro' },
    ],
  },
  {
    id: 'tree-view',
    label: 'Tree View',
    children: [
      { id: 'tree-view-community', label: '@mui/x-tree-view' },
      { id: 'tree-view-pro', label: '@mui/x-tree-view-pro' },
    ],
  },
];

export default function PackageManager({ addNode, removeNode }) {
  
  const handleDelete = () => {
    /*
    const nodeIdToDelete = "n2";
    removeNode(nodeIdToDelete);
    */
  };

  const handleAddNode = (item) => {
    const newNode = {
      id: `n${Math.floor(Math.random() * 10000)}-${item.id}`
    };
    addNode(new Node({ id: newNode.id, title: item.label }));
  }

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
          items={MUI_X_PRODUCTS}

          onItemClick= {(event, item) => 
            {
              if (apiRef.current) {
                item = apiRef.current.getItem(item);
                if (item.children && item.children.length > 0) {
                  return;
                }
                handleAddNode(item); 
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