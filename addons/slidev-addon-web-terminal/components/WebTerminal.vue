<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { AttachAddon } from 'xterm-addon-attach'
import 'xterm/css/xterm.css'

const props = defineProps<{
  wsUrl?: string
  backendUrl?: string
}>()

const terminalContainer = ref<HTMLElement | null>(null)
let terminal: Terminal | null = null
let socket: WebSocket | null = null
let fitAddon: FitAddon | null = null
let attachAddon: AttachAddon | null = null
let pid: string | null = null

const initTerminal = async () => {
    if (!terminalContainer.value) return

    // Initialize Terminal
    terminal = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        macOptionIsMeta: true,
        scrollback: 10000,
        tabStopWidth: 10,
        allowProposedApi: true
    })

    // Initialize Addons
    fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(webLinksAddon)

    terminal.open(terminalContainer.value)
    fitAddon.fit()
    terminal.focus()

    // Handle resizing
    window.addEventListener('resize', handleResize)
    
    // Determine connection URL
    let connectionUrl = props.wsUrl
    
    if (!connectionUrl && props.backendUrl) {
      try {
        let cleanBackendUrl = props.backendUrl.replace(/\/$/, '')
        
        // Check if we are pointing to a cross-origin backend
        try {
            const url = new URL(cleanBackendUrl, window.location.origin)
            if (url.origin !== window.location.origin) {
                const protocol = url.protocol.replace(':', '')
                const host = url.hostname
                // url.port is empty if it's the default (80/443) or omitted
                const port = url.port || (url.protocol === 'https:' ? '443' : '80')
                
                // Rewrite to use our dynamic proxy in vite.config.ts
                // Pattern: /proxy/protocol/host/port
                cleanBackendUrl = `/proxy/${protocol}/${host}/${port}`
            }
        } catch (e) {
            console.warn(`URL parsing failed for backendUrl with error ${e}, falling back to original: ${cleanBackendUrl}`)
        }

        const response = await fetch(`${cleanBackendUrl}/api/terminals`, { method: 'POST' })
        if (response.ok) {
           pid = await response.text()
           
           // Construct WS URL
           if (cleanBackendUrl.startsWith('/proxy/')) {
               // Use relative WS URL for the proxy
               const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
               connectionUrl = `${protocol}//${window.location.host}${cleanBackendUrl}/terminals/${pid}`
           } else {
               const url = new URL(cleanBackendUrl, window.location.href)
               const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
               connectionUrl = `${protocol}//${url.host}/terminals/${pid}`
           }
        } else {
             console.error('Failed to create terminal:', response.statusText)
             terminal.write(`\r\nFailed to create terminal: ${response.statusText}\r\n`)
             return
        }
      } catch (e) {
         console.error('Error creating terminal:', e)
         terminal.write(`\r\nError creating terminal: ${e}\r\n`)
         return
      }
    }

    // Connect to WebSocket
    if (connectionUrl) {
       // If using proxy (relative backendUrl), connectionUrl might be ws://localhost:3030/terminals/pid
       // which is correct for Vite proxy.
       connectWebSocket(connectionUrl)
    } else {
       terminal.write('\r\nNo WebSocket URL or Backend URL provided.\r\n')
    }
}

const connectWebSocket = (url: string) => {
    socket = new WebSocket(url)

    socket.onopen = () => {
        if (terminal && socket) {
            attachAddon = new AttachAddon(socket)
            terminal.loadAddon(attachAddon)
            
            // Resize adjustment
            if(fitAddon) fitAddon.fit()
            
            terminal.focus()
        }
    }

    socket.onclose = () => {
        if (terminal) {
            terminal.write('\r\nConnection closed.\r\n')
        }
    }
    
    socket.onerror = (err) => {
        console.error("WebSocket error:", err)
        if (terminal) {
            terminal.write('\r\nWebSocket error.\r\n')
        }
    }
}

const handleResize = () => {
    if (fitAddon) {
        fitAddon.fit()
    }
}

const dispose = () => {
    window.removeEventListener('resize', handleResize)
    if (socket) {
        socket.close()
        socket = null
    }
    if (terminal) {
        terminal.dispose()
        terminal = null
    }
}

onMounted(() => {
    initTerminal()
})

onUnmounted(() => {
    dispose()
})

watch(() => [props.wsUrl, props.backendUrl], () => {
    dispose()
    initTerminal()
})

</script>

<template>
  <div 
    class="web-terminal-wrapper"
  >
    <div 
      ref="terminalContainer" 
      class="web-terminal-container" 
    />
  </div>
</template>

<style scoped>
.web-terminal-wrapper {
  width: 100%;
  height: 100%;
  padding: 1rem;
  background-color: #000;
  border-radius: 4px;
  overflow: hidden;
}

.web-terminal-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}
</style>
