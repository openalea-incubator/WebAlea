import { useEffect, useCallback } from 'react';
import { Alert, Snackbar } from "@mui/material";
import { FiDownload, FiCheck, FiSearch, FiLoader, FiPackage } from "react-icons/fi";
import { getPackagesList, installPackage } from '../../../../service/PackageService.js';

/**
 * Panel for installing OpenAlea packages from conda.
 * Features search, install status, and notifications.
 * 
 * TODO: Refactor this component :
 * * It is a duplicate of the PanelModuleNode component.
 * * It is not using the TreePackage component.
 * * There are too many parameters.
 * 
 * @param {function} onPackageInstalled - The function to call when a package is installed.
 * @param {array} packages - The packages to display.
 * @param {function} setPackages - The function to set the packages.
 * @param {array} filteredPackages - The filtered packages to display.
 * @param {function} setFilteredPackages - The function to set the filtered packages.
 * @param {boolean} loading - The loading state.
 * @param {function} setLoading - The function to set the loading state.
 * @param {Set<string>} installing - The packages currently being installed.
 * @param {function} setInstalling - The function to set the installing state.
 * @param {Set} installedPackages - The installed packages.
 * @param {function} setInstalledPackages - The function to set the installed packages.
 * @param {string} searchTerm - The search term.
 * @param {function} setSearchTerm - The function to set the search term.
 * @param {object} snackbar - The snackbar state.
 * @param {function} setSnackbar - The function to set the snackbar state.
 * @returns {React.ReactNode} - The PanelInstallPackage component.
 */
export default function PanelInstallPackage({ onPackageInstalled, packages, setPackages, filteredPackages, setFilteredPackages, loading, setLoading, installing, setInstalling, installedPackages, setInstalledPackages, searchTerm, setSearchTerm, snackbar, setSnackbar }) {
    /**
     * Use effect to fetch the packages.
     */
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
    }, [packages, setLoading, setPackages, setFilteredPackages, setSnackbar]);

    /**
     * Use effect to filter the packages.
     */
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredPackages(packages);
        } else {
            const filtered = packages.filter(pkg =>
                pkg.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredPackages(filtered);
        }
    }, [searchTerm, packages, setFilteredPackages]);

    /**
     * Handles package installation.
     * NOTE: We don't pass the version to let conda auto-resolve to a Python-compatible version.
     */
    const handleInstall = useCallback(async (pkg) => {
        const packageKey = pkg.name.toLowerCase();
        setInstalling(prev => new Set([...prev, packageKey]));
        try {
            const result = await installPackage({ name: pkg.name });

            if (result.success) {
                setInstalledPackages(prev => new Set([...prev, pkg.name.toLowerCase()]));
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
            setInstalling(prev => {
                const next = new Set(prev);
                next.delete(packageKey);
                return next;
            });
        }
    }, [onPackageInstalled, setInstalling, setInstalledPackages, setSnackbar]);

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
                        const packageKey = pkg.name.toLowerCase();
                        const isInstalling = installing.has(packageKey);
                        const isInstalled = installedPackages.has(packageKey);

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
