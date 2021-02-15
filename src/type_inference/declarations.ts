import { DeclarationFileScope, TypedFileScope } from '../types/analyze/scopes'
import { NotImplementedError } from '../types/errors/internal'

export const inferTypesOfDeclaration = (
  fileScope: DeclarationFileScope, // eslint-disable-line @typescript-eslint/no-unused-vars
): TypedFileScope => {
  throw new NotImplementedError('Cannot infer types of declaration yet.')
}
