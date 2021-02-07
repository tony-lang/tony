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
  PipelineNode,
  PrefixApplicationNode,
  ProgramNode,
  RawStringNode,
  ReturnNode,
  ShorthandAccessIdentifierNode,
  SpreadNode,
  StringNode,
  StructNode,
  SyntaxType,
  TupleNode,
  TypeHintNode,
  WhenNode,
} from 'tree-sitter-tony'
import { Emit, buildFileEmit } from '../types/emit'
import {
  FileScope,
  GlobalScope,
  NestedScope,
  NestingTermNode,
  TypedFileScope,
  isFileScope,
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
  generateList,
  generateListComprehension,
  generateMember,
  generateProgram,
  generateReturn,
  generateShorthandAccessIdentifier,
  generateSpread,
  generateString,
  generateStruct,
  generateWhen,
} from './generators'
import {
  generateBindingName,
  generateDeclarations,
  generateDeclaredBindingName,
  generateExports,
  generateImports,
} from './bindings'
import { generatePattern, generatePatterns } from './patterns'
import { injectInterpolations, parseStringContent } from './strings'
import { Config } from '../config'
import { TermNode } from '../types/nodes'
import { TypedNode } from '../types/type_inference/nodes'
import { isImportedBinding } from '../types/analyze/bindings'
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
      return handlePipeline(state, typedNode as TypedNode<PipelineNode>)
    case SyntaxType.PrefixApplication:
      return handlePrefixApplication(
        state,
        typedNode as TypedNode<PrefixApplicationNode>,
      )
    case SyntaxType.Program:
      return handleProgram(state, typedNode as TypedNode<ProgramNode>)
    case SyntaxType.RawString:
      return handleRawString(typedNode as TypedNode<RawStringNode>)
    case SyntaxType.Regex:
      return typedNode.node.text
    case SyntaxType.Return:
      return handleReturn(state, typedNode as TypedNode<ReturnNode>)
    case SyntaxType.RightSection:
      throw new NotImplementedError(
        'Tony cannot generate code for right sections yet.',
      )
    case SyntaxType.ShorthandAccessIdentifier:
      return handleShorthandAccessIdentifier(
        typedNode as TypedNode<ShorthandAccessIdentifierNode>,
      )
    case SyntaxType.ShorthandMemberIdentifier:
      throw new NotImplementedError(
        'Tony cannot generate code for shorthand member identifiers yet.',
      )
    case SyntaxType.ShorthandMember:
      throw new NotImplementedError(
        'Tony cannot generate code for shorthand members yet.',
      )
    case SyntaxType.Spread:
      return handleSpread(state, typedNode as TypedNode<SpreadNode>)
    case SyntaxType.String:
      return handleString(state, typedNode as TypedNode<StringNode>)
    case SyntaxType.Struct:
      return handleStruct(state, typedNode as TypedNode<StructNode>)
    case SyntaxType.TaggedValue:
      throw new NotImplementedError(
        'Tony cannot generate code for tagged values yet.',
      )
    case SyntaxType.Tuple:
      return handleTuple(state, typedNode as TypedNode<TupleNode>)
    case SyntaxType.TypeAlias:
      return ''
    case SyntaxType.TypeHint:
      return traverse(state, (typedNode as TypedNode<TypeHintNode>).valueNode)
    case SyntaxType.When:
      return handleWhen(state, typedNode as TypedNode<WhenNode>)
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
  const parameters = generatePatterns(state.scopes[0], typedNode.elementNodes)
  const restParameter =
    typedNode.restNode && generatePattern(state.scopes[0], typedNode.restNode)
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
  const pattern = generatePattern(state.scopes[0], typedNode.patternNode)
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
  return generateApplication(value, [left, right])
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

const handlePipeline = (
  state: State,
  typedNode: TypedNode<PipelineNode>,
): string => {
  const name = traverse(state, typedNode.nameNode)
  const value = traverse(state, typedNode.valueNode)
  return generateApplication(name, [value])
}

const handlePrefixApplication = (
  state: State,
  typedNode: TypedNode<PrefixApplicationNode>,
): string => {
  const name = traverse(state, typedNode.nameNode)
  const value = traverse(state, typedNode.valueNode)
  return generateApplication(name, [value])
}

const handleProgram = (
  state: State,
  typedNode: TypedNode<ProgramNode>,
): string => {
  const terms = typedNode.termNodes.map((term) => traverse(state, term))
  const scope = state.scopes[0]
  assert(
    isFileScope(scope),
    'Traverse should arrive at the top-level file scope.',
  )
  const declarations = generateDeclarations(scope.terms)
  const imports = generateImports(
    scope.dependencies,
    scope.terms.filter(isImportedBinding),
  )
  const exports = generateExports(scope.terms)
  return generateProgram(declarations, imports, exports, terms)
}

const handleRawString = (typedNode: TypedNode<RawStringNode>): string => {
  const content = parseStringContent(typedNode.node.text)
  return generateString(content)
}

const handleReturn = (
  state: State,
  typedNode: TypedNode<ReturnNode>,
): string => {
  const value = traverse(state, typedNode.valueNode)
  return generateReturn(value)
}

const handleShorthandAccessIdentifier = (
  typedNode: TypedNode<ShorthandAccessIdentifierNode>,
): string => {
  const name = generateBindingName(
    (typedNode as TypedNode<ShorthandAccessIdentifierNode>).binding,
  )
  return generateShorthandAccessIdentifier(name)
}

const handleSpread = (
  state: State,
  typedNode: TypedNode<SpreadNode>,
): string => {
  const value = traverse(state, typedNode.valueNode)
  return generateSpread(value)
}

const handleString = (
  state: State,
  typedNode: TypedNode<StringNode>,
): string => {
  const interpolations = typedNode.interpolationNodes.map((child) =>
    traverse(state, child),
  )
  const content = injectInterpolations(
    parseStringContent(typedNode.node.text),
    interpolations,
  )
  return generateString(content)
}

const handleStruct = (
  state: State,
  typedNode: TypedNode<StructNode>,
): string => {
  const members = typedNode.memberNodes.map((member) => traverse(state, member))
  return generateStruct(members)
}

const handleTuple = (state: State, typedNode: TypedNode<TupleNode>): string => {
  const elements = typedNode.elementNodes.map((element) =>
    traverse(state, element),
  )
  return generateList(elements)
}

const handleWhen = (state: State, typedNode: TypedNode<WhenNode>): string => {
  const patterns = typedNode.patternNodes.map((patternNode) =>
    generatePattern(state.scopes[0], patternNode),
  )
  const body = traverse(state, typedNode.bodyNode)
  return generateWhen(patterns, body)
}
