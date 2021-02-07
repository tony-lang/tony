import {
  ImportedTermBinding,
  TermBinding,
  TermBindingNode,
  isImportedBinding,
} from '../types/analyze/bindings'
import { AbsolutePath } from '../types/path'

/**
 * Given a binding, generates the name representing that binding.
 */
export const generateBindingName = (binding: TermBinding): string =>
  `${binding.name}${binding.index}`

/**
 * Generates a declaration of all non-implicit bindings in the given set of
 * bindings.
 */
export const generateDeclarations = (bindings: TermBinding[]): string => {
  const declarations = bindings
    .filter((binding) => !binding.isImplicit)
    .map(generateBindingName)
  if (declarations.length > 0) return `const ${declarations.join(',')}`
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
): string => {}

/**
 * Generates export statement for all exported bindings.
 */
export const generateExports = (bindings: TermBinding[]): string => {
  const exportedBindings = bindings
    .filter((binding) => binding.isExported)
    .map(generateBindingName)
  if (exportedBindings.length > 0)
    return `export {${exportedBindings.join(',')}}`
  return ''
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
): string | undefined => {
  const binding = findBindingOfNode(bindings, node)
  if (binding) return generateBindingName(binding)
}
