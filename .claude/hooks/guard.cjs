#!/usr/bin/env node
// Hook PreToolUse di Claude Code: applica all'agente le regole di git flow
// e di lavoro che GitHub non può imporre su un repository privato del piano
// Free (decisioni 22, 24 e 25).
//
// - deny: azioni vietate all'agente (push su main/develop, unione di PR,
//   tag, --no-verify, PR verso il ramo sbagliato).
// - ask: azioni distruttive o che indeboliscono le protezioni; decide il PO.
//
// Riceve su stdin il JSON dell'evento e risponde su stdout con la decisione.
'use strict';

const { execFileSync } = require('node:child_process');

const PROTECTED = new Set(['main', 'develop']);
const WORK_BRANCH = /^(pbi|bug|chore)\/[A-Za-z0-9._-]+$/;
const GUARDED_FILES = /(^|\/)(\.claude\/(settings(\.local)?\.json|hooks\/)|\.githooks\/|\.github\/workflows\/)/;

function decide(decision, reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: decision,
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

function currentBranch(cwd) {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

// Divide una riga di shell in comandi (&&, ||, ;, |, a capo) e in parole,
// rispettando apici e virgolette. Basta per riconoscere i comandi git.
function splitCommands(line) {
  const commands = [];
  let words = [];
  let word = '';
  let quote = '';
  const flushWord = () => {
    if (word !== '') words.push(word);
    word = '';
  };
  const flushCommand = () => {
    flushWord();
    if (words.length) commands.push(words);
    words = [];
  };
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = '';
      else word += c;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '\\' && i + 1 < line.length) {
      word += line[++i];
    } else if (c === ' ' || c === '\t') {
      flushWord();
    } else if (c === ';' || c === '\n' || c === '|' || c === '&') {
      flushCommand();
    } else {
      word += c;
    }
  }
  flushCommand();
  return commands;
}

const stripRefs = (ref) => ref.replace(/^\+/, '').replace(/^refs\/heads\//, '');

function checkGitPush(args, cwd) {
  if (args.includes('--no-verify')) return ['deny', 'git push --no-verify salta gli hook: non è consentito all\'agente.'];
  if (args.some((a) => ['--all', '--mirror'].includes(a))) return ['deny', 'git push --all o --mirror può scrivere su main o develop.'];
  if (args.includes('--tags') || args.includes('--follow-tags')) return ['deny', 'I tag di versione li crea e li pubblica solo il product owner.'];
  const positional = args.filter((a) => !a.startsWith('-'));
  const refspecs = positional.slice(1); // il primo è il remote
  if (refspecs.length === 0 && PROTECTED.has(currentBranch(cwd))) {
    return ['deny', 'Push dal ramo protetto corrente: su main e develop si arriva solo con una pull request.'];
  }
  for (const spec of refspecs) {
    const dst = stripRefs(spec.includes(':') ? spec.split(':').pop() : spec);
    if (PROTECTED.has(dst) || (spec === 'HEAD' && PROTECTED.has(currentBranch(cwd)))) {
      return ['deny', `Push su ${dst || currentBranch(cwd)} rifiutato: su main e develop si arriva solo con una pull request (decisione 22).`];
    }
    if (/^refs\/tags\//.test(spec) || /^v\d/.test(dst)) return ['deny', 'I tag di versione li crea e li pubblica solo il product owner.'];
    if (spec.startsWith('+') || spec.startsWith(':')) return ['ask', `Push forzato o cancellazione di un ramo remoto (${spec}): serve la conferma del product owner.`];
  }
  if (args.some((a) => /^(-f|--force|--force-with-lease.*|--force-if-includes|-d|--delete)$/.test(a))) {
    return ['ask', 'Push forzato o cancellazione di un ramo remoto: riscrive la cronologia, serve la conferma del product owner.'];
  }
  return null;
}

function checkGit(words, cwd) {
  // salta le opzioni globali (git -C dir, -c chiave=valore)
  let i = 1;
  while (i < words.length && words[i].startsWith('-')) i += words[i] === '-C' || words[i] === '-c' ? 2 : 1;
  const sub = words[i];
  const args = words.slice(i + 1);
  const branch = () => currentBranch(cwd);
  switch (sub) {
    case 'push':
      return checkGitPush(args, cwd);
    case 'commit':
      if (args.includes('--no-verify') || args.includes('-n')) return ['deny', 'git commit --no-verify salta gli hook: non è consentito all\'agente.'];
      if (PROTECTED.has(branch())) return ['deny', `Commit diretto su ${branch()}: lavora su un branch pbi/, bug/ o chore/.`];
      if (args.includes('--amend')) return ['ask', 'git commit --amend riscrive la cronologia: serve la conferma del product owner.'];
      return null;
    case 'merge':
      if (PROTECTED.has(branch())) return ['deny', `Merge locale su ${branch()}: su main e develop si arriva solo con una pull request.`];
      return null;
    case 'rebase':
    case 'filter-branch':
    case 'filter-repo':
      return ['ask', `git ${sub} riscrive la cronologia: serve la conferma del product owner.`];
    case 'reset':
      if (args.includes('--hard')) return ['ask', 'git reset --hard cancella modifiche: serve la conferma del product owner.'];
      return null;
    case 'branch':
      if (args.some((a) => a === '-D' || a === '--delete' || a === '-d')) return ['ask', 'Cancellazione di un ramo: serve la conferma del product owner.'];
      return null;
    case 'tag':
      if (args.length === 0 || args.some((a) => a === '-l' || a === '--list')) return null;
      return ['deny', 'I tag di versione li crea solo il product owner.'];
    case 'config':
      if (args.some((a) => a === 'core.hooksPath' || a === 'core.hookspath')) {
        if (args.includes('--unset') || !args.includes('.githooks')) return ['deny', 'core.hooksPath deve restare .githooks: gli hook proteggono main e develop.'];
      }
      return null;
    default:
      return null;
  }
}

function checkBash(command, cwd) {
  for (const words of splitCommands(command)) {
    const gitAt = words.indexOf('git');
    if (gitAt >= 0) {
      const verdict = checkGit(words.slice(gitAt), cwd);
      if (verdict) return verdict;
    }
    if (words.includes('gh') && words.includes('pr') && words.includes('merge')) {
      return ['deny', 'Le pull request le unisce solo il product owner.'];
    }
    const joined = words.join(' ');
    if (/api\.github\.com/.test(joined)) {
      if (/\/merge\b/.test(joined)) return ['deny', 'Le pull request le unisce solo il product owner.'];
      if (/(-X|--request)\s*(POST|PUT|PATCH|DELETE)\b/i.test(joined) || /\s(-d|--data\S*)\s/.test(` ${joined} `)) {
        return ['ask', 'Scrittura diretta sull\'API di GitHub: serve la conferma del product owner.'];
      }
    }
  }
  return null;
}

function checkPrBranches(base, head) {
  if (base === 'main') {
    return head === 'develop' ? null : ['deny', `Verso main si arriva solo da develop (head: ${head}).`];
  }
  if (base === 'develop' || WORK_BRANCH.test(base)) {
    // develop, oppure una PR impilata su un'altra PR non ancora unita
    return WORK_BRANCH.test(head) ? null : ['deny', `Verso ${base} si arriva solo da pbi/…, bug/… o chore/… (head: ${head}).`];
  }
  return ['deny', `Destinazione non ammessa: ${base}. Usa develop (o main solo per il rilascio da develop).`];
}

function checkGithub(tool, input) {
  const name = tool.replace(/^mcp__github__/, '');
  switch (name) {
    case 'merge_pull_request':
    case 'enable_pr_auto_merge':
      return ['deny', 'Le pull request le unisce solo il product owner (decisione 24).'];
    case 'create_pull_request':
      return checkPrBranches(input.base, input.head);
    case 'update_pull_request':
      if (input.base === 'main') return ['ask', 'Cambio della destinazione verso main: serve la conferma del product owner (solo la PR di rilascio da develop).'];
      if (input.base && input.base !== 'develop' && !WORK_BRANCH.test(input.base)) {
        return ['deny', `Destinazione non ammessa: ${input.base}.`];
      }
      return null;
    case 'push_files':
    case 'create_or_update_file':
    case 'delete_file':
      if (PROTECTED.has(input.branch)) return ['deny', `Scrittura su ${input.branch} rifiutata: si arriva solo con una pull request.`];
      return null;
    case 'create_branch':
      return WORK_BRANCH.test(input.branch || '') ? null : ['ask', `Nome di ramo fuori convenzione (${input.branch}): serve la conferma del product owner.`];
    default:
      return null;
  }
}

function main(raw) {
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return; // input illeggibile: non decide nulla
  }
  const tool = event.tool_name || '';
  const input = event.tool_input || {};
  const cwd = event.cwd || process.cwd();
  let verdict = null;
  if (tool === 'Bash') verdict = checkBash(String(input.command || ''), cwd);
  else if (tool.startsWith('mcp__github__')) verdict = checkGithub(tool, input);
  else if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
    const file = String(input.file_path || input.notebook_path || '');
    if (GUARDED_FILES.test(file)) verdict = ['ask', `Modifica di una protezione (${file}): serve la conferma del product owner.`];
  }
  if (verdict) decide(verdict[0], verdict[1]);
}

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (buffer += chunk));
process.stdin.on('end', () => main(buffer));

