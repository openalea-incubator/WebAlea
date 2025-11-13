import React, { useState } from "react";


export default function ButtonToolBar({ title, icon: Icon, onClick }) {


    return (
        <button onClick={onClick} className="btn">
            {Icon && <Icon size={30} className="btn-primary btn-lg flex-grow-1" />}
        </button>
    );
}