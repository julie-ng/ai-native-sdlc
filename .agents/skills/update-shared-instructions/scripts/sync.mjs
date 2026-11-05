import fs from 'node:fs'
import path from 'node:path'

// 1. Resolve the source and target directories and select copy or check mode.
const args = process.argv.slice(2)
const check = args.includes('--check')
const roots = args.filter(arg => arg !== '--check')
if (roots.length !== 2) {
  throw new Error('Usage: node sync.mjs SOURCE_ROOT TARGET_ROOT [--check]')
}
const [source, target] = roots.map(root => fs.realpathSync(root))
if (source === target) throw new Error('Source and target must differ')

// 2. Find the source instructions and build their index using the source labels,
//    in the order the source AGENTS.md lists them.
const shared = '.agents/shared'
const names = fs.readdirSync(path.join(source, shared))
  .filter(name => name.endsWith('.md') && fs.statSync(path.join(source, shared, name)).isFile())
if (!names.length) throw new Error('Source shared instruction set is empty')
const sourceIndex = fs.readFileSync(path.join(source, 'AGENTS.md'), 'utf8')
const links = [...sourceIndex.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)]
const position = ref => links.findIndex(match => match[2] === ref)
const entries = names
  .map(name => ({ name, ref: `./${shared}/${name}` }))
  .map(entry => {
    if (position(entry.ref) < 0) throw new Error(`Source AGENTS.md has no label for ${entry.name}`)
    return entry
  })
  .sort((a, b) => position(a.ref) - position(b.ref))
  .map(({ ref }) => `- [${links[position(ref)][1]}](${ref})`)
const section = '## Shared instructions\n\n'
  + 'Read and follow these alongside this repo’s project-specific instructions. Explicit project-specific exceptions override shared defaults; otherwise both apply.\n\n'
  + entries.join('\n') + '\n'

// 3. Replace the shared section, preserving project-specific sections around it.
const indexPath = path.join(target, 'AGENTS.md')
const oldIndex = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '# AGENTS.md\n'
const heading = /^## Shared instructions\r?\n/gm
const matches = [...oldIndex.matchAll(heading)]
if (matches.length > 1) throw new Error('Multiple shared sections; reconcile them before running the helper')
let projectIndex = oldIndex
if (matches.length) {
  const start = matches[0].index
  const rest = oldIndex.slice(start + matches[0][0].length)
  const next = rest.search(/^## /m)
  const end = next < 0 ? oldIndex.length : start + matches[0][0].length + next
  projectIndex = oldIndex.slice(0, start).trimEnd() + '\n\n' + oldIndex.slice(end)
}
const newIndex = projectIndex.trimEnd() + '\n\n' + section

// 4. Compare the intended copies and index with the existing target files.
const updates = names.map(name => [
  path.join(target, shared, name), fs.readFileSync(path.join(source, shared, name)),
])
updates.push([indexPath, Buffer.from(newIndex)])
const changed = updates.filter(([file, contents]) =>
  !fs.existsSync(file) || !fs.readFileSync(file).equals(contents))

// 5. In check mode, report differences without writing; otherwise write only changed files.
if (check && changed.length) {
  throw new Error('Sync differs: ' + changed.map(([file]) => path.relative(target, file)).join(', '))
}
if (!check) {
  for (const [file, contents] of changed) {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, contents)
  }
}
console.log(check ? 'Shared copies and index match source.' : `Updated ${changed.length} file(s).`)
