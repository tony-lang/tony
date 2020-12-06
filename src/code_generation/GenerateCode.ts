import * as AST from '../ast'
import {
  CollectDefaultValues,
  GenerateBlock,
  GenerateProgram,
  ParseStringContent,
  ResolvePattern,
} from './services'
import { CompileError, InternalError, assert } from '../errors'
import { FileModuleScope, WalkFileModuleScope } from '../symbol_table'
import {
  TRANSFORM_PLACEHOLDER_ARGUMENT,
  TRANSFORM_REST_PATTERN,
} from '../constants'

export const INTERNAL_TEMP_TOKEN = Object.freeze('#TONY_INTERNAL_TEMP')

export class GenerateCode {
  private _fileScope: FileModuleScope
  private _walkFileModuleScope: WalkFileModuleScope

  constructor(fileScope: FileModuleScope) {
    this._fileScope = fileScope
    this._walkFileModuleScope = new WalkFileModuleScope(fileScope)
  }

  perform = (): string => {
    assert(
      this._fileScope.annotatedTree !== undefined,
      'Annotated syntax tree of file scope should be present.',
    )

    try {
      return this.handleProgram(this._fileScope.annotatedTree)
    } catch (error) {
      if (error instanceof CompileError)
        error.filePath = this._fileScope.filePath
      throw error
    }
  }

  // eslint-disable-next-line max-lines-per-function
  traverse = (node: AST.SyntaxNode): string => {
    if (node.constructor === AST.Abstraction)
      return this.handleAbstraction(node as AST.Abstraction)
    else if (node.constructor === AST.AbstractionBranch)
      return this.handleAbstractionBranch(node as AST.AbstractionBranch)
    else if (node.constructor === AST.Access)
      return this.handleAccess(node as AST.Access)
    else if (node.constructor === AST.Application)
      return this.handleApplication(node as AST.Application)
    else if (node.constructor === AST.Argument)
      return this.handleArgument(node as AST.Argument)
    else if (node.constructor === AST.Assignment)
      return this.handleAssignment(node as AST.Assignment)
    else if (node.constructor === AST.Block)
      return this.handleBlock(node as AST.Block)
    else if (node.constructor === AST.Boolean) return (node as AST.Boolean).text
    else if (node.constructor === AST.Case)
      return this.handleCase(node as AST.Case)
    else if (node.constructor === AST.ElseIf)
      return this.handleElseIf(node as AST.ElseIf)
    else if (node.constructor === AST.Export)
      return this.handleExport(node as AST.Export)
    else if (node.constructor === AST.ExpressionPair)
      return this.handleExpressionPair(node as AST.ExpressionPair)
    else if (node.constructor === AST.Generator)
      return this.handleGenerator(node as AST.Generator)
    else if (node.constructor === AST.Identifier)
      return this.handleIdentifier(node as AST.Identifier)
    else if (node.constructor === AST.IdentifierPattern)
      return this.handleIdentifierPattern(node as AST.IdentifierPattern)
    else if (node.constructor === AST.If) return this.handleIf(node as AST.If)
    else if (node.constructor === AST.Import) return ''
    else if (node.constructor === AST.InfixApplication)
      return this.handleInfixApplication(node as AST.InfixApplication)
    else if (node.constructor === AST.Interpolation)
      return this.handleInterpolation(node as AST.Interpolation)
    else if (node.constructor === AST.List)
      return this.handleList(node as AST.List)
    else if (node.constructor === AST.ListComprehension)
      return this.handleListComprehension(node as AST.ListComprehension)
    else if (node.constructor === AST.ListPattern)
      return this.handleListPattern(node as AST.ListPattern)
    else if (node.constructor === AST.Map)
      return this.handleMap(node as AST.Map)
    else if (node.constructor === AST.MapPattern)
      return this.handleMapPattern(node as AST.MapPattern)
    else if (node.constructor === AST.Module)
      return this.handleModule(node as AST.Module)
    else if (node.constructor === AST.Number) return (node as AST.Number).text
    else if (node.constructor === AST.Parameters)
      return this.handleParameters(node as AST.Parameters)
    else if (node.constructor === AST.ParametricType)
      return (node as AST.ParametricType).name
    else if (node.constructor === AST.PatternPair)
      return this.handlePatternPair(node as AST.PatternPair)
    else if (node.constructor === AST.Pipeline)
      return this.handlePipeline(node as AST.Pipeline)
    else if (node.constructor === AST.PrefixApplication)
      return this.handlePrefixApplication(node as AST.PrefixApplication)
    else if (node.constructor === AST.Regex) return (node as AST.Regex).text
    else if (
      node.constructor === AST.RestList ||
      node.constructor === AST.RestTuple
    )
      return this.handleRestListOrRestTuple(
        node as AST.RestList | AST.RestTuple,
      )
    else if (node.constructor === AST.RestMap)
      return this.handleRestMap(node as AST.RestMap)
    else if (node.constructor === AST.Return)
      return this.handleReturn(node as AST.Return)
    else if (node.constructor === AST.ShorthandAccessIdentifier)
      return this.handleShorthandAccessIdentifier(
        node as AST.ShorthandAccessIdentifier,
      )
    else if (node.constructor === AST.ShorthandPairIdentifier)
      return this.handleShorthandPairIdentifier(
        node as AST.ShorthandPairIdentifier,
      )
    else if (node.constructor === AST.ShorthandPairIdentifierPattern)
      return this.handleShorthandPairIdentifierPattern(
        node as AST.ShorthandPairIdentifierPattern,
      )
    else if (node.constructor === AST.Spread)
      return this.handleSpread(node as AST.Spread)
    else if (node.constructor === AST.String)
      return this.handleString(node as AST.String)
    else if (node.constructor === AST.StringPattern)
      return this.handleStringPattern(node as AST.StringPattern)
    else if (node.constructor === AST.Tuple)
      return this.handleTuple(node as AST.Tuple)
    else if (node.constructor === AST.TuplePattern)
      return this.handleTuplePattern(node as AST.TuplePattern)
    else if (node.constructor === AST.When)
      return this.handleWhen(node as AST.When)

    throw new InternalError(
      'Could not find generator for AST node ' + `'${node.constructor.name}'.`,
    )
  }

  private handleAbstraction = (node: AST.Abstraction): string => {
    const branches = node.branches
      .map((branch) => this.traverse(branch))
      .join(',')

    return (
      'stdlib.Curry.perform((...args)=>' +
      `stdlib.ResolveAbstractionBranch.perform(args,[${branches}]))`
    )
  }

  private handleAbstractionBranch = (node: AST.AbstractionBranch): string => {
    this._walkFileModuleScope.peekBlock()
    const parameters = this.traverse(node.parameters)
    this._walkFileModuleScope.leaveBlock()

    const body = this.traverse(node.body)
    const [pattern, identifiers] = ResolvePattern.perform(parameters)
    const defaults = new CollectDefaultValues(this).perform(node.parameters)

    return (
      `[${pattern},${defaults},(match)=>{` +
      `const [${identifiers.join(',')}]=match;return ${body}}]`
    )
  }

  private handleAccess = (node: AST.Access): string =>
    `${this.traverse(node.value)}[${this.traverse(node.accessor)}]`

  private handleApplication = (node: AST.Application): string =>
    `${this.traverse(node.value)}(${node.arguments
      .map((argument) => this.traverse(argument))
      .join(',')})`

  private handleArgument = (node: AST.Argument): string => {
    if (node.value === undefined) return `"${TRANSFORM_PLACEHOLDER_ARGUMENT}"`

    return this.traverse(node.value)
  }

  private handleAssignment = (node: AST.Assignment): string => {
    const [pattern, identifiers] = ResolvePattern.perform(
      this.traverse(node.pattern),
    )
    const defaults = new CollectDefaultValues(this).perform(node.pattern)

    return (
      `(()=>{const value=${this.traverse(node.value)};[${identifiers.join(
        ',',
      )}]=new stdlib.` +
      `PatternMatch({defaults:${defaults},overmatching:true}).perform(` +
      `${pattern},value);return value})()`
    )
  }

  private handleBlock = (node: AST.Block): string => {
    this._walkFileModuleScope.enterBlock()
    const expressions = node.expressions.map((expression) =>
      this.traverse(expression),
    )
    const endsWithReturn =
      node.expressions[node.expressions.length - 1] instanceof AST.Return
    const block = new GenerateBlock(this._walkFileModuleScope.scope).perform(
      expressions,
      endsWithReturn,
    )
    this._walkFileModuleScope.leaveBlock()

    return block
  }

  private handleCase = (node: AST.Case): string => {
    const value = this.traverse(node.value)
    const branches = node.branches
      .map((branch) => this.traverse(branch))
      .join(',')
    if (node.else === undefined)
      return `stdlib.ResolveAbstractionBranch.perform(${value},[${branches}])`

    const defaultValue = this.traverse(node.else)
    return (
      `stdlib.ResolveAbstractionBranch.perform(${value},[${branches}],` +
      `()=>${defaultValue},false)`
    )
  }

  private handleElseIf = (node: AST.ElseIf): string =>
    `else if(${this.traverse(node.condition)}){return ${this.traverse(
      node.body,
    )}}`

  private handleExport = (node: AST.Export): string =>
    this.traverse(node.declaration)

  private handleExpressionPair = (node: AST.ExpressionPair): string =>
    `[${this.traverse(node.key)}]:${this.traverse(node.value)}`

  private handleGenerator = (node: AST.Generator): string => {
    const value = this.traverse(node.value)
    if (node.condition === undefined)
      return `${value}.map((${node.transformedName})=>`

    return `${value}.map((${node.transformedName})=>!${this.traverse(
      node.condition,
    )} ? "${INTERNAL_TEMP_TOKEN}" : `
  }

  private handleIdentifier = (node: AST.Identifier): string =>
    node.transformedName

  private handleIdentifierPattern = (node: AST.IdentifierPattern): string =>
    `"${INTERNAL_TEMP_TOKEN}${node.transformedName}"`

  private handleIf = (node: AST.If): string => {
    let result = '(()=>{'

    const condition = this.traverse(node.condition)
    const body = this.traverse(node.body)
    result += `if(${condition}){return ${body}}`

    if (node.elseIfs.length > 0)
      result += node.elseIfs.map((elseIf) => this.traverse(elseIf)).join('')

    if (node.else) result += `else{return ${this.traverse(node.else)}}`

    result += '})()'
    return result
  }

  private handleInfixApplication = (node: AST.InfixApplication): string =>
    `${this.traverse(node.value)}(${this.traverse(node.left)},${this.traverse(
      node.right,
    )})`

  private handleInterpolation = (node: AST.Interpolation): string =>
    this.traverse(node.value)

  private handleList = (node: AST.List): string => {
    const elements = node.elements
      .map((element) => this.traverse(element))
      .join(',')

    return `[${elements}]`
  }

  private handleListComprehension = (node: AST.ListComprehension): string => {
    this._walkFileModuleScope.peekBlock()
    const generators = node.generators
      .map((generator) => this.traverse(generator))
      .join('')
    this._walkFileModuleScope.leaveBlock()

    const body = this.traverse(node.body)

    return (
      `${generators}${body}${')'.repeat(node.generators.length)}.flat(` +
      `${node.generators.length - 1}).filter(e=>e!=="${INTERNAL_TEMP_TOKEN}")`
    )
  }

  private handleListPattern = (node: AST.ListPattern): string => {
    const elements = node.elements
      .map((element) => this.traverse(element))
      .join(',')

    return `[${elements}]`
  }

  private handleMap = (node: AST.Map): string => {
    const elements = node.elements
      .map((element) => this.traverse(element))
      .join(',')

    return `{${elements}}`
  }

  private handleMapPattern = (node: AST.MapPattern): string => {
    const elements = node.elements
      .map((element) => this.traverse(element))
      .join(',')

    return `{${elements}}`
  }

  private handleModule = (node: AST.Module): string => {
    const name = this.traverse(node.name)

    return `(()=>{${name}=${this.traverse(node.body)};return ${name}})()`
  }

  private handleParameters = (node: AST.Parameters): string => {
    const parameters = node.parameters
      .map((parameter) => this.traverse(parameter))
      .join(',')

    return `[${parameters}]`
  }

  private handlePatternPair = (node: AST.PatternPair): string =>
    `"[${this.traverse(node.key)}]":${this.traverse(node.value)}`

  private handlePipeline = (node: AST.Pipeline): string =>
    `${this.traverse(node.value)}(${this.traverse(node.argument)})`

  private handlePrefixApplication = (node: AST.PrefixApplication): string =>
    `${this.traverse(node.value)}(${this.traverse(node.argument)})`

  private handleProgram = (node: AST.Program): string => {
    const expressions = node.expressions.map((expression) =>
      this.traverse(expression),
    )

    assert(
      this._walkFileModuleScope.scope instanceof FileModuleScope,
      'File module scope walker should end up at file-level scope.',
    )

    return new GenerateProgram(this._walkFileModuleScope.scope).perform(
      expressions,
    )
  }

  private handleRestListOrRestTuple = (
    node: AST.RestList | AST.RestTuple,
  ): string => {
    const name = this.traverse(node.name).slice(1, -1)

    return `"${INTERNAL_TEMP_TOKEN}${name}"`
  }

  private handleRestMap = (node: AST.RestMap): string => {
    const name = this.traverse(node.name).slice(1, -1)

    return `"['${TRANSFORM_REST_PATTERN}']":"${name}"`
  }

  private handleReturn = (node: AST.Return): string => {
    if (node.value === undefined) return 'return'

    return `return ${this.traverse(node.value)}`
  }

  private handleShorthandAccessIdentifier = (
    node: AST.ShorthandAccessIdentifier,
  ): string => `'${node.transformedName || node.name}'`

  private handleShorthandPairIdentifier = (
    node: AST.ShorthandPairIdentifier,
  ): string => `${node.name}:${node.transformedName}`

  private handleShorthandPairIdentifierPattern = (
    node: AST.ShorthandPairIdentifierPattern,
  ): string => `"${node.name}":"${INTERNAL_TEMP_TOKEN}${node.transformedName}"`

  private handleSpread = (node: AST.Spread): string =>
    `...${this.traverse(node.value)}`

  private handleString = (node: AST.String): string => {
    const interpolations = node.interpolations.map((child) =>
      this.traverse(child),
    )
    const content = ParseStringContent.perform(node.content)
      .replace(/(?<!\\){/g, '${')
      .replace(/(?<=\${).+?(?=})/g, () => interpolations.shift()!)

    return `\`${content}\``
  }

  private handleStringPattern = (node: AST.StringPattern): string => {
    const content = ParseStringContent.perform(node.content, '"')

    return `"${content}"`
  }

  private handleTuple = (node: AST.Tuple): string => {
    const elements = node.elements
      .map((element) => this.traverse(element))
      .join(',')

    return `[${elements}]`
  }

  private handleTuplePattern = (node: AST.TuplePattern): string => {
    const elements = node.elements
      .map((element) => this.traverse(element))
      .join(',')

    return `[${elements}]`
  }

  private handleWhen = (node: AST.When): string => {
    this._walkFileModuleScope.peekBlock()
    const patterns = node.patterns.map((pattern) =>
      ResolvePattern.perform(this.traverse(pattern)),
    )
    this._walkFileModuleScope.leaveBlock()

    const body = this.traverse(node.body)
    const defaults = node.patterns.map((pattern) =>
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
}
