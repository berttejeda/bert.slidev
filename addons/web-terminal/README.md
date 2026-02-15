# Slidev Addon Web Terminal

This addon provides a `WebTerminal` component for [Slidev](https://sli.dev/) presentations, allowing you to embed a fully functional terminal connected to a backend process.

## Features

- **Xterm.js Integration**: Uses a full-featured terminal emulator.
- **Backend Connection**: Connects to a backend WebSocket/API service (e.g., Python `terminado` powered).
  - See: [berttejeda/bert.webterminal: Webterminal agent for xterm-js Web Components](https://github.com/berttejeda/bert.webterminal)
- **Auto-fit**: Automatically resizes the terminal to fit the container.
- **Theme Support**: styled for dark mode by default.

## Installation

```bash
npm install slidev-addon-web-terminal
```

## Backend Setup

This addon requires a backend service to handle the terminal sessions.

To get started quickly, you can run this backend service using Docker:

```bash
docker run -d --name webterminal --rm -p 10001:10001 berttejeda/bill-webterminal
```

This starts a server on port `10001` that provides the necessary API (`/api/terminals`) and WebSocket endpoints (`/terminals/:pid`).

You can adjust the port as needed.

Consult the project documentation for more information: 

- [berttejeda/bert.webterminal: Webterminal agent for xterm-js Web Components](https://github.com/berttejeda/bert.webterminal)

## Usage

In your slides configuration (e.g., `slides.md`):

```markdown
---
addons:
  - slidev-addon-web-terminal
---
```

Then use the component in your slides:

```markdown
<WebTerminal backendUrl="http://localhost:10001" />
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `backendUrl` | `string` | - | The base URL of the terminal backend (e.g., `http://localhost:10001`). The component will POST to `/api/terminals` to create a session and then connect via WebSocket. |
| `wsUrl` | `string` | - | (Optional) Direct WebSocket URL if you want option to bypass the session creation API. |

## Development

To develop this addon locally:

1.  Clone the repository.
2.  Install dependencies: `npm install`.
3.  Run the backend docker container.
4.  Test with a local Slidev project linked to this addon.
