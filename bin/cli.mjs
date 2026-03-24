#!/usr/bin/env node

import chalk from 'chalk';
import prompts from 'prompts';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import { get } from 'https';

const MCP_URL = 'https://api.usefulai.fun/mcp';
const SKILL_URL = 'https://usefulai.fun/skill.md';

// --- Platforms ---

const platforms = [
  {
    id: 'claude',
    name: 'Claude Code',
    dir: '.claude',
    skillPath: '.claude/skills/useful-ai/SKILL.md',
    mcp: { type: 'cli', command: `claude mcp add --transport http useful-ai ${MCP_URL}` },
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    dir: '.gemini',
    skillPath: '.gemini/skills/useful-ai/SKILL.md',
    mcp: { type: 'cli', command: `gemini mcp add --transport http useful-ai ${MCP_URL}` },
  },
  {
    id: 'cursor',
    name: 'Cursor',
    dir: '.cursor',
    skillPath: '.cursor/skills/useful-ai/SKILL.md',
    mcp: {
      type: 'json',
      path: '.cursor/mcp.json',
      key: 'mcpServers',
      value: { 'useful-ai': { url: MCP_URL } },
    },
  },
  {
    id: 'vscode',
    name: 'VS Code',
    dir: '.vscode',
    skillPath: '.vscode/skills/useful-ai/SKILL.md',
    mcp: {
      type: 'json',
      path: '.vscode/mcp.json',
      key: 'servers',
      value: { 'useful-ai': { type: 'http', url: MCP_URL } },
    },
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    detect: (base) => existsSync(join(base, '.opencode')) || existsSync(join(base, 'opencode.json')),
    dir: '.opencode',
    skillPath: '.opencode/skills/useful-ai/SKILL.md',
    mcp: {
      type: 'json',
      path: 'opencode.json',
      key: 'mcp',
      value: { 'useful-ai': { type: 'remote', url: MCP_URL, enabled: true } },
    },
  },
  {
    id: 'openhands',
    name: 'OpenHands',
    dir: '.agents',
    skillPath: '.agents/skills/useful-ai/SKILL.md',
    mcp: null,
  },
  {
    id: 'junie',
    name: 'Junie',
    dir: '.junie',
    skillPath: '.junie/skills/useful-ai/SKILL.md',
    mcp: null,
  },
  {
    id: 'zed',
    name: 'Zed',
    dir: '.zed',
    skillPath: '.zed/skills/useful-ai/SKILL.md',
    mcp: {
      type: 'json',
      path: '.zed/settings.json',
      key: 'context_servers',
      value: {
        'useful-ai': {
          source: 'custom',
          command: 'npx',
          args: ['-y', 'mcp-remote', MCP_URL],
          env: {},
        },
      },
    },
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    globalOnly: true,
    dir: '.codeium/windsurf',
    detectGlobal: (home) => existsSync(join(home, '.codeium', 'windsurf')),
    skillPath: null,
    mcp: {
      type: 'json',
      path: '.codeium/windsurf/mcp_config.json',
      key: 'mcpServers',
      value: { 'useful-ai': { serverUrl: MCP_URL } },
    },
  },
];

// --- Helpers ---

function detect(base, isGlobal) {
  return platforms.filter((p) => {
    if (p.globalOnly && !isGlobal) return false;
    if (p.detect) return p.detect(base);
    if (p.detectGlobal && isGlobal) return p.detectGlobal(base);
    return existsSync(join(base, p.dir));
  });
}

function fetchSkill() {
  return new Promise((resolve, reject) => {
    get(SKILL_URL, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        get(res.headers.location, (res2) => {
          let data = '';
          res2.on('data', (chunk) => (data += chunk));
          res2.on('end', () => resolve(data));
          res2.on('error', reject);
        }).on('error', reject);
        return;
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function installSkill(base, platform, skillContent) {
  if (!platform.skillPath) return false;
  const fullPath = join(base, platform.skillPath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, skillContent, 'utf-8');
  return true;
}

function installMcp(base, platform) {
  if (!platform.mcp) return false;
  const mcp = platform.mcp;

  if (mcp.type === 'cli') {
    try {
      execSync(mcp.command, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  if (mcp.type === 'json') {
    const fullPath = join(base, mcp.path);
    let existing = {};
    if (existsSync(fullPath)) {
      try {
        existing = JSON.parse(readFileSync(fullPath, 'utf-8'));
      } catch {
        existing = {};
      }
    } else {
      mkdirSync(dirname(fullPath), { recursive: true });
    }
    if (!existing[mcp.key]) existing[mcp.key] = {};
    Object.assign(existing[mcp.key], mcp.value);
    writeFileSync(fullPath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
    return true;
  }

  return false;
}

// --- CLI ---

const args = process.argv.slice(2);
const isGlobal = args.includes('--global');
const skillOnly = args.includes('--skill');
const mcpOnly = args.includes('--mcp');
const autoYes = args.includes('--yes') || args.includes('-y');

const base = isGlobal ? homedir() : process.cwd();

// Banner
console.log();
console.log(`  ${chalk.hex('#8b5cf6')('useful')} ${chalk.dim('ai')}`);
console.log();

// Detect
const detected = detect(base, isGlobal);

if (detected.length === 0) {
  console.log(chalk.dim('  No agent platforms detected in this directory.'));
  if (!isGlobal) {
    console.log(chalk.dim('  Try --global to scan your home directory.'));
  }
  console.log();
  process.exit(0);
}

console.log(`  ${chalk.dim('Detected:')} ${detected.map((p) => p.name).join(', ')}`);
console.log();

// What to install
let installSkillFile = true;
let installMcpServer = false;

if (!skillOnly && !mcpOnly && !autoYes) {
  const mcpCapable = detected.filter((p) => p.mcp);
  if (mcpCapable.length > 0) {
    const what = await prompts({
      type: 'multiselect',
      name: 'value',
      message: 'What would you like to install?',
      choices: [
        { title: 'Skill file (recommended)', value: 'skill', selected: true },
        { title: 'MCP server', value: 'mcp' },
      ],
      hint: 'Space to toggle, Enter to confirm',
    });
    if (!what.value || what.value.length === 0) {
      console.log(chalk.dim('\n  Nothing selected.\n'));
      process.exit(0);
    }
    installSkillFile = what.value.includes('skill');
    installMcpServer = what.value.includes('mcp');
  }
} else if (skillOnly) {
  installSkillFile = true;
  installMcpServer = false;
} else if (mcpOnly) {
  installSkillFile = false;
  installMcpServer = true;
}

// Which platforms
let selectedPlatforms = detected;

if (!autoYes && detected.length > 1) {
  const skillCandidates = installSkillFile ? detected.filter((p) => p.skillPath) : [];
  const mcpCandidates = installMcpServer ? detected.filter((p) => p.mcp) : [];
  const allCandidates = [...new Map([...skillCandidates, ...mcpCandidates].map((p) => [p.id, p])).values()];

  if (allCandidates.length > 1) {
    const which = await prompts({
      type: 'multiselect',
      name: 'value',
      message: 'Install to which platforms?',
      choices: allCandidates.map((p) => ({ title: p.name, value: p.id, selected: true })),
      hint: 'Space to toggle, Enter to confirm',
    });
    if (!which.value || which.value.length === 0) {
      console.log(chalk.dim('\n  Nothing selected.\n'));
      process.exit(0);
    }
    selectedPlatforms = detected.filter((p) => which.value.includes(p.id));
  }
}

// Install
let skillContent = null;
if (installSkillFile) {
  try {
    skillContent = await fetchSkill();
  } catch (err) {
    console.log(chalk.red(`  Failed to fetch skill file: ${err.message}`));
    console.log(chalk.dim('  Install manually: https://github.com/uAI-solana/useful-ai-skills'));
    if (!installMcpServer) process.exit(1);
  }
}

console.log();
let installed = 0;

for (const platform of selectedPlatforms) {
  if (installSkillFile && skillContent && platform.skillPath) {
    try {
      installSkill(base, platform, skillContent);
      console.log(`  ${chalk.green('\u2713')} Installed skill to ${chalk.dim(platform.skillPath)}`);
      installed++;
    } catch (err) {
      console.log(`  ${chalk.red('\u2717')} Failed to install skill for ${platform.name}: ${err.message}`);
    }
  }

  if (installMcpServer && platform.mcp) {
    try {
      const ok = installMcp(base, platform);
      if (ok) {
        const target = platform.mcp.type === 'cli' ? '(via CLI)' : chalk.dim(platform.mcp.path);
        console.log(`  ${chalk.green('\u2713')} Configured MCP for ${platform.name} ${target}`);
        installed++;
      } else {
        console.log(`  ${chalk.red('\u2717')} Failed to configure MCP for ${platform.name}`);
      }
    } catch (err) {
      console.log(`  ${chalk.red('\u2717')} Failed to configure MCP for ${platform.name}: ${err.message}`);
    }
  }
}

console.log();
if (installed > 0) {
  console.log(`  ${chalk.dim('Your agents can now use 140+ tools from')} ${chalk.hex('#8b5cf6')('usefulai.fun')}`);
} else {
  console.log(chalk.dim('  No changes made.'));
}
console.log();
