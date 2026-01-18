import React from "react";
import { render } from "@testing-library/react";

import { FlowProvider } from "../../src/providers/FlowContext.jsx";
import { LogProvider } from "../../src/providers/LogContext.jsx";
import { StrictMode } from 'react'
// Ajoute ici tous les autres providers nécessaires

export function renderWithProviders(ui) {
    return render(
        <StrictMode>
            <LogProvider>
                <FlowProvider>
                {ui}
                </FlowProvider>
            </LogProvider>
        </StrictMode>,
    );
}
