# not-really-mcp-client

![Version](https://img.shields.io/badge/version-1.0.0--existential--crisis-ff69b4)
![Downloads](https://img.shields.io/badge/downloads-just%20me-red)
![Build Status](https://img.shields.io/badge/build-probably%20broken-orange)
![Coverage](https://img.shields.io/badge/coverage-0%25-critical)
![Mood](https://img.shields.io/badge/mood-questionable-yellow)
![Coffee Consumed](https://img.shields.io/badge/coffee%20consumed-∞-brown)
![Bugs](https://img.shields.io/badge/bugs-yes-green)
![Works On My Machine](https://img.shields.io/badge/works%20on-my%20machine-blue)
![Maintained](https://img.shields.io/badge/maintained-when%20I%20feel%20like%20it-lightgrey)
![PRs Welcome](https://img.shields.io/badge/PRs-sure%20why%20not-brightgreen)
![License](https://img.shields.io/badge/license-MIT%20(Maybe%20It's%20Terrible)-blueviolet)
![Existential Dread](https://img.shields.io/badge/existential%20dread-100%25-black)
![JavaScript](https://img.shields.io/badge/javascript-regrettably-yellow)
![Sadness Level](https://img.shields.io/badge/sadness-maximum-blue)
![Will It Blend](https://img.shields.io/badge/will%20it%20blend-don't%20try-red)

> A confusingly-named Node.js client that connects to Claude Code's VS Code bridge (not actually MCP, but who's checking?). Nobody asked for it, nobody needs it, and yet here it is, taking up precious bytes on your hard drive with its misleading name, much like my career takes up space in the vast void of meaninglessness.

## IMPORTANT DISCLAIMER: Not Actually MCP

Despite the name, this isn't a real MCP (Model Context Protocol) client. It's more like a WebSocket connector to Claude Code's VS Code integration that happens to use JSON-RPC. I called it an MCP client because... honestly, I don't know. Poor life choices? A desire to confuse future developers? The eternal human need to mislabel things? Yes.

## Why This Exists

Look, I don't know. You don't know. Nobody knows. It's like asking why we're all here, floating on a rock through space. This library connects to Claude Code's VS Code extension through WebSockets because... reasons? It's about as useful as a chocolate teapot, but at least the teapot would taste good.

## Features That Nobody Cares About

- 🎯 **Auto-discovery of Claude Code instances** - Because manually finding things is so 2023
- 🔌 **WebSocket connections with authentication** - Security theater at its finest
- 🔄 **Automatic reconnection** - It's like a bad relationship, it just won't let go
- 🛠️ **VS Code tool interactions** - Control VS Code programmatically, because clicking is hard
- 😭 **Interactive shell** - For when you want to feel like a hacker but you're really just typing commands that do nothing important
- 📟 **CLI interface** - Because GUIs are for people who have their lives together

## Installation

```bash
npm install not-really-mcp-client
```

Or don't. I'm not your supervisor.

## Usage

```javascript
const MCPClient = require('./mcp-client')
const client = new MCPClient()

// This will probably work, or it won't. Life is uncertain.
await client.selectWorkspace()
await client.openFile('/path/to/your/broken/dreams.js')
```

## Quick Start (If You Really Must)

```bash
# Run the demo that demonstrates nothing of value
npm start
npm run demo

# Interactive shell for maximum disappointment
npm run shell
npm run interactive

# Direct CLI usage (if npm link'd)
mcp-client shell
mcp-client demo
mcp-client list-tools
```

## API Documentation

Ha! You think there's documentation? That's adorable. Read the code. Or don't. The universe is indifferent to your struggles.

### Methods That Exist (For Some Reason)

- `selectWorkspace()` - Selects a workspace, because choosing is what humans do
- `openFile()` - Opens files, revolutionary technology
- `saveDocument()` - Saves documents, groundbreaking stuff
- `executeCode()` - Executes code in notebooks, probably
- `getCurrentSelection()` - Gets what you selected, mind-blowing
- Other methods that do things, probably

## Requirements

- Node.js >= 14.0.0 (or higher, or lower, who's checking?)
- Claude Code running in VS Code (obviously)
- A sense of purpose (optional, clearly I don't have one)
- Coffee (mandatory)

## Contributing

Why would you want to? But if you insist on adding to this monument of questionable decisions:

1. Fork it (like your career path)
2. Create your feature branch (`git checkout -b feature/more-sadness`)
3. Commit your changes (`git commit -am 'Add some feature nobody needs'`)
4. Push to the branch (`git push origin feature/more-sadness`)
5. Create a Pull Request (I'll review it when I'm done questioning my life choices)

## Support

There is none. Just like my emotional support system.

## Known Issues

- Everything is an issue if you think about it hard enough
- Sometimes it works
- Sometimes it doesn't
- Such is life

## Future Plans

- Add more features nobody asked for
- Fix bugs that nobody reported
- Continue existing in a state of perpetual confusion
- Maybe add TypeScript support (haha, just kidding)

## Acknowledgments

- Thanks to coffee for making this possible
- Thanks to imposter syndrome for keeping me humble
- Thanks to Stack Overflow for doing 90% of the work
- Thanks to you for reading this far (seriously, why?)

## Author

A developer who makes poor life choices and even poorer libraries.

## Fun Facts

- This README is longer than the actual useful code
- Time spent writing sarcastic documentation: 2 hours
- Time spent writing actual code: 30 minutes
- Regrets: Immeasurable

## Final Words

If you've made it this far, you either have too much time on your hands or you're procrastinating on something important. Either way, welcome to the club. We have cookies, but they're probably stale.

Remember: Every npm install of this package is a small victory against the void. Or maybe it's just adding to the node_modules black hole. Who can say?

---

*"It's not a bug, it's an existential feature."* - Me, probably

![Footer Image](https://img.shields.io/badge/why%20are%20you%20still%20here-seriously-red)