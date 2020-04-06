import {
  CollectDefaultValues,
  GenerateBlock,
  GenerateProgram,
  ParseStringContent,
  ResolvePattern,
  TransformIdentifier,
} from './services'
import { CompileError, InternalError, assert } from '../errors'
import { FileModuleScope, WalkFileModuleScope } from '../symbol_table'
import {
  TRANSFORM_PLACEHOLDER_ARGUMENT,
  TRANSFORM_REST_PATTERN,
} from '../constants'
import Parser from 'tree-sitter'
import { isNotUndefined } from '../utilities'

export const INTERNAL_TEMP_TOKEN = Object.freeze('#TONY_INTERNAL_TEMP')

export class GenerateCode {
  private _fileScope: FileModuleScope
  private _listComprehensionGeneratorCountStack: number[] = []

  private _transformIdentifier: TransformIdentifier
  private _walkFileModuleScope: WalkFileModuleScope

  constructor(fileScope: FileModuleScope) {
    this._fileScope = fileScope

    this._transformIdentifier = new TransformIdentifier()
    this._walkFileModuleScope = new WalkFileModuleScope(fileScope)
  }

  perform = (): string => {
    assert(
      this._fileScope.tree !== undefined,
      'Syntax tree of file scope should be present.',
    )

    try {
      return this.handleProgram(this._fileScope.tree.rootNode)
    } catch (error) {
      if (error instanceof CompileError)
        error.filePath = this._fileScope.filePath
      throw error
    }
  }

  // eslint-disable-next-line max-lines-per-function
  traverse = (node: Parser.SyntaxNode): string | undefined => {
    switch (node.type) {
      case 'abstraction':
        return this.handleAbstraction(node)
      case 'abstraction_branch':
        return this.handleAbstractionBranch(node)
      case 'access':
        return this.handleAccess(node)
      case 'application':
        return this.handleApplication(node)
      case 'argument':
        return this.handleArgument(node)
      case 'arguments':
        return this.handleArguments(node)
      case 'assignment':
        return this.handleAssignment(node)
      case 'block':
        return this.handleBlock(node)
      case 'boolean':
        return node.text
      case 'case':
        return this.handleCase(node)
      case 'comment':
        return
      case 'else_if_clause':
        return this.handleElseIfClause(node)
      case 'else_if_clauses':
        return this.handleElseIfClauses(node)
      case 'export':
        return this.handleExport(node)
      case 'expression_pair':
        return this.handleExpressionPair(node)
      case 'generator':
        return this.handleGenerator(node)
      case 'generators':
        return this.handleGenerators(node)
      case 'identifier':
        return this.handleIdentifier(node)
      case 'identifier_pattern':
        return this.handleIdentifierPattern(node)
      case 'identifier_pattern_name':
        return this.handleIdentifierPatternName(node)
      case 'if':
        return this.handleIf(node)
      case 'import':
        return
      case 'infix_application':
        return this.handleInfixApplication(node)
      case 'interpolation':
        return this.handleInterpolation(node)
      case 'list':
        return this.handleList(node)
      case 'list_comprehension':
        return this.handleListComprehension(node)
      case 'list_pattern':
        return this.handleListPattern(node)
      case 'map':
        return this.handleMap(node)
      case 'map_pattern':
        return this.handleMapPattern(node)
      case 'module':
        return this.handleModule(node)
      case 'number':
        return node.text
      case 'parameters':
        return this.handleParameters(node)
      case 'pattern_list':
        return this.handlePatternList(node)
      case 'pattern_pair':
        return this.handlePatternPair(node)
      case 'pipeline':
        return this.handlePipeline(node)
      case 'prefix_application':
        return this.handlePrefixApplication(node)
      case 'program':
        return this.handleProgram(node)
      case 'regex':
        return node.text
      case 'rest_list':
        return this.handleRestList(node)
      case 'rest_map':
        return this.handleRestMap(node)
      case 'return':
        return this.handleReturn(node)
      case 'shorthand_access_identifier':
        return this.handleShorthandAccessIdentifier(node)
      case 'shorthand_pair_identifier':
        return this.handleShorthandPairIdentifier(node)
      case 'shorthand_pair_identifier_pattern':
        return this.handleShorthandPairIdentifierPattern(node)
      case 'spread_list':
        return this.handleSpreadList(node)
      case 'spread_map':
        return this.handleSpreadMap(node)
      case 'string':
        return this.handleString(node)
      case 'string_pattern':
        return this.handleStringPattern(node)
      case 'tuple':
        return this.handleTuple(node)
      case 'tuple_pattern':
        return this.handleTuplePattern(node)
      case 'type':
        return this.handleType(node)
      case 'when_clause':
        return this.handleWhenClause(node)
      case 'when_clauses':
        return this.handleWhenClauses(node)
      default:
        throw new InternalError(
          'GenerateCode: Could not find generator for AST node ' +
            `'${node.type}'.`,
        )
    }
  }

  private handleAbstraction = (node: Parser.SyntaxNode): string => {
    const branches = node.namedChildren
      .map((element) => this.traverse(element))
      .filter(isNotUndefined)
      .join(',')

    return (
      'stdlib.Curry.perform((...args)=>' +
      `stdlib.ResolveAbstractionBranch.perform(args,[${branches}]))`
    )
  }

  private handleAbstractionBranch = (node: Parser.SyntaxNode): string => {
    const parameters = this.traverse(node.namedChild(0)!)!
    const body = this.traverse(node.namedChild(1)!)
    const [pattern, identifiers] = ResolvePattern.perform(parameters)
    const defaults = new CollectDefaultValues(this).perform(node.namedChild(0)!)

    return (
      `[${pattern},${defaults},(match)=>{` +
      `const [${identifiers.join(',')}]=match;return ${body}}]`
    )
  }

  private handleAccess = (node: Parser.SyntaxNode): string => {
    const left = this.traverse(node.namedChild(0)!)
    const right = this.traverse(node.namedChild(1)!)

    return `${left}[${right}]`
  }

  private handleApplication = (node: Parser.SyntaxNode): string => {
    const abstraction = this.traverse(node.namedChild(0)!)
    const args = this.traverse(node.namedChild(1)!)

    return `${abstraction}(${args})`
  }

  private handleArgument = (node: Parser.SyntaxNode): string => {
    if (node.namedChildCount == 0) return `"${TRANSFORM_PLACEHOLDER_ARGUMENT}"`

    const expression = this.traverse(node.namedChild(0)!)!
    return expression
  }

  private handleArguments = (node: Parser.SyntaxNode): string => {
    const args = node.namedChildren
      .map((argument) => this.traverse(argument))
      .filter(isNotUndefined)
      .join(',')

    return args
  }

  private handleAssignment = (node: Parser.SyntaxNode): string => {
    const left = this.traverse(node.namedChild(0)!)!
    const right = this.traverse(node.namedChild(1)!)
    const [pattern, identifiers] = ResolvePattern.perform(left)
    const defaults = new CollectDefaultValues(this).perform(node.namedChild(0)!)

    return (
      `(()=>{const value=${right};[${identifiers.join(',')}]=new stdlib.` +
      `PatternMatch({defaults:${defaults},overmatching:true}).perform(` +
      `${pattern},value);return value})()`
    )
  }

  private handleBlock = (node: Parser.SyntaxNode): string => {
    this._walkFileModuleScope.enterBlock()
    const expressions = node.namedChildren
      .map((expression) => this.traverse(expression))
      .filter(isNotUndefined)
    const endsWithReturn = node.lastNamedChild!.type === 'return'
    const block = new GenerateBlock(
      this._walkFileModuleScope.scope,
      this._transformIdentifier,
    ).perform(expressions, endsWithReturn)
    this._walkFileModuleScope.leaveBlock()

    return block
  }

  private handleCase = (node: Parser.SyntaxNode): string => {
    const value = this.traverse(node.namedChild(0)!)
    const branches = this.traverse(node.namedChild(1)!)
    if (node.namedChildCount == 2)
      return `stdlib.ResolveAbstractionBranch.perform(${value},[${branches}])`

    const defaultValue = this.traverse(node.namedChild(2)!)
    return (
      `stdlib.ResolveAbstractionBranch.perform(${value},[${branches}],` +
      `()=>${defaultValue},false)`
    )
  }

  private handleElseIfClause = (node: Parser.SyntaxNode): string => {
    const condition = this.traverse(node.namedChild(0)!)
    const consequence = this.traverse(node.namedChild(1)!)

    return `else if(${condition}){return ${consequence}}`
  }

  private handleElseIfClauses = (node: Parser.SyntaxNode): string => {
    const clauses = node.namedChildren
      .map((clause) => this.traverse(clause))
      .filter(isNotUndefined)
      .join('')

    return clauses
  }

  private handleExport = (node: Parser.SyntaxNode): string => {
    const declaration = this.traverse(node.namedChild(0)!)!

    return declaration
  }

  private handleExpressionPair = (node: Parser.SyntaxNode): string => {
    const left = this.traverse(node.namedChild(0)!)
    const right = this.traverse(node.namedChild(1)!)

    return `[${left}]:${right}`
  }

  private handleGenerator = (node: Parser.SyntaxNode): string => {
    const name = this._transformIdentifier.perform(node.namedChild(0)!.text)
    const value = this.traverse(node.namedChild(1)!)
    if (node.namedChildCount == 2) return `${value}.map((${name})=>`

    const condition = this.traverse(node.namedChild(2)!)
    return `${value}.map((${name})=>!${condition} ? "${INTERNAL_TEMP_TOKEN}" : `
  }

  private handleGenerators = (node: Parser.SyntaxNode): string => {
    const generators = node.namedChildren
      .map((generator) => this.traverse(generator))
      .filter(isNotUndefined)
      .join('')

    this._listComprehensionGeneratorCountStack.push(node.namedChildCount)
    return generators
  }

  private handleIdentifier = (node: Parser.SyntaxNode): string =>
    this._transformIdentifier.perform(node.text)

  private handleIdentifierPattern = (node: Parser.SyntaxNode): string =>
    this.traverse(node.namedChild(0)!)!

  private handleIdentifierPatternName = (node: Parser.SyntaxNode): string => {
    const name = this._transformIdentifier.perform(node.text)

    return `"${INTERNAL_TEMP_TOKEN}${name}"`
  }

  // eslint-disable-next-line max-lines-per-function
  private handleIf = (node: Parser.SyntaxNode): string => {
    const condition = this.traverse(node.namedChild(0)!)
    const consequence = this.traverse(node.namedChild(1)!)
    if (node.namedChildCount == 2)
      return `(()=>{if(${condition}){return ${consequence}}})()`

    if (node.namedChild(node.namedChildCount - 1)!.type === 'else_if_clauses') {
      const clauses = this.traverse(node.namedChild(2)!)

      return `(()=>{if(${condition}){return ${consequence}}${clauses}})()`
    } else if (node.namedChildCount == 3) {
      const alternative = this.traverse(node.namedChild(2)!)

      return (
        `(()=>{if(${condition}){return ${consequence}}` +
        `else{return ${alternative}}})()`
      )
    } else {
      const clauses = this.traverse(node.namedChild(2)!)
      const alternative = this.traverse(node.namedChild(3)!)

      return (
        `(()=>{if(${condition}){return ${consequence}}${clauses}` +
        `else{return ${alternative}}})()`
      )
    }
  }

  private handleInfixApplication = (node: Parser.SyntaxNode): string => {
    const abstraction = this.traverse(node.namedChild(1)!)
    const left = this.traverse(node.namedChild(0)!)
    const right = this.traverse(node.namedChild(2)!)

    return `${abstraction}(${left},${right})`
  }

  private handleInterpolation = (node: Parser.SyntaxNode): string =>
    this.traverse(node.namedChild(0)!)!

  private handleList = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map((element) => this.traverse(element))
      .filter(isNotUndefined)
      .join(',')

    return `[${elements}]`
  }

  private handleListComprehension = (node: Parser.SyntaxNode): string => {
    const body = this.traverse(node.namedChild(0)!)
    const generators = this.traverse(node.namedChild(1)!)
    const generatorCount = this._listComprehensionGeneratorCountStack.pop()
    assert(
      generatorCount !== undefined,
      'generatorCount should have been pushed when analyzing generators.',
    )

    return (
      `${generators}${body}${')'.repeat(generatorCount)}.flat(` +
      `${generatorCount - 1}).filter(e=>e!=="${INTERNAL_TEMP_TOKEN}")`
    )
  }

  private handleListPattern = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map((element) => this.traverse(element))
      .filter(isNotUndefined)
      .join(',')

    return `[${elements}]`
  }

  private handleMap = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map((element) => this.traverse(element))
      .filter(isNotUndefined)
      .join(',')

    return `{${elements}}`
  }

  private handleMapPattern = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map((element) => this.traverse(element))
      .filter(isNotUndefined)
      .join(',')

    return `{${elements}}`
  }

  private handleModule = (node: Parser.SyntaxNode): string => {
    const name = this.traverse(node.namedChild(0)!)
    const body = this.traverse(node.namedChild(1)!)

    return `(()=>{${name}=${body};return ${name}})()`
  }

  private handleParameters = (node: Parser.SyntaxNode): string => {
    const parameters = node.namedChildren
      .map((parameter) => this.traverse(parameter))
      .filter(isNotUndefined)
      .join(',')

    return `[${parameters}]`
  }

  private handlePatternList = (node: Parser.SyntaxNode): string => {
    const patterns = node.namedChildren
      .map((pattern) => this.traverse(pattern))
      .filter(isNotUndefined)
      .join(';')

    return patterns
  }

  private handlePatternPair = (node: Parser.SyntaxNode): string => {
    const left = this.traverse(node.namedChild(0)!)
    const right = this.traverse(node.namedChild(1)!)

    return `"[${left}]":${right}`
  }

  private handlePipeline = (node: Parser.SyntaxNode): string => {
    const left = this.traverse(node.namedChild(0)!)
    const right = this.traverse(node.namedChild(1)!)

    return `${right}(${left})`
  }

  private handlePrefixApplication = (node: Parser.SyntaxNode): string => {
    const abstraction = this.traverse(node.namedChild(0)!)
    const argument = this.traverse(node.namedChild(1)!)

    return `${abstraction}(${argument})`
  }

  private handleProgram = (node: Parser.SyntaxNode): string => {
    const expressions = node.namedChildren
      .map((expression) => this.traverse(expression))
      .filter(isNotUndefined)

    assert(
      this._walkFileModuleScope.scope instanceof FileModuleScope,
      'File module scope walker should end up at file-level scope.',
    )

    return new GenerateProgram(
      this._walkFileModuleScope.scope,
      this._transformIdentifier,
    ).perform(expressions)
  }

  private handleRestList = (node: Parser.SyntaxNode): string => {
    const name = this.traverse(node.namedChild(0)!)!.slice(1, -1)

    return `"${INTERNAL_TEMP_TOKEN}${name}"`
  }

  private handleRestMap = (node: Parser.SyntaxNode): string => {
    const name = this.traverse(node.namedChild(0)!)!.slice(1, -1)

    return `"['${TRANSFORM_REST_PATTERN}']":"${name}"`
  }

  private handleReturn = (node: Parser.SyntaxNode): string => {
    if (node.namedChildCount == 0) return 'return'

    const value = this.traverse(node.namedChild(0)!)
    return `return ${value}`
  }

  private handleShorthandAccessIdentifier = (
    node: Parser.SyntaxNode,
  ): string => {
    const name = this._transformIdentifier.perform(node.text)

    return `'${name}'`
  }

  private handleShorthandPairIdentifier = (node: Parser.SyntaxNode): string => {
    return this._transformIdentifier.perform(node.text)
  }

  private handleShorthandPairIdentifierPattern = (
    node: Parser.SyntaxNode,
  ): string => {
    const identifierPatternName = this.traverse(node.namedChild(0)!)!

    return (
      `"${identifierPatternName.substring(INTERNAL_TEMP_TOKEN.length + 1)}` +
      `:${identifierPatternName}`
    )
  }

  private handleSpreadList = (node: Parser.SyntaxNode): string => {
    const expression = this.traverse(node.namedChild(0)!)

    return `...${expression}`
  }

  private handleSpreadMap = (node: Parser.SyntaxNode): string => {
    const expression = this.traverse(node.namedChild(0)!)

    return `...${expression}`
  }

  private handleString = (node: Parser.SyntaxNode): string => {
    const interpolations = node.namedChildren
      .filter((child) => child.type === 'interpolation')
      .map((child) => this.handleInterpolation(child))
    const content = ParseStringContent.perform(node.text)
      .replace(/(?<!\\){/g, '${')
      .replace(/(?<=\${).+?(?=})/g, () => interpolations.shift()!)

    return `\`${content}\``
  }

  private handleStringPattern = (node: Parser.SyntaxNode): string => {
    const content = ParseStringContent.perform(node.text, '"')

    return `"${content}"`
  }

  private handleTuple = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map((element) => this.traverse(element))
      .filter(isNotUndefined)
      .join(',')

    return `[${elements}]`
  }

  private handleTuplePattern = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map((element) => this.traverse(element))
      .filter(isNotUndefined)
      .join(',')

    return `[${elements}]`
  }

  private handleType = (node: Parser.SyntaxNode): string => {
    const name = node.text

    return this._transformIdentifier.perform(name)
  }

  private handleWhenClause = (node: Parser.SyntaxNode): string => {
    const patterns = this.traverse(node.namedChild(0)!)!
      .split(';')
      .map((pattern) => ResolvePattern.perform(pattern))
    const body = this.traverse(node.namedChild(1)!)
    const defaults = node
      .namedChild(0)!
      .namedChildren.map((pattern) =>
        new CollectDefaultValues(this).perform(pattern),
      )

    return patterns
      .map(([pattern, identifiers], i) => {
        return (
          `[${pattern},${defaults[i]},(match)=>{` +
          `const [${identifiers.join(',')}]=match;return ${body}}]`
        )
      })
      .join(',')
  }

  private handleWhenClauses = (node: Parser.SyntaxNode): string => {
    const clauses = node.namedChildren
      .map((clause) => this.traverse(clause))
      .filter(isNotUndefined)
      .join(',')

    return clauses
  }
}
