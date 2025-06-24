#!/usr/bin/env node

const WebSocket = require('ws')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { v4: uuidv4 } = require('uuid')

class ClaudeMCPClient {
  constructor(port = null, token = null) {
    this.port = port
    this.token = token
    this.wsUrl = null
    this.ws = null
    this.isConnected = false
    this.isInitialized = false
    this.pendingRequests = new Map()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 3

    if (port && token) {
      this.wsUrl = `ws://127.0.0.1:${port}/`
    }
  }

  discoverLockFiles() {
    const lockDir = path.join(os.homedir(), '.claude', 'ide')
    const results = []

    if (!fs.existsSync(lockDir)) {
      return results
    }

    const files = fs.readdirSync(lockDir)
    const lockFiles = files.filter((file) => file.endsWith('.lock'))

    for (const file of lockFiles) {
      try {
        const lockPath = path.join(lockDir, file)
        const data = JSON.parse(fs.readFileSync(lockPath, 'utf8'))
        const port = parseInt(path.basename(file, '.lock'))

        data.port = port
        data.lockFile = lockPath
        results.push(data)
      } catch (error) {
        console.error(`Error reading ${file}:`, error.message)
      }
    }

    return results
  }

  async selectWorkspace(workspacePath = null) {
    const lockFiles = this.discoverLockFiles()

    if (lockFiles.length === 0) {
      console.log(
        'No Claude Code lock files found. Make sure Claude Code is running in VS Code.'
      )
      return false
    }

    let selected

    if (lockFiles.length === 1) {
      selected = lockFiles[0]
    } else if (workspacePath) {
      selected = lockFiles.find((lockData) => {
        const workspaceFolders = lockData.workspaceFolders || []
        return workspaceFolders.some((folder) => folder.includes(workspacePath))
      })

      if (!selected) {
        console.log(`No workspace found matching '${workspacePath}'`)
        console.log('Available workspaces:')
        lockFiles.forEach((lockData, i) => {
          console.log(`  ${i + 1}: ${lockData.workspaceFolders || []}`)
        })
        return false
      }
    } else {
      console.log('Multiple Claude Code instances found:')
      lockFiles.forEach((lockData, i) => {
        console.log(
          `  ${i + 1}: ${lockData.workspaceFolders || []} (port: ${
            lockData.port
          })`
        )
      })

      const readline = require('readline')
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })

      try {
        const answer = await new Promise((resolve) => {
          rl.question(`Select instance (1-${lockFiles.length}): `, resolve)
        })

        const choice = parseInt(answer) - 1
        if (isNaN(choice) || choice < 0 || choice >= lockFiles.length) {
          console.log('Invalid selection')
          return false
        }

        selected = lockFiles[choice]
      } finally {
        rl.close()
      }
    }

    this.port = selected.port
    this.token = selected.authToken
    this.wsUrl = `ws://127.0.0.1:${this.port}/`

    console.log(`Connected to workspace: ${selected.workspaceFolders || []}`)
    console.log(`IDE: ${selected.ideName || 'Unknown'}`)
    console.log(`Port: ${this.port}`)

    await this.connect()
    await this.initialize()

    return true
  }

  async connect() {
    if (!this.wsUrl || !this.token) {
      throw new Error('Must call selectWorkspace() first')
    }

    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl, {
        headers: {
          'x-claude-code-ide-authorization': this.token,
        },
      })

      this.ws.on('open', () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        resolve()
      })

      this.ws.on('message', (data) => {
        try {
          const reply = JSON.parse(data.toString())

          if (reply.id && this.pendingRequests.has(reply.id)) {
            const {
              resolve: resolveRequest,
              reject: rejectRequest,
              timeoutId,
            } = this.pendingRequests.get(reply.id)
            this.pendingRequests.delete(reply.id)
            clearTimeout(timeoutId)

            if (reply.error) {
              rejectRequest(
                new Error(
                  `RPC Error: ${
                    reply.error.message || JSON.stringify(reply.error)
                  }`
                )
              )
            } else {
              resolveRequest(reply)
            }
          }
        } catch (error) {}
      })

      this.ws.on('error', (error) => {
        this.isConnected = false
        reject(error)
      })

      this.ws.on('close', (code, reason) => {
        this.isConnected = false
        this.isInitialized = false

        for (const [id, { reject: rejectRequest, timeoutId }] of this
          .pendingRequests) {
          clearTimeout(timeoutId)
          rejectRequest(new Error('Connection closed'))
        }
        this.pendingRequests.clear()

        if (code === 1008) {
          reject(new Error('Authentication failed - invalid token'))
        } else if (
          code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.reconnectAttempts++
          setTimeout(() => {
            this.connect()
              .then(() => this.initialize())
              .catch(() => {})
          }, 1000 * this.reconnectAttempts)
        }
      })
    })
  }

  async rpcCall(method, params = {}) {
    if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected')
    }

    const message = {
      jsonrpc: '2.0',
      method: method,
      params: params,
    }

    if (method.includes('initialized')) {
      this.ws.send(JSON.stringify(message))
      return { result: 'notification sent' }
    }

    const msgId = uuidv4()
    message.id = msgId

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(msgId)
        reject(new Error('Request timed out'))
      }, 10000)

      this.pendingRequests.set(msgId, { resolve, reject, timeoutId })
      this.ws.send(JSON.stringify(message))
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
    this.isConnected = false
    this.isInitialized = false
    this.pendingRequests.clear()
  }

  async initialize() {
    if (this.isInitialized) {
      return
    }

    if (!this.isConnected) {
      throw new Error('Must connect before initializing')
    }

    try {
      const initResult = await this.rpcCall('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
        clientInfo: {
          name: 'claude-mcp-client',
          version: '1.0.0',
        },
      })

      await this.rpcCall('initialized', {})

      this.isInitialized = true
      return initResult
    } catch (error) {
      throw error
    }
  }

  async listTools() {
    try {
      const result = await this.rpcCall('tools/list')
      return result
    } catch (error) {
      throw error
    }
  }

  async callTool(toolName, parameters = {}) {
    const result = await this.rpcCall('tools/call', {
      name: toolName,
      arguments: parameters,
    })
    return result.result || {}
  }

  async getWorkspaceFolders() {
    return await this.callTool('getWorkspaceFolders')
  }

  async getOpenEditors() {
    return await this.callTool('getOpenEditors')
  }

  async openFile(filePath, startText = '', endText = '', options = {}) {
    const params = { filePath, startText, endText }

    if (options.preview !== undefined) params.preview = options.preview
    if (options.selectToEndOfLine !== undefined)
      params.selectToEndOfLine = options.selectToEndOfLine
    if (options.makeFrontmost !== undefined)
      params.makeFrontmost = options.makeFrontmost

    return await this.callTool('openFile', params)
  }

  async openFileWithSelection(filePath, startText, endText, options = {}) {
    return await this.openFile(filePath, startText, endText, options)
  }

  async getCurrentSelection() {
    return await this.callTool('getCurrentSelection')
  }

  async saveDocument(filePath) {
    return await this.callTool('saveDocument', { filePath })
  }

  async executeCode(code) {
    return await this.callTool('executeCode', { code })
  }

  async getDiagnostics(uri = null) {
    const params = uri ? { uri } : {}
    return await this.callTool('getDiagnostics', params)
  }

  async openDiff(old_file_path, new_file_path, new_file_contents, tab_name) {
    return await this.callTool('openDiff', {
      old_file_path,
      new_file_path,
      new_file_contents,
      tab_name,
    })
  }

  async closeTab(tab_name) {
    return await this.callTool('close_tab', { tab_name })
  }

  async closeAllDiffTabs() {
    return await this.callTool('closeAllDiffTabs')
  }

  async checkDocumentDirty(filePath) {
    return await this.callTool('checkDocumentDirty', { filePath })
  }

  async getLatestSelection() {
    return await this.callTool('getLatestSelection')
  }
}

module.exports = ClaudeMCPClient
