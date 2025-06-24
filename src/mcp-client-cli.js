#!/usr/bin/env node

/**
 * CLI interface for MCP Client
 * Provides interactive shell and command-line access to Claude Code's VS Code bridge
 */

const MCPClient = require('./mcp-client')
const readline = require('readline')

/**
 * Interactive shell for MCP commands
 */
async function interactiveShell() {
  const client = new MCPClient()

  if (!(await client.selectWorkspace())) {
    return
  }

  console.log('\nMCP Client Interactive Shell')
  console.log('Type "help" for available commands or "quit" to exit\n')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  const showHelp = () => {
    console.log('\nAvailable commands:')
    console.log('  help                 - Show this help message')
    console.log('  init/initialize      - Initialize MCP connection')
    console.log('  tools/list           - List available tools')
    console.log('  workspace            - Show workspace folders')
    console.log('  editors              - Show open editors')
    console.log('  selection            - Show current selection')
    console.log('  open <file>          - Open a file')
    console.log('  save <file>          - Save a file')
    console.log('  exec <code>          - Execute code in notebook')
    console.log('  diagnostics [file]   - Show diagnostics')
    console.log('  diff <old> <new>     - Open diff view')
    console.log('  dirty <file>         - Check if file has unsaved changes')
    console.log('  quit/exit            - Exit the shell\n')
  }

  const processCommand = async (cmd) => {
    if (!cmd.trim()) return true

    const parts = cmd.trim().split(' ')
    const command = parts[0].toLowerCase()
    const args = parts.slice(1)

    try {
      switch (command) {
        case 'help':
          showHelp()
          break

        case 'quit':
        case 'exit':
          return false

        case 'init':
        case 'initialize':
          console.log('Reinitializing MCP connection...')
          await client.initialize()
          console.log('Connection reinitialized')
          break

        case 'tools':
        case 'list':
          const tools = await client.listTools()
          const toolList = tools.result?.tools || []
          console.log(`\nAvailable tools (${toolList.length}):`)
          toolList.forEach((tool) => {
            console.log(`  - ${tool.name}: ${tool.description || 'No description'}`)
          })
          break

        case 'workspace':
          const folders = await client.getWorkspaceFolders()
          if (folders.workspaceFolders && folders.workspaceFolders.length > 0) {
            console.log('\nWorkspace folders:')
            folders.workspaceFolders.forEach((folder) => {
              console.log(`  - ${folder}`)
            })
          } else {
            console.log('No workspace folders found')
          }
          break

        case 'editors':
          const editorsResponse = await client.getOpenEditors()
          const editors = editorsResponse.content ? JSON.parse(editorsResponse.content[0].text) : editorsResponse
          const editorList = editors.editors || []
          if (editorList.length > 0) {
            console.log('\nOpen editors:')
            editorList.forEach((editor) => {
              console.log(`  - ${editor.fileName || 'Unknown'}`)
            })
          } else {
            console.log('No open editors')
          }
          break

        case 'selection':
          const selection = await client.getCurrentSelection()
          if (selection && Object.keys(selection).length > 0) {
            console.log('\nCurrent selection:')
            if (selection.filePath) console.log(`  File: ${selection.filePath}`)
            if (selection.selectedText) console.log(`  Text: ${selection.selectedText}`)
            if (selection.startLine !== undefined) console.log(`  Start line: ${selection.startLine}`)
            if (selection.endLine !== undefined) console.log(`  End line: ${selection.endLine}`)
          } else {
            console.log('No active selection')
          }
          break

        case 'open':
          if (args.length === 0) {
            console.log('Usage: open <file>')
            break
          }
          const filePath = args.join(' ')
          await client.openFile(filePath)
          console.log(`Opened: ${filePath}`)
          break

        case 'save':
          if (args.length === 0) {
            console.log('Usage: save <file>')
            break
          }
          const saveFile = args.join(' ')
          await client.saveDocument(saveFile)
          console.log(`Saved: ${saveFile}`)
          break

        case 'exec':
          if (args.length === 0) {
            console.log('Usage: exec <code>')
            break
          }
          const code = args.join(' ')
          const result = await client.executeCode(code)
          console.log('Execution completed')
          if (result.output) {
            console.log('Output:', result.output)
          }
          break

        case 'diagnostics':
          const diagFile = args.join(' ') || null
          const diagnostics = await client.getDiagnostics(diagFile)
          if (diagnostics.diagnostics && diagnostics.diagnostics.length > 0) {
            console.log('\nDiagnostics:')
            diagnostics.diagnostics.forEach((diag) => {
              console.log(`  - ${diag.severity}: ${diag.message} (${diag.source})`)
              if (diag.file) console.log(`    File: ${diag.file}`)
              if (diag.range) console.log(`    Line: ${diag.range.start.line}`)
            })
          } else {
            console.log('No diagnostics found')
          }
          break

        case 'diff':
          if (args.length < 2) {
            console.log('Usage: diff <old_file> <new_file>')
            break
          }
          const [oldFile, newFile] = args
          await client.openDiff(oldFile, newFile, '', `Diff: ${oldFile} vs ${newFile}`)
          console.log('Diff view opened')
          break

        case 'dirty':
          if (args.length === 0) {
            console.log('Usage: dirty <file>')
            break
          }
          const checkFile = args.join(' ')
          const dirty = await client.checkDocumentDirty(checkFile)
          console.log(`${checkFile}: ${dirty.isDirty ? 'has unsaved changes' : 'no changes'}`)
          break

        default:
          console.log(`Unknown command: ${command}`)
          console.log('Type "help" for available commands')
      }
    } catch (error) {
      console.error(`Error: ${error.message}`)
    }

    return true
  }

  const askQuestion = () => {
    rl.question('mcp> ', async (answer) => {
      const shouldContinue = await processCommand(answer)
      if (shouldContinue) {
        askQuestion()
      } else {
        rl.close()
        client.disconnect()
        console.log('\nGoodbye!')
      }
    })
  }

  // Show help on start
  showHelp()
  askQuestion()
}

/**
 * Execute a single command and exit
 */
async function executeCommand(command, args) {
  const client = new MCPClient()

  if (!(await client.selectWorkspace())) {
    process.exit(1)
  }

  try {
    switch (command) {
      case 'list-tools':
        const tools = await client.listTools()
        const toolList = tools.result?.tools || []
        toolList.forEach((tool) => {
          console.log(`${tool.name}: ${tool.description || 'No description'}`)
        })
        break

      case 'open':
        if (args.length === 0) {
          console.error('Error: File path required')
          process.exit(1)
        }
        await client.openFile(args.join(' '))
        console.log('File opened')
        break

      case 'workspace':
        const folders = await client.getWorkspaceFolders()
        if (folders.workspaceFolders) {
          folders.workspaceFolders.forEach((folder) => console.log(folder))
        }
        break

      default:
        console.error(`Unknown command: ${command}`)
        console.log('Available commands: list-tools, open, workspace')
        process.exit(1)
    }
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  } finally {
    client.disconnect()
  }
}

/**
 * Quick demo of MCP Client capabilities
 */
async function runDemo() {
  const client = new MCPClient()

  console.log('MCP Client Demo\n')

  if (!(await client.selectWorkspace())) {
    return
  }

  console.log('\n--- Workspace Information ---')

  try {
    // Get workspace folders
    const folders = await client.getWorkspaceFolders()
    if (folders.workspaceFolders && folders.workspaceFolders.length > 0) {
      console.log('Workspace folders:')
      folders.workspaceFolders.forEach((folder) => {
        console.log(`  - ${folder}`)
      })
    }

    // Get open editors
    const editorsResponse = await client.getOpenEditors()
    const editors = editorsResponse.content ? JSON.parse(editorsResponse.content[0].text) : editorsResponse
    const editorList = editors.editors || []
    if (editorList.length > 0) {
      console.log('\nOpen editors:')
      editorList.forEach((editor) => {
        console.log(`  - ${editor.fileName || 'Unknown'}`)
      })
    }

    // Check current selection
    const selection = await client.getCurrentSelection()
    if (selection && Object.keys(selection).length > 0 && selection.selectedText) {
      console.log('\nCurrent selection:')
      console.log(`  File: ${selection.filePath || 'Unknown'}`)
      console.log(`  Text: "${selection.selectedText.substring(0, 50)}${selection.selectedText.length > 50 ? '...' : ''}"`)
    }

    console.log('\nDemo completed successfully!')
    console.log('Run with "shell" argument for interactive mode')
  } catch (error) {
    console.error(`\nDemo error: ${error.message}`)
  } finally {
    client.disconnect()
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2)

  // Handle help without connecting
  if (args.length > 0 && (args[0] === '--help' || args[0] === '-h' || args[0] === 'help')) {
    console.log('MCP Client CLI - Connect to Claude Code VS Code bridge\n')
    console.log('Usage: mcp-client-cli [command] [options]\n')
    console.log('Commands:')
    console.log('  demo                 Run demo mode (default)')
    console.log('  shell, interactive   Start interactive shell')
    console.log('  list-tools          List available tools')
    console.log('  open <file>         Open a file')
    console.log('  workspace           Show workspace folders')
    console.log('  help, --help, -h    Show this help\n')
    console.log('Examples:')
    console.log('  mcp-client-cli')
    console.log('  mcp-client-cli shell')
    console.log('  mcp-client-cli open README.md')
    return
  }

  if (args.length === 0) {
    // Default to demo mode
    runDemo().catch(console.error)
  } else if (args[0] === 'shell' || args[0] === 'interactive') {
    // Interactive shell mode
    interactiveShell().catch(console.error)
  } else if (args[0] === 'demo') {
    // Explicit demo mode
    runDemo().catch(console.error)
  } else {
    // Command mode
    executeCommand(args[0], args.slice(1)).catch(console.error)
  }
}

module.exports = { interactiveShell, executeCommand, runDemo }