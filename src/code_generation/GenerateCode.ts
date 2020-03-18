import path from 'path'
import Parser from 'tree-sitter'

import { getOutputPathForFile } from '../utilities'
import {
  FILE_EXTENSION,
  TARGET_FILE_EXTENSION,
  OPERATOR_REGEX,
  DEFAULT_IMPORTS,
  TRANSFORM_PLACEHOLDER_ARGUMENT,
  TRANSFORM_REST_PATTERN,
  INTERNAL_IDENTIFIER_PREFIX,
  INTERNAL_TEMP_TOKEN
} from '../constants'

import { CollectDefaultValues } from './CollectDefaultValues'
import { ParseStringContent } from './ParseStringContent'
import { ResolvePattern } from './ResolvePattern'

export class GenerateCode {
  file: string
  private files: string[]
  private identifiers: string[] = []
  private outputPath: string
  private stack: any[] = []

  constructor(outputPath: string, files: string[]) {
    this.outputPath = outputPath
    this.files = files
  }

  generate = (node: Parser.SyntaxNode): string => {
    switch (node.type) {
    case 'abstraction':
      return this.generateAbstraction(node)
    case 'abstraction_branch':
      return this.generateAbstractionBranch(node)
    case 'application':
      return this.generateApplication(node)
    case 'argument':
      return this.generateArgument(node)
    case 'arguments':
      return this.generateArguments(node)
    case 'assignment':
      return this.generateAssignment(node)
    case 'block':
      return this.generateBlock(node)
    case 'boolean':
      return this.generateBoolean(node)
    case 'comment':
      return this.generateComment(node)
    case 'export':
      return this.generateExport(node)
    case 'expression_pair':
      return this.generateExpressionPair(node)
    case 'generator':
      return this.generateGenerator(node)
    case 'generator_condition':
      return this.generateGeneratorCondition(node)
    case 'generators':
      return this.generateGenerators(node)
    case 'identifier':
      return this.generateIdentifier(node)
    case 'identifier_pattern':
      return this.generateIdentifierPattern(node)
    case 'import':
      return this.generateImport(node)
    case 'import_clause':
      return this.generateImportClause(node)
    case 'import_clause_identifier_pair':
      return this.generateImportClauseIdentifierPair(node)
    case 'infix_application':
      return this.generateInfixApplication(node)
    case 'infix_application_operator':
      return this.generateInfixApplicationOperator(node)
    case 'list':
      return this.generateList(node)
    case 'list_comprehension':
      return this.generateListComprehension(node)
    case 'list_pattern':
      return this.generateListPattern(node)
    case 'map':
      return this.generateMap(node)
    case 'map_pattern':
      return this.generateMapPattern(node)
    case 'number':
      return this.generateNumber(node)
    case 'parameters':
      return this.generateParameters(node)
    case 'pattern':
      return this.generatePattern(node)
    case 'pattern_pair':
      return this.generatePatternPair(node)
    case 'pipeline':
      return this.generatePipeline(node)
    case 'prefix_application':
      return this.generatePrefixApplication(node)
    case 'program':
      return this.generateProgram(node)
    case 'regex':
      return this.generateRegex(node)
    case 'rest_list':
      return this.generateRestList(node)
    case 'rest_map':
      return this.generateRestMap(node)
    case 'return':
      return this.generateReturn(node)
    case 'shorthand_pair_identifier':
      return this.generateShorthandPairIdentifier(node)
    case 'shorthand_pair_identifier_pattern':
      return this.generateShorthandPairIdentifierPattern(node)
    case 'spread':
      return this.generateSpread(node)
    case 'string':
      return this.generateString(node)
    case 'string_pattern':
      return this.generateStringPattern(node)
    case 'tuple':
      return this.generateTuple(node)
    case 'tuple_pattern':
      return this.generateTuplePattern(node)
    default:
      console.log(`Could not find generator for AST node '${node.type}'.`)
      process.exit(1)
    }
  }

  generateAbstraction = (node: Parser.SyntaxNode): string => {
    const branches = node.namedChildren
      .map(element => this.generate(element))
      .join(',')

    return 'stdlib.Curry.perform((...args)=>' +
           `stdlib.ResolveAbstractionBranch.perform(args,[${branches}]))`
  }

  generateAbstractionBranch = (node: Parser.SyntaxNode): string => {
    const parameters = this.generate(node.namedChild(0))
    const body = this.generate(node.namedChild(1))
    const [pattern, identifiers] = ResolvePattern.perform(parameters)
    const defaults = new CollectDefaultValues(this).perform(node.namedChild(0))

    return `[${pattern},${defaults},(match)=>{` +
           `const [${identifiers.join(',')}]=match;return ${body}}]`
  }

  generateApplication = (node: Parser.SyntaxNode): string => {
    const abstraction = this.generate(node.namedChild(0))
    const args = this.generate(node.namedChild(1))

    return `${abstraction}(${args})`
  }

  generateArgument = (node: Parser.SyntaxNode): string => {
    if (node.namedChildCount == 0) return `"${TRANSFORM_PLACEHOLDER_ARGUMENT}"`

    const expression = this.generate(node.namedChild(0))
    return expression
  }

  generateArguments = (node: Parser.SyntaxNode): string => {
    const args = node.namedChildren
      .map(argument => this.generate(argument))
      .join(',')

    return args
  }

  generateAssignment = (node: Parser.SyntaxNode): string => {
    const left = this.generate(node.namedChild(0))
    const right = this.generate(node.namedChild(1))
    const [pattern, identifiers] = ResolvePattern.perform(left)
    const defaults = new CollectDefaultValues(this).perform(node.namedChild(0))

    return `const [${identifiers.join(',')}]=` +
           `new stdlib.PatternMatch({defaults:${defaults}})` +
           `.perform(${pattern},${right})`
  }

  generateBlock = (node: Parser.SyntaxNode): string => {
    const expressions = node.namedChildren
      .map(expression => this.generate(expression))
      .join(';')

    return expressions
  }

  generateBoolean = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generateComment = (node: Parser.SyntaxNode): string => {
    return ''
  }

  generateExport = (node: Parser.SyntaxNode): string => {
    const declaration = this.generate(node.namedChild(0))

    return `export ${declaration}`
  }

  generateExpressionPair = (node: Parser.SyntaxNode): string => {
    const left = this.generate(node.namedChild(0))
    const right = this.generate(node.namedChild(1))

    return `[${left}]:${right}`
  }

  generateGenerator = (node: Parser.SyntaxNode): string => {
    const name = this.generate(node.namedChild(0))
    const value = this.generate(node.namedChild(1))
    if (!GenerateCode.nodeHasChild(node, 'generator_condition'))
      return `${value}.map((${name})=>`

    const condition = this.generate(node.namedChild(2))
    return `${value}.map((${name})=>!${condition} ? null : `
  }

  generateGeneratorCondition = (node: Parser.SyntaxNode): string => {
    const expression = this.generate(node.namedChild(0))

    return expression
  }

  generateGenerators = (node: Parser.SyntaxNode): string => {
    const generators = node.namedChildren
      .map(generator => this.generate(generator))
      .join('')

    this.stack.push(node.namedChildCount)
    return generators
  }

  generateIdentifier = (node: Parser.SyntaxNode): string => {
    return this.getIdentifier(node.text)
  }

  generateIdentifierPattern = (node: Parser.SyntaxNode): string => {
    return `"${INTERNAL_TEMP_TOKEN}${this.getIdentifier(node.text)}"`
  }

  generateImport = (node: Parser.SyntaxNode): string => {
    const clause = this.generate(node.namedChild(0))
    const source = this.generate(node.namedChild(1)).slice(1, -1)

    return `import ${clause} from '${this.getImportSource(source)}'`
  }

  generateImportClause = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map(element => this.generate(element))
      .join(',')

    return `{${elements}}`
  }

  generateImportClauseIdentifierPair = (node: Parser.SyntaxNode): string => {
    const left = this.generate(node.namedChild(0))
    const right = this.generate(node.namedChild(1))

    return `${left} as ${right}`
  }

  generateInfixApplication = (node: Parser.SyntaxNode): string => {
    const abstraction = this.generate(node.namedChild(1))
    const left = this.generate(node.namedChild(0))
    const right = this.generate(node.namedChild(2))

    return `${abstraction}(${left},${right})`
  }

  generateInfixApplicationOperator = (node: Parser.SyntaxNode): string => {
    return this.getIdentifier(node.text)
  }

  generateList = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map(element => this.generate(element))
      .join(',')

    return `[${elements}]`
  }

  generateListComprehension = (node: Parser.SyntaxNode): string => {
    const body = this.generate(node.namedChild(0))
    const generators = this.generate(node.namedChild(1))
    const generatorCount = this.stack.pop()

    return `${generators}${body}${')'.repeat(generatorCount)}` +
           `.flat(${generatorCount - 1}).filter(e=>e!==null)`
  }

  generateListPattern = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map(element => this.generate(element))
      .join(',')

    return `[${elements}]`
  }

  generateMap = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map(element => this.generate(element))
      .join(',')

    return `{${elements}}`
  }

  generateMapPattern = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map(element => this.generate(element))
      .join(',')

    return `{${elements}}`
  }

  generateNumber = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generateParameters = (node: Parser.SyntaxNode): string => {
    const parameters = node.namedChildren
      .map(parameter => this.generate(parameter))
      .join(',')

    return `[${parameters}]`
  }

  generatePattern = (node: Parser.SyntaxNode): string => {
    return this.generate(node.namedChild(0))
  }

  generatePatternPair = (node: Parser.SyntaxNode): string => {
    const left = this.generate(node.namedChild(0))
    const right = this.generate(node.namedChild(1))

    return `"${left.slice(1, -1)}":${right}`
  }

  generatePipeline = (node: Parser.SyntaxNode): string => {
    const left = this.generate(node.namedChild(0))
    const right = this.generate(node.namedChild(1))

    return `${right}(${left})`
  }

  generatePrefixApplication = (node: Parser.SyntaxNode): string => {
    const abstraction = this.generate(node.namedChild(0))
    const argument = this.generate(node.namedChild(1))

    return `${abstraction}(${argument})`
  }

  generateProgram = (node: Parser.SyntaxNode): string => {
    const expressions = node.namedChildren
      .map(expression => this.generate(expression))
      .join(';')

    return `${DEFAULT_IMPORTS};${expressions}`
  }

  generateRegex = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generateRestList = (node: Parser.SyntaxNode): string => {
    const name = this.generate(node.namedChild(0)).slice(1, -1)

    return `"${INTERNAL_TEMP_TOKEN}${name}"`
  }

  generateRestMap = (node: Parser.SyntaxNode): string => {
    const name = this.generate(node.namedChild(0)).slice(1, -1)

    return `"['${TRANSFORM_REST_PATTERN}']":"${name}"`
  }

  generateReturn = (node: Parser.SyntaxNode): string => {
    if (node.namedChildCount == 0) return 'return'

    const value = this.generate(node.namedChild(0))
    return `return ${value}`
  }

  generateShorthandPairIdentifier = (node: Parser.SyntaxNode): string => {
    return this.getIdentifier(node.text)
  }

  generateShorthandPairIdentifierPattern = (
    node: Parser.SyntaxNode
  ): string => {
    const identifierPattern = this.generate(node.namedChild(0))

    return `"${identifierPattern.substring(1)}":"${identifierPattern}"`
  }

  generateSpread = (node: Parser.SyntaxNode): string => {
    const expression = this.generate(node.namedChild(0))

    return `...${expression}`
  }

  generateString = (node: Parser.SyntaxNode): string => {
    const content =
      ParseStringContent.perform(node.text).replace(/(?<!\\){/g, '${')

    return `\`${content}\``
  }

  generateStringPattern = (node: Parser.SyntaxNode): string => {
    const content = ParseStringContent.perform(node.text, '"')

    return `"${content}"`
  }

  generateTuple = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map(element => this.generate(element))
      .join(',')

    return `[${elements}]`
  }

  generateTuplePattern = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map(element => this.generate(element))
      .join(',')

    return `[${elements}]`
  }

  private getIdentifier = (identifier: string): string => {
    if (!OPERATOR_REGEX.test(identifier)) return identifier

    const index = this.identifiers.indexOf(identifier)
    if (index != -1) return `${INTERNAL_IDENTIFIER_PREFIX}${index}`

    const length = this.identifiers.push(identifier)
    return `${INTERNAL_IDENTIFIER_PREFIX}${length - 1}`
  }

  private getImportSource = (source: string): string => {
    const pathToSource = path.join(this.file, '..', source)
    if (!source.endsWith(FILE_EXTENSION)) return pathToSource

    const pathToCompiledSource = path.join(
      getOutputPathForFile(this.outputPath, this.file),
      '..',
      source.replace(FILE_EXTENSION, TARGET_FILE_EXTENSION)
    )
    this.files.push(pathToSource)
    return pathToCompiledSource
  }

  private static nodeHasChild = (
    node: Parser.SyntaxNode, type: string
  ): boolean => {
    return node.children.map(child => child.type).includes(type)
  }
}
