import { AbstractionNode, SyntaxType } from 'tree-sitter-tony'
import { Emit, buildFileEmit } from '../types/emit'
import { GlobalScope, TypedFileScope } from '../types/analyze/scopes'
import { LogLevel, log } from '../logger'
import { NotImplementedError, assert } from '../types/errors/internal'
import { Config } from '../config'
import { TermNode } from '../types/nodes'
import { TypedNode } from '../types/type_inference/nodes'
import { generateAbstraction } from './util'
import { traverseScopes } from '../util/traverse'

export const generateCode = (
  config: Config,
  globalScope: GlobalScope<TypedFileScope>,
): Emit => {
  log(config, LogLevel.Info, 'Generating code')

  return globalScope.scopes.map(generateCodeForFile)
}

const generateCodeForFile = (fileScope: TypedFileScope) =>
  buildFileEmit(fileScope.file, traverse(fileScope.typedNode))

const traverse = (typedNode: TypedNode<TermNode>): string =>
  traverseScopes(
    typedNode.node,
    () => handleNode(typedNode),
    // TODO: enter nested scope here
    () => handleNode(typedNode),
  )

const handleNode = (typedNode: TypedNode<TermNode>): string => {
  assert(
    typedNode.node.type !== SyntaxType.ERROR,
    'Code generation should not be run on scopes that include errors.',
  )

  switch (typedNode.node.type) {
    case SyntaxType.Abstraction:
      return handleAbstraction(typedNode as TypedNode<AbstractionNode>)
    case SyntaxType.AbstractionBranch:
      throw new NotImplementedError(
        'Tony cannot generate code for abstraction branches yet.',
      )
    case SyntaxType.Access:
      throw new NotImplementedError(
        'Tony cannot generate code for access operations yet.',
      )
    case SyntaxType.Application:
      throw new NotImplementedError(
        'Tony cannot generate code for applications yet.',
      )
    case SyntaxType.Argument:
      throw new NotImplementedError(
        'Tony cannot generate code for arguments yet.',
      )
    case SyntaxType.Assignment:
      throw new NotImplementedError(
        'Tony cannot generate code for assignments yet.',
      )
    case SyntaxType.Block:
      throw new NotImplementedError('Tony cannot generate code for blocks yet.')
    case SyntaxType.Boolean:
      return typedNode.node.text
    case SyntaxType.Case:
      throw new NotImplementedError('Tony cannot generate code for cases yet.')
    case SyntaxType.DestructuringPattern:
      throw new NotImplementedError(
        'Tony cannot generate code for destructuring patterns yet.',
      )
    case SyntaxType.ElseIf:
      throw new NotImplementedError(
        'Tony cannot generate code for else ifs yet.',
      )
    case SyntaxType.Enum:
      throw new NotImplementedError('Tony cannot generate code for enums yet.')
    case SyntaxType.EnumValue:
      throw new NotImplementedError(
        'Tony cannot generate code for enum values yet.',
      )
    case SyntaxType.Export:
      throw new NotImplementedError(
        'Tony cannot generate code for exports yet.',
      )
    case SyntaxType.ExportedImport:
      throw new NotImplementedError(
        'Tony cannot generate code for exported imports yet.',
      )
    case SyntaxType.Generator:
      throw new NotImplementedError(
        'Tony cannot generate code for generators yet.',
      )
    case SyntaxType.Group:
      throw new NotImplementedError('Tony cannot generate code for groups yet.')
    case SyntaxType.Identifier:
      throw new NotImplementedError(
        'Tony cannot generate code for identifiers yet.',
      )
    case SyntaxType.IdentifierPattern:
      throw new NotImplementedError(
        'Tony cannot generate code for identifier patterns yet.',
      )
    case SyntaxType.If:
      throw new NotImplementedError('Tony cannot generate code for ifs yet.')
    case SyntaxType.Import:
      throw new NotImplementedError(
        'Tony cannot generate code for imports yet.',
      )
    case SyntaxType.ImportIdentifier:
      throw new NotImplementedError(
        'Tony cannot generate code for identifier imports yet.',
      )
    case SyntaxType.ImportType:
      throw new NotImplementedError(
        'Tony cannot generate code for type imports yet.',
      )
    case SyntaxType.InfixApplication:
      throw new NotImplementedError(
        'Tony cannot generate code for infix applications yet.',
      )
    case SyntaxType.Interface:
      throw new NotImplementedError(
        'Tony cannot generate code for interfaces yet.',
      )
    case SyntaxType.Interpolation:
      throw new NotImplementedError(
        'Tony cannot generate code for interpolations yet.',
      )
    case SyntaxType.LeftSection:
      throw new NotImplementedError(
        'Tony cannot generate code for left sections yet.',
      )
    case SyntaxType.List:
      throw new NotImplementedError('Tony cannot generate code for lists yet.')
    case SyntaxType.ListComprehension:
      throw new NotImplementedError(
        'Tony cannot generate code for list comprehensions yet.',
      )
    case SyntaxType.ListPattern:
      throw new NotImplementedError(
        'Tony cannot generate code for list patterns yet.',
      )
    case SyntaxType.Member:
      throw new NotImplementedError(
        'Tony cannot generate code for members yet.',
      )
    case SyntaxType.MemberPattern:
      throw new NotImplementedError(
        'Tony cannot generate code for member patterns yet.',
      )
    case SyntaxType.Number:
      return typedNode.node.text
    case SyntaxType.PatternGroup:
      throw new NotImplementedError(
        'Tony cannot generate code for pattern groups yet.',
      )
    case SyntaxType.Pipeline:
      throw new NotImplementedError(
        'Tony cannot generate code for pipelines yet.',
      )
    case SyntaxType.PrefixApplication:
      throw new NotImplementedError(
        'Tony cannot generate code for prefix applications yet.',
      )
    case SyntaxType.Program:
      throw new NotImplementedError(
        'Tony cannot generate code for programs yet.',
      )
    case SyntaxType.RawString:
      throw new NotImplementedError(
        'Tony cannot generate code for raw strings yet.',
      )
    case SyntaxType.Regex:
      return typedNode.node.text
    case SyntaxType.Rest:
      throw new NotImplementedError(
        'Tony cannot generate code for rest parameters yet.',
      )
    case SyntaxType.Return:
      throw new NotImplementedError(
        'Tony cannot generate code for returns yet.',
      )
    case SyntaxType.RightSection:
      throw new NotImplementedError(
        'Tony cannot generate code for right sections yet.',
      )
    case SyntaxType.ShorthandMemberPattern:
      throw new NotImplementedError(
        'Tony cannot generate code for shorthand member patterns yet.',
      )
    case SyntaxType.Spread:
      throw new NotImplementedError(
        'Tony cannot generate code for spreads yet.',
      )
    case SyntaxType.String:
      throw new NotImplementedError(
        'Tony cannot generate code for strings yet.',
      )
    case SyntaxType.Struct:
      throw new NotImplementedError(
        'Tony cannot generate code for structs yet.',
      )
    case SyntaxType.StructPattern:
      throw new NotImplementedError(
        'Tony cannot generate code for struct patterns yet.',
      )
    case SyntaxType.TaggedPattern:
      throw new NotImplementedError(
        'Tony cannot generate code for tagged patterns yet.',
      )
    case SyntaxType.TaggedValue:
      throw new NotImplementedError(
        'Tony cannot generate code for tagged values yet.',
      )
    case SyntaxType.Tuple:
      throw new NotImplementedError('Tony cannot generate code for tuples yet.')
    case SyntaxType.TuplePattern:
      throw new NotImplementedError(
        'Tony cannot generate code for tuple patterns yet.',
      )
    case SyntaxType.TypeAlias:
      throw new NotImplementedError(
        'Tony cannot generate code for type aliases yet.',
      )
    case SyntaxType.TypeHint:
      throw new NotImplementedError(
        'Tony cannot generate code for type hints yet.',
      )
    case SyntaxType.When:
      throw new NotImplementedError('Tony cannot generate code for whens yet.')
  }
}

const handleAbstraction = (typedNode: TypedNode<AbstractionNode>): string => {
  const branches = typedNode.branchNodes.map((branch) => traverse(branch))
  return generateAbstraction(branches)
}
