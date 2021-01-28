import { TermBinding } from '../types/analyze/bindings'

const buildBindingName = (binding: TermBinding): string =>
  `${binding.name}${binding.index}`

export const generateDeclarations = (bindings: TermBinding[]): string => {
  const declarations = bindings
    .filter((binding) => !binding.isImplicit)
    .map(buildBindingName)
  if (declarations.length > 0) return `const ${declarations.join(',')}`
  return ''
}
