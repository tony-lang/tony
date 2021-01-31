import { TermBinding, TermBindingNode } from '../types/analyze/bindings'

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
