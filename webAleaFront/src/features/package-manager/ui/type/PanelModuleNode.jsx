import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import { Menu, MenuItem } from "@mui/material";
import { RichTreeView, useTreeViewApiRef } from '@mui/x-tree-view';
import TreePackage from '../../model/TreePackage.jsx';
import { getPackagesList, getNodesList } from '../../../../service/PackageService.js';

export default function PanelModuleNode({ onAddNode }) {

    const [treePackagesAlea, setTreePackagesAlea] = useState(
        new TreePackage("OpenAlea Packages", "OpenAlea Packages"));

    const apiRef = useTreeViewApiRef();

    useEffect(() => {
    async function fetchPackages() {
        const allPackages = await getPackagesList();
        const packagesTree = allPackages.map(pkg => new TreePackage(pkg.name, pkg.name, pkg.version));
        setTreePackagesAlea(new TreePackage("OpenAlea Packages", "OpenAlea Packages", "undefined" , packagesTree));
    }
    fetchPackages();
    }, []);

    async function getChildren(pkg) {
        const packageNodes = await getNodesList({ name: pkg.id, version: pkg.version });
        console.log("packageNodes :", packageNodes);
        return packageNodes.map(node => ({
            id: node.name,
            label: node.name,
            version: node.data?.version ?? "unknown",
            childrenCount: 0,
        }));
    };


    return (
    <Box sx={{ minHeight: 352, minWidth: 250 }}>
        <RichTreeView
        apiRef={apiRef}
        items={[treePackagesAlea.serialize()]}
        sx={{ userSelect: 'none' }}
        onItemClick={async (_event, treeNode) => {
            if (!apiRef.current) return;

            const node = apiRef.current.getItem(treeNode);
            if (node.children && node.children.length > 0) return;
            console.log("Loading children for node :", node);
            const childrenNodes = await getChildren(node);
            apiRef.current.updateItem(node.id, { children: childrenNodes });
        }}
        />
    </Box>
    );
}
