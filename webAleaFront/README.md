# WebAlea Frontend

A modern, interactive web application for visual workflow programming with OpenAlea components. WebAlea provides an intuitive drag-and-drop interface for building and executing scientific data processing pipelines, particularly for plant modeling and simulation.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Building for Production](#building-for-production)
- [Usage Guide](#usage-guide)
  - [Creating a Workflow](#creating-a-workflow)
  - [Managing Packages](#managing-packages)
  - [Executing Workflows](#executing-workflows)
  - [Exporting and Importing](#exporting-and-importing)
- [Architecture](#architecture)
  - [Component Hierarchy](#component-hierarchy)
  - [State Management](#state-management)
  - [Workflow Engine](#workflow-engine)
  - [API Integration](#api-integration)
- [Configuration](#configuration)
- [Docker Deployment](#docker-deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

WebAlea Frontend is a React-based single-page application that provides a visual programming environment for OpenAlea workflows. It enables users to:

- Browse and install OpenAlea packages from the Conda ecosystem
- Create visual workflows by connecting nodes
- Execute workflows with automatic dependency resolution
- Monitor execution progress in real-time
- Export and import workflows as JSON files

The application communicates with a FastAPI backend service that handles package management, node introspection, and workflow execution.

## Features

### Visual Workflow Editor

- **Interactive Canvas**: Drag-and-drop interface powered by ReactFlow
- **Node Types**: Support for OpenAlea custom nodes and primitive nodes (Float, String, Boolean, Enum)
- **Connection Validation**: Type-safe connections between nodes
- **Mini Map**: Navigate large workflows easily
- **Zoom Controls**: Pan, zoom, and fit-to-view controls

### Package Management

- **Package Browser**: Browse installed OpenAlea packages with visual nodes
- **Lazy Loading**: Packages and nodes are loaded on-demand for better performance
- **Package Installation**: Install new packages directly from the Conda openalea3 channel
- **Primitive Nodes**: Quick access to basic data type nodes

### Workflow Execution

- **Asynchronous Execution**: Parallel execution of independent nodes
- **Dependency Resolution**: Automatic handling of node dependencies
- **Real-time Progress**: Live updates on execution status and progress
- **Error Handling**: Graceful error handling with detailed error messages
- **Cycle Detection**: Validates workflows to prevent circular dependencies
- **Cancellation**: Stop workflow execution at any time

### Persistence

- **Auto-save**: Workflows are automatically saved to localStorage
- **Export/Import**: Save and share workflows as JSON files
- **Workflow Info**: View statistics about your workflow

### Monitoring

- **Console Logs**: Real-time logging of workflow execution events
- **Node Details**: Inspect node parameters, inputs, and outputs
- **Execution Status**: Visual indicators for node states (pending, running, completed, error)

## Technology Stack

### Core Technologies

- **React 19.1.1**: Modern React with hooks and context API
- **Vite 7.1.7**: Fast build tool and development server
- **@xyflow/react 12.8.6**: ReactFlow library for the workflow canvas
- **mui/x-tree-view 8.14.0**: TreeView library for the package manager

### UI Libraries

- **Material-UI (MUI) 7.3.4**: Component library for UI elements
- **Bootstrap 5.3.8**: CSS framework for layout and styling
- **React Bootstrap 2.10.10**: Bootstrap components for React
- **React Icons 5.5.0**: Icon library

### Development Tools

- **ESLint 9.39.1**: Code linting and quality checks
- **TypeScript ESLint**: Type checking support
- **@vitejs/plugin-react**: Vite plugin for React

## Project Structure

```
webAleaFront/
├── public/                 # Static assets
│   └── vite.svg
├── src/
│   ├── api/               # API client layer
│   │   └── managerAPI.js  # Backend API integration
│   ├── assets/            # Static assets (CSS, images, data)
│   │   ├── css/          # Stylesheets
│   │   │   ├── app.css
│   │   │   ├── custom_node.css
│   │   │   ├── modal.css
│   │   │   ├── package_manager.css
│   │   │   └── workspace.css
│   │   └── data_sample.json
│   ├── features/          # Feature-based modules
│   │   ├── logger/        # Logging system
│   │   │   ├── providers/ # Log context providers
│   │   │   └── ui/        # Log UI components
│   │   ├── nodes/         # Node components
│   │   │   ├── model/     # Node data models
│   │   │   └── ui/        # Node UI components
│   │   ├── package-manager/ # Package management
│   │   │   ├── model/     # Package data models
│   │   │   └── ui/        # Package UI components
│   │   ├── toolbar/       # Toolbar components
│   │   │   ├── model/     # Toolbar models
│   │   │   └── ui/        # Toolbar UI
│   │   └── workspace/     # Workspace components
│   │       ├── engine/    # WorkflowEngine
│   │       ├── hooks/     # Custom hooks
│   │       ├── model/     # Workflow models
│   │       ├── providers/ # Context providers
│   │       └── ui/        # Workspace UI
│   ├── service/           # Business logic services
│   │   └── PackageService.js
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # Application entry point
│   └── index.css          # Global styles
├── Dockerfile             # Docker configuration
├── eslint.config.js       # ESLint configuration
├── eslint.config.ts       # TypeScript ESLint config
├── index.html             # HTML template
├── package.json           # Dependencies and scripts
├── vite.config.js         # Vite configuration
└── README.md              
```

## Getting Started

### Prerequisites

- **Node.js**: Version 18 or higher (24.x recommended)
- **npm**: Version 9 or higher (comes with Node.js)
- **Backend Service**: The WebAlea backend must be running (see [webAleaBack README](../webAleaBack/README.md))

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd WebAlea/webAleaFront
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure the backend URL** (if needed):
   - The default backend URL is `http://localhost:8000/api/v1/manager`
   - To change it, edit `src/api/managerAPI.js` and update the `BASE_URL` constant

4. **Start the backend service**:
   - Ensure the WebAlea backend is running on port 8000
   - See the backend README for setup instructions

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

**Development Features:**
- Fast refresh for React components
- Source maps for debugging
- ESLint integration

**Linting:**
```bash
npm run lint
```

### Building for Production

Build the application for production:

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

**Preview the production build:**
```bash
npm run preview
```

The production build is optimized with:
- Code minification
- Tree shaking
- Asset optimization
- Source map generation (for debugging)

## Usage Guide

### Creating a Workflow

1. **Add Nodes**:
   - Browse packages in the left sidebar
   - Click on a node to add it to the canvas
   - Use primitive nodes (Float, String, Boolean) for input values

2. **Connect Nodes**:
   - Drag from an output handle to an input handle
   - Connections are validated by type compatibility

3. **Configure Nodes**:
   - Click on a node to view its details in the right panel
   - Edit input values directly in the node detail section
   - View node descriptions and parameter information

4. **Organize the Canvas**:
   - Drag nodes to reposition them
   - Use the minimap to navigate large workflows
   - Use zoom controls to adjust the view

### Managing Packages

#### Browsing Packages

1. Open the **Package Manager** sidebar (left panel)
2. Switch to the **Packages** tab to see installed OpenAlea packages
3. Expand package folders to see available nodes
4. Click on a node to add it to the workspace

#### Installing Packages

1. Switch to the **Install** tab in the Package Manager
2. Search for packages in the Conda openalea3 channel
3. Click **Install** next to a package
4. Wait for installation to complete
5. Refresh the Packages tab to see newly installed packages

#### Using Primitives

1. Switch to the **Primitives** tab
2. Choose from Float, String, or Boolean nodes
3. Add them to the canvas and configure their values

### Executing Workflows

1. **Validate Your Workflow**:
   - Ensure all mandatory inputs are connected or have values
   - Check for circular dependencies (the system will warn you)

2. **Run the Workflow**:
   - Click the **Play** button in the toolbar
   - Monitor progress in the progress bar
   - Watch execution logs in the console at the bottom

3. **Monitor Execution**:
   - Nodes change color to indicate their state:
     - Gray: Pending
     - Blue: Running
     - Green: Completed
     - Red: Error
   - View detailed logs in the console panel

4. **Stop Execution**:
   - Click the **Stop** button to cancel execution
   - Running nodes will be cancelled gracefully

### Exporting and Importing

#### Export a Workflow

1. Click the **Export** button (upload icon) in the toolbar
2. A JSON file will be downloaded containing your workflow
3. Share this file to collaborate with others

#### Import a Workflow

1. Click the **Import** button (download icon) in the toolbar
2. Paste your workflow JSON or select a file
3. The workflow will be loaded into the canvas

**Workflow JSON Format:**
```json
{
  "nodes": [
    {
      "id": "n1234-nodeName",
      "type": "custom",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "Node Name",
        "packageName": "package.name",
        "nodeName": "NodeName"
      },
      "inputs": [...],
      "outputs": [...]
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1234-node1",
      "target": "n5678-node2",
      "sourceHandle": "output_0",
      "targetHandle": "input_0"
    }
  ]
}
```

## Architecture

### Component Hierarchy

```
App
├── Header (Navigation)
├── ToolBar
│   ├── Export/Import/Info Buttons
│   ├── Progress Bar & Status
│   └── Run/Stop Buttons
├── PackageManager (Sidebar)
│   ├── PanelModuleNode (Packages Tab)
│   ├── PanelPrimitiveNode (Primitives Tab)
│   └── PanelInstallPackage (Install Tab)
├── Workspace (Main Canvas)
│   ├── ReactFlow Canvas
│   ├── CustomNode (OpenAlea nodes)
│   ├── FloatNode / StringNode / BoolNode (Primitives)
│   └── CustomHandle (Connection points)
├── NodeDetailSection (Right Panel)
│   ├── NodeDescription
│   └── NodeParameters
│       ├── NodeInputFloat
│       ├── NodeInputString
│       ├── NodeInputBoolean
│       └── NodeInputEnum
└── ConsoleLog (Bottom Panel)
```

### State Management

The application uses React Context API for state management:

#### FlowContext

Manages workflow state (nodes, edges, execution):
- **Location**: `src/features/workspace/providers/FlowContext.jsx`
- **Provides**: Nodes, edges, current node, execution status, workflow engine
- **Methods**: `addNode`, `deleteNode`, `updateNode`, `executeWorkflow`, `stopWorkflow`

#### LogContext

Manages logging and console output:
- **Location**: `src/features/logger/providers/LogContext.jsx`
- **Provides**: Log entries, log levels, filtering
- **Methods**: `addLog`, `clearLogs`, `setLogLevel`

### Workflow Engine

The `WorkflowEngine` class handles asynchronous workflow execution:

**Key Features:**
- **Dependency Tracking**: Tracks node dependencies and input states
- **Parallel Execution**: Executes independent nodes concurrently
- **Cycle Detection**: Validates workflows for circular dependencies
- **Error Propagation**: Skips dependent nodes when a dependency fails
- **Event System**: Emits events for real-time UI updates

**Execution Flow:**
1. Validation: Check for cycles and unconnected inputs
2. Dependency Resolution: Build dependency graph
3. Initial Execution: Start with root nodes (no dependencies)
4. Propagation: As nodes complete, mark dependent nodes as ready
5. Parallel Execution: Execute all ready nodes simultaneously
6. Completion: Emit final results and status

**Node States:**
- `PENDING`: Waiting for dependencies
- `READY`: Ready to execute
- `RUNNING`: Currently executing
- `COMPLETED`: Successfully completed
- `ERROR`: Execution failed
- `SKIPPED`: Skipped due to dependency failure
- `CANCELLED`: Cancelled by user

### API Integration

The frontend communicates with the backend via REST API:

**Base URL**: `http://localhost:8000/api/v1/manager`

**Endpoints Used:**
- `GET /` - List all Conda packages
- `GET /latest` - Get latest package versions
- `GET /installed` - List installed OpenAlea packages
- `GET /wralea` - List packages with visual nodes
- `GET /installed/{packageName}` - Get nodes for a package
- `POST /install` - Install packages
- `POST /execute/node` - Execute a single node

**API Client**: `src/api/managerAPI.js`

All API calls are asynchronous and include error handling. The client uses the Fetch API with JSON serialization.

## Configuration

### Environment Variables

Currently, the backend URL is hardcoded in `src/api/managerAPI.js`. To make it configurable:

1. Create a `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api/v1/manager
   ```

2. Update `managerAPI.js`:
   ```javascript
   const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1/manager";
   ```

### Vite Configuration

The Vite configuration (`vite.config.js`) can be customized for:
- Proxy settings (for CORS during development)
- Build optimizations
- Plugin configuration

Example proxy configuration:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
```

## Docker Deployment

### Building the Docker Image

```bash
docker build -t webalea-frontend .
```

### Running with Docker

```bash
docker run -p 3000:3000 webalea-frontend
```

### Docker Compose

The frontend is included in the main `docker-compose.yml`:

```bash
docker-compose up frontend
```

Or run both frontend and backend:

```bash
docker-compose up
```

The frontend will be available at `http://localhost:3000`.

**Note**: Ensure the backend service is accessible from the frontend container. If running in Docker, use the service name (e.g., `http://backend:8000`) instead of `localhost`.

## Troubleshooting

### Common Issues

#### Backend Connection Errors

**Problem**: "Failed to fetch" or CORS errors

**Solutions**:
- Ensure the backend is running on port 8000
- Check CORS configuration in the backend
- Verify the API URL in `src/api/managerAPI.js`
- Check browser console for detailed error messages

#### Package Installation Fails

**Problem**: Packages don't install or appear

**Solutions**:
- Check backend logs for installation errors (./app/logs)
- Verify Conda environment is properly configured
- Ensure sufficient disk space
- Check network connectivity

#### Workflow Execution Hangs

**Problem**: Workflow execution doesn't complete

**Solutions**:
- Check for circular dependencies
- Verify all mandatory inputs are connected
- Check backend logs for node execution errors
- Use the Stop button and review error messages

#### Nodes Don't Appear

**Problem**: Packages installed but nodes not visible

**Solutions**:
- Refresh the Packages tab
- Check if the package has wralea entry points
- Verify package installation completed successfully
- Check browser console for errors

### Debugging

1. **Browser DevTools**:
   - Open Developer Tools (F12)
   - Check Console for errors
   - Monitor Network tab for API calls
   - Use React DevTools extension for component inspection

2. **Logging**:
   - Check the Console Log panel in the application
   - Review execution logs for detailed information
   - Backend logs provide additional context

3. **State Inspection**:
   - Use React DevTools to inspect component state
   - Check FlowContext and LogContext values
   - Monitor WorkflowEngine state changes

For backend documentation, see [webAleaBack README](../webAleaBack/README.md).  
For project overview, see [Main README](../README.md).
