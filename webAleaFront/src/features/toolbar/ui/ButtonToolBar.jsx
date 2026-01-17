/**
 * ButtonToolBar component - A button component for toolbar with an icon.
 *
 * @param Icon - Icon component to be displayed inside the button.
 * @param onClick - Click event handler for the button.
 * @returns {React.ReactNode} - The PanelInstallPackage component.
 */
export default function ButtonToolBar({ icon: Icon, onClick }) {
    return (
        <button onClick={onClick} className="btn">
            {Icon && <Icon size={30} className="btn-primary btn-lg flex-grow-1" />}
        </button>
    );
}