import {
  ImportedTermBinding,
  TermBinding,
  TermBindingNode,
  isImportedBinding,
} from '../types/analyze/bindings'
import { OPERATOR } from 'tree-sitter-tony/common/constants'
import { charCodes } from '../util'
import { getOutPath } from '../util/paths'
import {
  Dependency,
  isDeclarationDependency,
} from '../types/analyze/dependencies'
import { indent } from './util'
import { curryJS } from './lib'

const OPERATOR_BINDING_PREFIX = '$OP'

const generateOperatorBindingName = (name: string) =>
  `${OPERATOR_BINDING_PREFIX}_${charCodes(name).join('_')}`

/**
 * Given a binding, generates the name representing that binding.
 */
export const generateBindingName = (
  binding: TermBinding,
  ignoreIndex = false,
): string => {
  const isJS =
    isImportedBinding(binding) && isDeclarationDependency(binding.dependency)
  const name = OPERATOR.test(binding.name)
    ? generateOperatorBindingName(binding.name)
    : binding.name
  const nameWithIndex = ignoreIndex ? name : `${name}${binding.index}`
  return isJS ? curryJS(nameWithIndex) : nameWithIndex
}

const findBindingOfNode = (bindings: TermBinding[], node: TermBindingNode) =>
  bindings.find((binding) => binding.node === node)

/**
 * Given a set of bindings and a node, finds the binding declared by the node
 * and generates the name representing that binding.
 */
export const generateDeclaredBindingName = (
  bindings: TermBinding[],
  node: TermBindingNode,
  ignoreIndex = false,
): string | undefined => {
  const binding = findBindingOfNode(bindings, node)
  if (binding) return generateBindingName(binding, ignoreIndex)
}

/**
 * Generates a declaration of all non-implicit bindings in the given set of
 * bindings.
 */
export const generateDeclarations = (bindings: TermBinding[]): string => {
  const declarations = bindings
    .filter((binding) => !binding.isImplicit)
    .map((binding) => generateBindingName(binding))
  if (declarations.length > 0) return `const ${declarations.join(', ')}`
  return ''
}

/**
 * Generates export statement for all exported bindings.
 */
export const generateExports = (bindings: TermBinding[]): string => {
  const exportedBindings = bindings
    .filter((binding) => binding.isExported)
    .map((binding) => generateBindingName(binding))
  if (exportedBindings.length > 0)
    return `export {${indent(exportedBindings.join(',\n'))}}`
  return ''
}

/**
 * Generates import statements for all imported bindings.
 */
export const generateImports = (
  dependencies: Dependency[],
  bindings: ImportedTermBinding[],
): string => {
  return dependencies
    .map((source) =>
      generateImport(
        source,
        bindings.filter((binding) => binding.dependency === source),
      ),
    )
    .join('\n')
}

const generateImport = (
  source: Dependency,
  bindings: ImportedTermBinding[],
): string => {
  const outSource = getOutPath(source.file)
  const aliases = bindings
    .map(({ name, originalName }) =>
      originalName ? `${name} as ${originalName}` : name,
    )
    .join(',\n')
  return `import {${indent(aliases)}} from '${outSource.path}'`
}
