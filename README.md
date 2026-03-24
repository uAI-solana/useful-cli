# useful-ai

One command to connect your AI agents to 200+ tools.

```bash
npx useful-ai
```

Detects which AI agent platforms you have in your project, then installs [Useful AI](https://usefulai.fun) skill files and MCP configs so your agents can use the full tool library.

## How it works

```
$ npx useful-ai

  useful ai

  Detected: Claude Code, Cursor, VS Code

  What would you like to install?
  > [x] Skill file (recommended)
    [ ] MCP server

  Install to which platforms?
  > [x] Claude Code
    [x] Cursor
    [x] VS Code

  ✓ Installed skill to .claude/skills/useful-ai/SKILL.md
  ✓ Installed skill to .cursor/skills/useful-ai/SKILL.md
  ✓ Installed skill to .vscode/skills/useful-ai/SKILL.md

  Your agents can now use 200+ tools from usefulai.fun
```

## Supported platforms

- Claude Code
- Gemini CLI
- Cursor
- VS Code
- Windsurf
- OpenCode
- OpenHands
- Junie
- Zed

## Options

```bash
npx useful-ai              # Scans home directory, installs to detected platforms
npx useful-ai --local      # Install in current project directory instead
npx useful-ai --skill      # Skill file only, skip prompts
npx useful-ai --mcp        # MCP config only, skip prompts
npx useful-ai -y           # Accept all defaults (skill file, all platforms)
```

## What gets installed

**Skill file** (recommended): A markdown file that teaches your agent how to call 200+ tools via the Useful AI dispatch API. Dropped into your platform's skills directory.

**MCP server**: Adds the Useful AI MCP endpoint to your platform's config. Your agent gets a dynamic, auto-updating list of named tools (20+) plus a dispatch catch-all for 200+ more. The tool list refreshes based on real usage data.

Both are free, no auth required.

## Links

- **Website:** https://usefulai.fun
- **Docs:** https://usefulai.fun/docs
- **Skills repo:** https://github.com/uAI-solana/useful-ai-skills
- **MCP repo:** https://github.com/uAI-solana/useful-ai-mcp
