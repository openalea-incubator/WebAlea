import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import { FlowProvider } from './providers/FlowContext.jsx';
import { LogProvider } from './providers/LogContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LogProvider>
    <FlowProvider>
      <App />
    </FlowProvider>
    </LogProvider>
  </StrictMode>,
)
