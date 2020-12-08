import { Type, TypeConstraint } from '../../types'
import { Binding } from './Binding'
import { SyntaxNode } from 'tree-sitter-tony'

export interface BindingTemplate {
  isExported: boolean
  isImplicit: boolean
  name: string
  node: SyntaxNode | undefined
  transformedName: string

  buildBinding: (typeConstraint: TypeConstraint<Type>) => Binding | undefined
}
