# Slidev Addon Web Terminal

This addon provides a `WebTerminal` component for [Slidev](https://sli.dev/) presentations, allowing you to embed a fully functional terminal connected to a backend process.

## Features

- **Xterm.js Integration**: Uses a full-featured terminal emulator.
- **Backend Connection**: Connects to a backend WebSocket/API service.
  - See: [berttejeda/bert.webterminal](https://github.com/berttejeda/bert.webterminal)
- **Zero-Config Dynamic Proxy**: Specify any `backendUrl` (including different domains and ports) in your markdown, and the addon handles CORS and proxying automatically.
- **Click to Execute**: Commands are automatically sent to the terminal when clicking an element with the `.clickable-code` class (e.g. a wrapper around a code block).
- **Auto-fit**: Automatically resizes the terminal to fit the container.
- **Theme Support**: Styled for dark mode by default.

## Installation

```bash
npm install slidev-addon-web-terminal
```

## Backend Setup

This addon requires a backend service to handle the terminal sessions.

To get started quickly, run the [Webterminal Agent](https://github.com/berttejeda/bert.webterminal) using Docker:

```bash
docker run -d --name webterminal --rm -p {{ HOSTPORT }}:10001 berttejeda/bill-webterminal
```

Example (port 10001):
```bash
docker run -d --name webterminal --rm -p 10001:10001 berttejeda/bill-webterminal
```

## Configuration

To enable the **Dynamic Port Proxy** (which solves CORS issues when using different hosts or ports), you must add the proxy plugin to your `vite.config.ts`.

### 1. Install `http-proxy`
```bash
npm install -s http-proxy
```

### 2. Update `vite.config.ts`
Add the following plugin to your Vite configuration:

```typescript
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    {
      name: 'dynamic-terminal-proxy',
      configureServer(server) {
        const httpProxy = require('http-proxy')
        const proxy = httpProxy.createProxyServer({ changeOrigin: true, ws: true })

        const proxyPattern = /^\/proxy\/([^\/]+)\/([^\/]+)\/([^\/]+)(.*)/

        server.middlewares.use((req, res, next) => {
          const match = req.url?.match(proxyPattern)
          if (match) {
            const [_, protocol, host, port, rest] = match
            const target = `${protocol}://${host}:${port}`
            req.url = rest || '/'
            proxy.web(req, res, { target, secure: protocol === 'https' }, (e) => {
              res.statusCode = 502
              res.end(`Proxy error: ${e.message}`)
            })
            return
          }
          next()
        })

        server.httpServer?.on('upgrade', (req, socket, head) => {
          const match = req.url?.match(proxyPattern)
          if (match) {
            const [_, protocol, host, port, rest] = match
            req.url = rest || '/'
            proxy.ws(req, socket, head, { target: `${protocol}://${host}:${port}`, secure: protocol === 'https' })
          }
        })
      }
    }
  ]
})
```

## Usage

In your slides configuration (e.g., `slides.md`):

```markdown
---
addons:
  - web-terminal
---
```

Then use the component in your slides. You can point to any backend URL directly:

```markdown
<!-- Localhost with default port -->
<WebTerminal backendUrl="http://localhost:10001" />

<!-- Arbitrary remote host (handles CORS automatically) -->
<WebTerminal backendUrl="https://my-websocket-host.example.com:4443" />
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `backendUrl` | `string` | - | The base URL of the terminal backend. If pointing to `localhost`, it automatically uses the dynamic proxy. |
| `wsUrl` | `string` | - | (Optional) Direct WebSocket URL to bypass session creation API. |

## Development

```bash
# Install dependencies
npm install

# Run linter
npm run lint
```
