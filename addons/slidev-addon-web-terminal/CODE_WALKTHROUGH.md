# Code Walkthrough: Web Terminal Addon

This document explains the internal working of the `slidev-addon-web-terminal`.

## Architecture

The addon consists of a Vue 3 component (`WebTerminal`) that wraps [xterm.js](https://xtermjs.org/). It communicates with a backend service to spawn shell processes and stream their input/output over WebSockets.

### Backend (Docker)
The backend (running via `berttejeda/bill-webterminal`) is a Python application (likely using `tornado` and `terminado`) that:
1.  **Exposes a REST API**: `POST /api/terminals` creates a new terminal process and returns its Process ID (PID).
2.  **Exposes a WebSocket Endpoint**: `/terminals/{pid}` allows bidirectional communication with the specific terminal process.

### Frontend Component (`WebTerminal.vue`)

Located at `components/WebTerminal.vue`, this component handles the lifecycle of the terminal.

#### 1. Initialization (`initTerminal`)
When the component mounts, `initTerminal` is called:
- **XTerm instantiation**: Creates a `new Terminal(...)` with configuration for cursor usage and scrolling.
- **Addons**: Loads `xterm-addon-fit` (for resizing) and `xterm-addon-web-links` (for clickable links).

#### 2. Connection Logic
The component supports two modes of connection via props:

**A. `backendUrl` (Recommended)**
If `backendUrl` is provided (e.g., `http://localhost:10001`):
1.  The component sends a `POST` request to `${backendUrl}/api/terminals`.
2.  The backend spawns a shell and returns a `pid`.
3.  The component constructs a WebSocket URL: `ws://localhost:10001/terminals/{pid}`.
4.  It connects using this dynamic URL.

**B. `wsUrl` (Direct)**
If `wsUrl` is provided, the component skips the API call and connects directly to the WebSocket. This is useful for static or pre-allocated sessions.

#### 3. WebSocket Handling (`connectWebSocket`)
Using `xterm-addon-attach`:
- The WebSocket stream is piped directly into the XTerm instance.
- Data typed in the browser terminal is sent to the backend.
- Output from the backend shell is rendered in the browser terminal.

#### 4. Lifecycle Management
- **Resize Observer**: Listens for window resize events to adjust the terminal dimensions via `fitAddon`.
- **Cleanup (`dispose`)**: When the slide changes or component unmounts, the WebSocket connection is closed and the terminal instance is destroyed to prevent memory leaks.

## Key Dependencies

- **xterm**: The core terminal emulator.
- **xterm-addon-attach**: Connects xterm to a WebSocket.
- **xterm-addon-fit**: robustly handles resizing the terminal to fill its parent container.
