import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
    resolve: {
        dedupe: ['vue'],
        alias: {
            'vue': path.resolve(__dirname, 'node_modules/vue'),
        },
    },
    plugins: [
        {
            name: 'dynamic-terminal-proxy',
            configureServer(server) {
                // Use the same proxy library Vite uses internally
                const httpProxy = require('http-proxy')
                const proxy = httpProxy.createProxyServer({
                    changeOrigin: true,
                    ws: true
                })

                // Intercept HTTP requests
                server.middlewares.use((req, res, next) => {
                    const match = req.url?.match(/^\/proxy\/(\d+)(.*)/)
                    if (match) {
                        const port = match[1]
                        const rest = match[2] || '/'
                        req.url = rest
                        proxy.web(req, res, { target: `http://127.0.0.1:${port}` }, (e: any) => {
                            console.error(`[Proxy Error Port ${port}]:`, e.message)
                            res.statusCode = 502
                            res.end(`Proxy error: ${e.message}`)
                        })
                        return
                    }
                    next()
                })

                // Intercept WebSocket upgrades
                server.httpServer?.on('upgrade', (req, socket, head) => {
                    const match = req.url?.match(/^\/proxy\/(\d+)(.*)/)
                    if (match) {
                        const port = match[1]
                        const rest = match[2] || '/'
                        req.url = rest
                        proxy.ws(req, socket, head, { target: `http://127.0.0.1:${port}` })
                        return
                    }
                })
            }
        }
    ],
    server: {
        // We handle proxying via the plugin above for better reliability
    }
})
