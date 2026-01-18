import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import PanelInstallPackage from "../../../../../../src/features/package-manager/ui/type/PanelInstallPackage.jsx";
import * as PackageService from "../../../../../../src/service/PackageService.js";
import { jest, beforeEach, test, expect, describe } from "@jest/globals";

/* ===========================
    Mocks
=========================== */

jest.mock("../../../../../../src/service/PackageService.js");

jest.mock("../../../../../../src/config/api", () => ({
    API_BASE_URL: "http://test-api"
}));

/* ===========================
    Tests
=========================== */

describe("PanelInstallPackage Unit Tests", () => {
    let props;

    beforeEach(() => {
    jest.clearAllMocks();

    props = {
            onPackageInstalled: jest.fn(),
            packages: [],
            setPackages: jest.fn(),
            filteredPackages: [],
            setFilteredPackages: jest.fn(),
            loading: false,
            setLoading: jest.fn(),
            installing: null,
            setInstalling: jest.fn(),
            installedPackages: new Set(),
            setInstalledPackages: jest.fn(),
            searchTerm: "",
            setSearchTerm: jest.fn(),
            snackbar: { open: false, message: "", severity: "info" },
            setSnackbar: jest.fn(),
        };
    });

    test("useEffect fetches packages on mount", async () => {
        const mockPackages = [
            { name: "packageA", version: "1.0.0" },
            { name: "packageB", version: "2.0.0" },
        ];
        PackageService.getPackagesList.mockResolvedValue(mockPackages);

        render(<PanelInstallPackage {...props} />);

        await waitFor(() => {
            expect(props.setPackages).toHaveBeenCalledWith(mockPackages);
            expect(props.setFilteredPackages).toHaveBeenCalledWith(mockPackages);
            expect(props.setLoading).toHaveBeenCalledWith(false);
        });
    });

    test("handleInstall success updates state and calls onPackageInstalled", async () => {
        const pkg = { name: "packageA", version: "1.0.0" };
        PackageService.installPackage.mockResolvedValue({ success: true });

        render(<PanelInstallPackage {...props} filteredPackages={[pkg]} />);

        fireEvent.click(screen.getByTitle(`Install ${pkg.name}`));

        await waitFor(() => {
            expect(props.setInstalling).toHaveBeenCalledWith(pkg.name);
            expect(props.setInstalledPackages).toHaveBeenCalled();
            expect(props.setSnackbar).toHaveBeenCalledWith({
            open: true,
            message: `${pkg.name} installed successfully!`,
            severity: "success",
            });
            expect(props.onPackageInstalled).toHaveBeenCalledWith(pkg);
            expect(props.setInstalling).toHaveBeenCalledWith(null);
        });
    });

    test("handleInstall failure shows snackbar error", async () => {
        const pkg = { name: "packageA", version: "1.0.0" };
        PackageService.installPackage.mockResolvedValue({ success: false, failed: [{ error: "Conflict" }] });

        render(<PanelInstallPackage {...props} filteredPackages={[pkg]} />);

        fireEvent.click(screen.getByTitle(`Install ${pkg.name}`));

        await waitFor(() => {
            expect(props.setSnackbar).toHaveBeenCalledWith({
                open: true,
                message: `Failed to install ${pkg.name}: Conflict`,
                severity: "error",
            });
        });
    });

    test("searchTerm filters packages", async () => {
        const pkgs = [
            { name: "alpha", version: "1.0" },
            { name: "beta", version: "2.0" },
        ];

        const setFilteredPackagesMock = jest.fn();
        const setSearchTermMock = jest.fn((term) => {
        // Simule l'effet du setSearchTerm sur le filteredPackages
        const filtered = pkgs.filter(pkg => pkg.name.includes(term));
        setFilteredPackagesMock(filtered);
        });

        render(
            <PanelInstallPackage
                {...props}
                packages={pkgs}
                filteredPackages={pkgs}
                setFilteredPackages={setFilteredPackagesMock}
                setSearchTerm={setSearchTermMock}
            />
    );

    fireEvent.change(screen.getByPlaceholderText("Search packages..."), { target: { value: "alpha" } });

    // Verify that setSearchTerm was called
    expect(setSearchTermMock).toHaveBeenCalledWith("alpha");

    // Verify the simulated filtering
    expect(setFilteredPackagesMock).toHaveBeenCalledWith([{ name: "alpha", version: "1.0" }]);
    });


    test("displays empty state if no filtered packages", () => {
        render(<PanelInstallPackage {...props} filteredPackages={[]} searchTerm="xyz" />);

        expect(screen.getByText('No packages found')).toBeInTheDocument();
        expect(screen.getByText('No packages matching "xyz"')).toBeInTheDocument();
    });

        test("loading state renders loader", () => {
        render(<PanelInstallPackage {...props} loading={true} />);

        expect(screen.getByText("Loading available packages...")).toBeInTheDocument();
    });

    test("snackbar closes on handleCloseSnackbar", () => {
        let snackbarState = { open: true, message: "Test", severity: "success" };
        const setSnackbarMock = jest.fn((fn) => {
            // Calls the function passed with the current state
            snackbarState = fn(snackbarState);
        });

        render(
            <PanelInstallPackage
            {...props}
            snackbar={snackbarState}
            setSnackbar={setSnackbarMock}
            />
        );

        // retrieves the close button in Alert (MUI adds a hidden button with role="button")
        const closeBtn = screen.getByRole("button", { hidden: true });
        fireEvent.click(closeBtn);

        // verifies that the function modified the state correctly
        expect(snackbarState).toEqual({ open: false, message: "Test", severity: "success" });
    });

});
