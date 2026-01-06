export default function ButtonToolBar({ icon: Icon, onClick }) {


    return (
        <button onClick={onClick} className="btn">
            {Icon && <Icon size={30} className="btn-primary btn-lg flex-grow-1" />}
        </button>
    );
}