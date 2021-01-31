import { TermBinding, TermBindingNode } from '../types/analyze/bindings'

const buildBindingName = (binding: TermBinding) =>
  `${binding.name}${binding.index}`

export const generateDeclarations = (bindings: TermBinding[]): string => {
  const declarations = bindings
    .filter((binding) => !binding.isImplicit)
    .map(buildBindingName)
  if (declarations.length > 0) return `const ${declarations.join(',')}`
  return ''
}

const getBindingOfNode = (bindings: TermBinding[], node: TermBindingNode) =>
  bindings.find((binding) => binding.node === node)

export const getBindingName = (
  bindings: TermBinding[],
  node: TermBindingNode,
): string | undefined => {
  const binding = getBindingOfNode(bindings, node)
  if (binding) return buildBindingName(binding)
}
