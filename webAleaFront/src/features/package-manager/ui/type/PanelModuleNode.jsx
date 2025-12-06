import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Menu, MenuItem } from "@mui/material";
import { RichTreeView, useTreeViewApiRef } from '@mui/x-tree-view';
import TreePackage from '../../model/TreePackage.jsx';
import { getPackagesList } from '../../../../service/PackageService.js';

export default function PanelModuleNode({ onAddNode }) {

    const [treePackagesAlea, setTreePackagesAlea] = useState(
        new TreePackage("OpenAlea Packages", "OpenAlea Packages"));

    const apiRef = useTreeViewApiRef();

    useEffect(() => {
    async function fetchPackages() {
        const allPackages = await getPackagesList();
        const packagesTree = allPackages.map(pkg => new TreePackage(pkg.name, pkg.name));
        setTreePackagesAlea(new TreePackage("OpenAlea Packages", "OpenAlea Packages", packagesTree));
    }
    fetchPackages();
    }, []);

    const getChildren = async (item) => {
        // TODO
    };

    return (
    <Box sx={{ minHeight: 352, minWidth: 250 }}>
        <RichTreeView
        apiRef={apiRef}
        items={treePackagesAlea?.children?.length ? [treePackagesAlea.serialize()] : []}
        dataSource={{
            getChildrenCount: (item) => item.children,
            getTreeItems: getChildren,
        }}
        sx={{ userSelect: 'none' }}
        onItemClick={(_event, treeNode) => {
            if (!apiRef.current) return;

            const node = apiRef.current.getItem(treeNode);
            if (node.children && node.children.length > 0) return;

            onAddNode(node);
        }}
        />
    </Box>
    );
}
