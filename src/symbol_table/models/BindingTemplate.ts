import { Type, TypeConstraint } from '../../types'
import { Binding } from './Binding'
import Parser from 'tree-sitter'

export interface BindingTemplate {
  isExported: boolean
  isImplicit: boolean
  name: string
  node: Parser.SyntaxNode | undefined
  transformedName: string

  buildBinding: (typeConstraint: TypeConstraint<Type>) => Binding | undefined
}
