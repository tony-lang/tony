import {
  AbstractionBranchNode,
  AbstractionNode,
  AccessNode,
  ApplicationNode,
  ArgumentNode,
  AssignmentNode,
  BlockNode,
  CaseNode,
  ElseIfNode,
  ExportNode,
  GeneratorNode,
  IdentifierNode,
  IfNode,
  InfixApplicationNode,
  InterpolationNode,
  ListComprehensionNode,
  ListNode,
  MemberNode,
  SyntaxType,
} from 'tree-sitter-tony'
import { Emit, buildFileEmit } from '../types/emit'
import {
  FileScope,
  GlobalScope,
  NestedScope,
  NestingTermNode,
  TypedFileScope,
} from '../types/analyze/scopes'
import { LogLevel, log } from '../logger'
import { NotImplementedError, assert } from '../types/errors/internal'
import { filterFileScopeByTermScopes, findScopeOfNode } from '../util/scopes'
import {
  generateAbstraction,
  generateAbstractionBranch,
  generateAccess,
  generateApplication,
  generateArgument,
  generateAssignment,
  generateBlock,
  generateCase,
  generateEliseIf,
  generateGenerator,
  generateIf,
  generateInfixApplication,
  generateList,
  generateListComprehension,
  generateMember,
} from './generators'
import {
  generateBindingName,
  generateDeclarations,
  generateDeclaredBindingName,
} from './bindings'
import { resolvePattern, resolvePatterns } from './patterns'
import { Config } from '../config'
import { TermNode } from '../types/nodes'
import { TypedNode } from '../types/type_inference/nodes'
import { traverseScopes } from '../util/traverse'

type State = {
  /**
   * A stack of all scopes starting with the closest scope and ending with the
   * symbol table.
   */
  scopes: (FileScope<NestingTermNode> | NestedScope<NestingTermNode>)[]
}

export const generateCode = (
  config: Config,
  globalScope: GlobalScope<TypedFileScope>,
): Emit => {
  log(config, LogLevel.Info, 'Generating code')

  return globalScope.scopes.map(generateCodeForFile)
}

const generateCodeForFile = (fileScope: TypedFileScope) => {
  const initialState: State = {
    scopes: [filterFileScopeByTermScopes(fileScope)],
  }
  return buildFileEmit(
    fileScope.file,
    traverse(initialState, fileScope.typedNode),
  )
}

const enterBlock = (
  state: State,
  typedNode: TypedNode<NestingTermNode>,
): State => {
  const [scope, ...scopes] = state.scopes
  const newScope = findScopeOfNode(scope.scopes, typedNode.node)
  assert(
    newScope !== undefined,
    'All scopes should have been built during analyze.',
  )
  return {
    ...state,
    scopes: [newScope, scope, ...scopes],
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nest = <T extends NestingTermNode>(
  state: State,
  typedNode: TypedNode<T>,
  callback: (state: State, typedNode: TypedNode<T>) => string,
) => {
  const nestedState = enterBlock(state, typedNode)
  return callback(nestedState, typedNode)
}

const traverse = (state: State, typedNode: TypedNode<TermNode>): string =>
  traverseScopes(
    typedNode.node,
    () => handleNode(state, typedNode),
    () => nest(state, typedNode as TypedNode<NestingTermNode>, handleNode),
  )

const handleNode = (state: State, typedNode: TypedNode<TermNode>): string => {
  switch (typedNode.node.type) {
    case SyntaxType.Abstraction:
      return handleAbstraction(state, typedNode as TypedNode<AbstractionNode>)
    case SyntaxType.AbstractionBranch:
      return handleAbstractionBranch(
        state,
        typedNode as TypedNode<AbstractionBranchNode>,
      )
    case SyntaxType.Access:
      return handleAccess(state, typedNode as TypedNode<AccessNode>)
    case SyntaxType.Application:
      return handleApplication(state, typedNode as TypedNode<ApplicationNode>)
    case SyntaxType.Argument:
      return handleArgument(state, typedNode as TypedNode<ArgumentNode>)
    case SyntaxType.Assignment:
      return handleAssignment(state, typedNode as TypedNode<AssignmentNode>)
    case SyntaxType.Block:
      return handleBlock(state, typedNode as TypedNode<BlockNode>)
    case SyntaxType.Boolean:
      return typedNode.node.text
    case SyntaxType.Case:
      return handleCase(state, typedNode as TypedNode<CaseNode>)
    case SyntaxType.ElseIf:
      return handleElseIf(state, typedNode as TypedNode<ElseIfNode>)
    case SyntaxType.Enum:
      throw new NotImplementedError('Tony cannot generate code for enums yet.')
    case SyntaxType.EnumValue:
      throw new NotImplementedError(
        'Tony cannot generate code for enum values yet.',
      )
    // exports are generated in handleProgram
    case SyntaxType.Export:
      return traverse(
        state,
        (typedNode as TypedNode<ExportNode>).declarationNode,
      )
    // imports are generated in handleProgram
    case SyntaxType.ExportedImport:
      return ''
    case SyntaxType.Generator:
      return handleGenerator(state, typedNode as TypedNode<GeneratorNode>)
    case SyntaxType.Group:
      throw new NotImplementedError('Tony cannot generate code for groups yet.')
    case SyntaxType.Identifier:
      return generateBindingName(
        (typedNode as TypedNode<IdentifierNode>).binding,
      )
    case SyntaxType.If:
      return handleIf(state, typedNode as TypedNode<IfNode>)
    // imports are generated in handleProgram
    case SyntaxType.Import:
      return ''
    case SyntaxType.ImportIdentifier:
      throw new NotImplementedError(
        'Tony cannot generate code for identifier imports yet.',
      )
    case SyntaxType.ImportType:
      throw new NotImplementedError(
        'Tony cannot generate code for type imports yet.',
      )
    case SyntaxType.InfixApplication:
      return handleInfixApplication(
        state,
        typedNode as TypedNode<InfixApplicationNode>,
      )
    case SyntaxType.Interface:
      throw new NotImplementedError(
        'Tony cannot generate code for interfaces yet.',
      )
    case SyntaxType.Interpolation:
      return traverse(
        state,
        (typedNode as TypedNode<InterpolationNode>).termNode,
      )
    case SyntaxType.LeftSection:
      throw new NotImplementedError(
        'Tony cannot generate code for left sections yet.',
      )
    case SyntaxType.List:
      return handleList(state, typedNode as TypedNode<ListNode>)
    case SyntaxType.ListComprehension:
      return handleListComprehension(
        state,
        typedNode as TypedNode<ListComprehensionNode>,
      )
    case SyntaxType.Member:
      return handleMember(state, typedNode as TypedNode<MemberNode>)
    case SyntaxType.Number:
      return typedNode.node.text
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
    case SyntaxType.Return:
      throw new NotImplementedError(
        'Tony cannot generate code for returns yet.',
      )
    case SyntaxType.RightSection:
      throw new NotImplementedError(
        'Tony cannot generate code for right sections yet.',
      )
    case SyntaxType.ShorthandAccessIdentifier:
      throw new NotImplementedError(
        'Tony cannot generate code for shorthand access identifiers yet.',
      )
    case SyntaxType.ShorthandMemberIdentifier:
      throw new NotImplementedError(
        'Tony cannot generate code for shorthand member identifiers yet.',
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
    case SyntaxType.TaggedValue:
      throw new NotImplementedError(
        'Tony cannot generate code for tagged values yet.',
      )
    case SyntaxType.Tuple:
      throw new NotImplementedError('Tony cannot generate code for tuples yet.')
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

const handleAbstraction = (
  state: State,
  typedNode: TypedNode<AbstractionNode>,
): string => {
  const branches = typedNode.branchNodes.map((branch) =>
    traverse(state, branch),
  )
  return generateAbstraction(branches)
}

const handleAbstractionBranch = (
  state: State,
  typedNode: TypedNode<AbstractionBranchNode>,
): string => {
  const parameters = resolvePatterns(state.scopes[0], typedNode.elementNodes)
  const restParameter =
    typedNode.restNode && resolvePattern(state.scopes[0], typedNode.restNode)
  const body = traverse(state, typedNode.bodyNode)
  return generateAbstractionBranch(parameters, restParameter, body)
}

const handleAccess = (
  state: State,
  typedNode: TypedNode<AccessNode>,
): string => {
  const name = traverse(state, typedNode.nameNode)
  const value = traverse(state, typedNode.valueNode)
  return generateAccess(name, value)
}

const handleApplication = (
  state: State,
  typedNode: TypedNode<ApplicationNode>,
): string => {
  const value = traverse(state, typedNode.nameNode)
  const args = typedNode.elementNodes.map((argument) =>
    traverse(state, argument),
  )
  return generateApplication(value, args)
}

const handleArgument = (
  state: State,
  typedNode: TypedNode<ArgumentNode>,
): string => {
  const value = typedNode.valueNode && traverse(state, typedNode.valueNode)
  return generateArgument(value)
}

const handleAssignment = (
  state: State,
  typedNode: TypedNode<AssignmentNode>,
): string => {
  const pattern = resolvePattern(state.scopes[0], typedNode.patternNode)
  const value = traverse(state, typedNode.valueNode)
  return generateAssignment(pattern, value)
}

const handleBlock = (state: State, typedNode: TypedNode<BlockNode>): string => {
  const terms = typedNode.termNodes.map((term) => traverse(state, term))
  const endsWithReturn =
    typedNode.termNodes.pop()?.node.type === SyntaxType.Return
  const declarations = generateDeclarations(state.scopes[0].terms)
  return generateBlock(declarations, terms, endsWithReturn)
}

const handleCase = (state: State, typedNode: TypedNode<CaseNode>): string => {
  const value = traverse(state, typedNode.valueNode)
  const branches = typedNode.whenNodes.map((branch) => traverse(state, branch))
  const elseBranch = traverse(state, typedNode.elseNode)
  return generateCase(value, branches, elseBranch)
}

const handleElseIf = (
  state: State,
  typedNode: TypedNode<ElseIfNode>,
): string => {
  const condition = traverse(state, typedNode.conditionNode)
  const body = traverse(state, typedNode.bodyNode)
  return generateEliseIf(condition, body)
}

const handleGenerator = (
  state: State,
  typedNode: TypedNode<GeneratorNode>,
): string => {
  const value = traverse(state, typedNode.valueNode)
  const condition =
    typedNode.conditionNode && traverse(state, typedNode.conditionNode)
  const name = generateDeclaredBindingName(
    state.scopes[0].terms,
    typedNode.node,
  )
  assert(
    name !== undefined,
    'Generator nodes should always have an associated binding.',
  )
  return generateGenerator(name, value, condition)
}

const handleIf = (state: State, typedNode: TypedNode<IfNode>): string => {
  const condition = traverse(state, typedNode.conditionNode)
  const body = traverse(state, typedNode.bodyNode)
  const alternativeBodies = typedNode.elseIfNodes.map((elseIf) =>
    traverse(state, elseIf),
  )
  const alternativeBody =
    typedNode.elseNode && traverse(state, typedNode.elseNode)
  return generateIf(condition, body, alternativeBodies, alternativeBody)
}

const handleInfixApplication = (
  state: State,
  typedNode: TypedNode<InfixApplicationNode>,
): string => {
  const value = traverse(state, typedNode.nameNode)
  const left = traverse(state, typedNode.leftNode)
  const right = traverse(state, typedNode.rightNode)
  return generateInfixApplication(value, left, right)
}

const handleList = (state: State, typedNode: TypedNode<ListNode>): string => {
  const elements = typedNode.elementNodes.map((element) =>
    traverse(state, element),
  )
  return generateList(elements)
}

const handleListComprehension = (
  state: State,
  typedNode: TypedNode<ListComprehensionNode>,
): string => {
  const generators = typedNode.generatorNodes.map((generator) =>
    traverse(state, generator),
  )
  const body = traverse(state, typedNode.bodyNode)
  return generateListComprehension(generators, body)
}

const handleMember = (
  state: State,
  typedNode: TypedNode<MemberNode>,
): string => {
  const key = traverse(state, typedNode.keyNode)
  const value = traverse(state, typedNode.valueNode)
  return generateMember(key, value)
}
