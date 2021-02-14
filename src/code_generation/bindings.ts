import {
  ImportedTermBinding,
  TermBinding,
  TermBindingNode,
} from '../types/analyze/bindings'
import { AbsolutePath } from '../types/path'
import { OPERATOR } from 'tree-sitter-tony/common/constants'
import { charCodes } from '../util'
import { getOutPath } from '../util/paths'

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
  const name = OPERATOR.test(binding.name)
    ? generateOperatorBindingName(binding.name)
    : binding.name
  return ignoreIndex ? name : `${name}${binding.index}`
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
  if (declarations.length > 0) return `const ${declarations.join(',')}`
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
    return `export {${exportedBindings.join(',')}}`
  return ''
}

/**
 * Generates import statements for all imported bindings.
 */
export const generateImports = (
  dependencies: AbsolutePath[],
  bindings: ImportedTermBinding[],
): string => {
  return dependencies
    .map((source) =>
      generateImport(
        source,
        bindings.filter((binding) => binding.file === source),
      ),
    )
    .join(';')
}

const generateImport = (
  source: AbsolutePath,
  bindings: ImportedTermBinding[],
): string => {
  const outSource = getOutPath(source)
  const aliases = bindings
    .map(({ name, originalName }) =>
      originalName ? `${name} as ${originalName}` : name,
    )
    .join(',')
  return `import {${aliases}} from '${outSource.path}'`
}
