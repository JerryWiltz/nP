// Modified: 2026-10-18
import { Linter } from 'eslint-linter-browserify'

const linter = new Linter()
const baseConfig = {
  languageOptions: { ecmaVersion: 'latest', sourceType: 'script' },
  rules: {
    'no-unexpected-multiline': 'warn',
    'no-sequences': 'warn'
  }
}

function directMember(node) {
  if (node?.type !== 'MemberExpression' || node.object.type !== 'Identifier' || node.object.name !== 'nP') return null
  if (!node.computed && node.property.type === 'Identifier') return node.property.name
  if (node.computed && node.property.type === 'Literal' && typeof node.property.value === 'string') return node.property.value
  return null
}

function hasLocalNP(sourceCode, node) {
  for (let scope = sourceCode.getScope(node); scope; scope = scope.upper) {
    if (scope.set.get('nP')?.defs.length) return true
  }
  return false
}

function publicApiRule(api) {
  const callableNames = Object.keys(api).filter(name => typeof api[name] === 'function')

  return {
    meta: { type: 'problem' },
    create(context) {
      const assignments = new Set()
      const calls = []

      return {
        AssignmentExpression(node) {
          const name = directMember(node.left)
          if (name && !hasLocalNP(context.sourceCode, node)) assignments.add(name)
        },
        CallExpression(node) {
          const name = directMember(node.callee)
          if (name && !hasLocalNP(context.sourceCode, node)) calls.push({ node, name })
        },
        'Program:exit'() {
          for (const { node, name } of calls) {
            if (assignments.has(name) || typeof api[name] === 'function') continue
            const suggestion = callableNames.find(candidate => candidate.toLowerCase() === name.toLowerCase())
            const message = Object.hasOwn(api, name)
              ? `nP.${name} is not a function.`
              : `Unknown nP API: nP.${name}().`
            context.report({
              node: node.callee.property,
              message: suggestion ? `${message} Did you mean nP.${suggestion}()?` : message
            })
          }
        }
      }
    }
  }
}

export function lintCode(code, api) {
  const config = api ? [{
    ...baseConfig,
    plugins: { np: { rules: { 'public-api': publicApiRule(api) } } },
    rules: { ...baseConfig.rules, 'np/public-api': 'warn' }
  }] : [baseConfig]
  const messages = linter.verify(code, config, { filename: 'np-debug.js' })
  const multilineLines = new Set(messages
    .filter(message => message.ruleId === 'no-unexpected-multiline')
    .map(message => message.line))

  return messages
    .filter(message => message.ruleId !== 'no-sequences' || !multilineLines.has(message.line))
    .map(message => ({
      line: message.line,
      column: message.column,
      message: message.ruleId === 'no-unexpected-multiline' && message.messageId === 'property'
        ? `Unexpected continuation on this line. Check for a missing comma on line ${message.line - 1}.`
        : message.message
    }))
}
