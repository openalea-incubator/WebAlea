import { useEffect, useState, useCallback } from 'react';
import { Alert, Snackbar } from "@mui/material";
import { FiDownload, FiCheck, FiSearch, FiLoader, FiPackage } from "react-icons/fi";
import { getPackagesList, installPackage } from '../../../../service/PackageService.js';

/**
 * Panel for installing OpenAlea packages from conda.
 * Features search, install status, and notifications.
 */
export default function PanelInstallPackage({ onPackageInstalled, packages, setPackages, filteredPackages, setFilteredPackages, loading, setLoading, installing, setInstalling, installedPackages, setInstalledPackages, searchTerm, setSearchTerm, snackbar, setSnackbar }) {

    useEffect(() => {

        if (packages.length > 0) {
            setLoading(false);
            return;
        }

        async function fetchPackages() {
            setLoading(true);
            try {
                const allPackages = await getPackagesList();
                setPackages(allPackages);
                setFilteredPackages(allPackages);
            } catch (error) {
                console.error("Error fetching packages:", error);
                setSnackbar({ open: true, message: 'Failed to fetch packages', severity: 'error' });
            } finally {
                setLoading(false);
            }
        }
        fetchPackages();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredPackages(packages);
        } else {
            const filtered = packages.filter(pkg =>
                pkg.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredPackages(filtered);
        }
    }, [searchTerm, packages]);

    /**
     * Handles package installation.
     * NOTE: We don't pass the version to let conda auto-resolve to a Python-compatible version.
     */
    const handleInstall = useCallback(async (pkg) => {
        console.log("handleInstall called for:", pkg.name);
        setInstalling(pkg.name);
        try {
            console.log("Calling installPackage API...");
            const result = await installPackage({ name: pkg.name });
            console.log("Install result:", result);

            if (result.success) {
                setInstalledPackages(prev => new Set([...prev, pkg.name]));
                setSnackbar({
                    open: true,
                    message: `${pkg.name} installed successfully!`,
                    severity: 'success'
                });

                if (onPackageInstalled) {
                    onPackageInstalled(pkg);
                }
            } else if (result.failed && result.failed.length > 0) {
                const errorMsg = result.failed[0]?.error || 'Unknown error';
                setSnackbar({
                    open: true,
                    message: `Failed to install ${pkg.name}: ${errorMsg}`,
                    severity: 'error'
                });
            } else {
                setSnackbar({
                    open: true,
                    message: `Failed to install ${pkg.name}`,
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error("Error installing package:", error);
            setSnackbar({
                open: true,
                message: `Error installing ${pkg.name}: ${error.message || 'Unknown error'}`,
                severity: 'error'
            });
        } finally {
            setInstalling(null);
        }
    }, [onPackageInstalled]);

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Loading state
    if (loading) {
        return (
            <div className="panel-container">
                <div className="panel-loading">
                    <FiLoader className="loading-pulse" style={{ fontSize: '1.5rem' }} />
                    <span className="panel-loading-text">Loading available packages...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="panel-container">
            {/* Search bar */}
            <div className="search-container">
                <div style={{ position: 'relative' }}>
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search packages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Package count */}
            <div className="package-count">
                {filteredPackages.length} packages available
            </div>

            {/* Package list */}
            <div className="panel-scrollable">
                <div className="package-list">
                    {filteredPackages.map((pkg) => {
                        const isInstalling = installing === pkg.name;
                        const isInstalled = installedPackages.has(pkg.name);

                        return (
                            <div
                                key={pkg.name}
                                className={`package-item ${isInstalled ? 'installed' : ''} ${isInstalling ? 'installing' : ''}`}
                            >
                                <div className="package-info">
                                    <div className="package-name">{pkg.name}</div>
                                    <span className="package-version">v{pkg.version}</span>
                                </div>
                                <div className="package-action">
                                    {isInstalling ? (
                                        <FiLoader className="loading-pulse" style={{ fontSize: '1.2rem', color: '#333' }} />
                                    ) : isInstalled ? (
                                        <span className="installed-icon">
                                            <FiCheck />
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            className="install-button"
                                            onClick={() => handleInstall(pkg)}
                                            title={`Install ${pkg.name}`}
                                            style={{ pointerEvents: 'auto' }}
                                        >
                                            <FiDownload style={{ pointerEvents: 'none' }} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty search result */}
                {filteredPackages.length === 0 && (
                    <div className="panel-empty">
                        <FiPackage className="panel-empty-icon" />
                        <div className="panel-empty-title">No packages found</div>
                        <div className="panel-empty-subtitle">
                            No packages matching "{searchTerm}"
                        </div>
                    </div>
                )}
            </div>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
}
