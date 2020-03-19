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
import { GetScope } from './GetScope'
import { ParseStringContent } from './ParseStringContent'
import { ResolvePattern } from './ResolvePattern'
import { TransformIdentifier } from './TransformIdentifier'

export class GenerateCode {
  private declarationBlock = false
  file: string
  private files: string[]
  private getScope: GetScope
  private outputPath: string
  private stack: any[] = []
  private transformIdentifier = new TransformIdentifier

  constructor(outputPath: string, files: string[]) {
    this.outputPath = outputPath
    this.files = files

    this.getScope = new GetScope(this.transformIdentifier)
  }

  generate = (node: Parser.SyntaxNode): string => {
    switch (node.type) {
    case 'abstraction':
      return this.generateAbstraction(node)
    case 'abstraction_branch':
      return this.generateAbstractionBranch(node)
    case 'access':
      return this.generateAccess(node)
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
    case 'case':
      return this.generateCase(node)
    case 'comment':
      return this.generateComment(node)
    case 'else_if_clause':
      return this.generateElseIfClause(node)
    case 'else_if_clauses':
      return this.generateElseIfClauses(node)
    case 'export':
      return this.generateExport(node)
    case 'expression_list':
      return this.generateExpressionList(node)
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
    case 'if':
      return this.generateIf(node)
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
    case 'module':
      return this.generateModule(node)
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
    case 'shorthand_access_identifier':
      return this.generateShorthandAccessIdentifier(node)
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
    case 'when_clause':
      return this.generateWhenClause(node)
    case 'when_clauses':
      return this.generateWhenClauses(node)
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

  generateAccess = (node: Parser.SyntaxNode): string => {
    const left = this.generate(node.namedChild(0))
    const right = this.generate(node.namedChild(1))

    return `${left}[${right}]`
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

    return `(()=>{const match=new stdlib.PatternMatch({defaults:${defaults}})` +
           `.perform(${pattern},${right});[${identifiers.join(',')}]=match;` +
           'return match})()'
  }

  generateBlock = (node: Parser.SyntaxNode): string => {
    const isDeclaration = this.declarationBlock
    if (isDeclaration)
      this.declarationBlock = false

    const expressions = node.namedChildren
      .map(expression => this.generate(expression))
    const declarations = this.getScope.perform(node).join(',')
    const returnValue = isDeclaration ? `{${declarations}}` : expressions.pop()

    return `(()=>{${declarations ? 'let ' : ''}${declarations};` +
           `${expressions.join(';')};return ${returnValue}})()`
  }

  generateBoolean = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generateCase = (node: Parser.SyntaxNode): string => {
    const value = this.generate(node.namedChild(0))
    const branches = this.generate(node.namedChild(1))
    if (node.namedChildCount == 2)
      return `(()=>{switch(${value}){${branches}}})()`

    const defaultValue = this.generate(node.namedChild(2))
    return `(()=>{switch(${value}){${branches};` +
           `default:return ${defaultValue}}})()`
  }

  generateComment = (node: Parser.SyntaxNode): string => {
    return ''
  }

  generateElseIfClause = (node: Parser.SyntaxNode): string => {
    const condition = this.generate(node.namedChild(0))
    const consequence = this.generate(node.namedChild(1))

    return `else if(${condition}){return ${consequence}}`
  }

  generateElseIfClauses = (node: Parser.SyntaxNode): string => {
    const clauses = node.namedChildren
      .map(clause => this.generate(clause))
      .join('')

    return clauses
  }

  generateExport = (node: Parser.SyntaxNode): string => {
    const declaration = this.generate(node.namedChild(0))

    return `export ${declaration}`
  }

  generateExpressionList = (node: Parser.SyntaxNode): string => {
    const expressions = node.namedChildren
      .map(expression => `case ${this.generate(expression)}:`)
      .join('')

    return expressions
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
    return this.transformIdentifier.perform(node.text)
  }

  generateIdentifierPattern = (node: Parser.SyntaxNode): string => {
    const name = this.transformIdentifier.perform(node.text)

    return `"${INTERNAL_TEMP_TOKEN}${name}"`
  }

  generateIf = (node: Parser.SyntaxNode): string => {
    const condition = this.generate(node.namedChild(0))
    const consequence = this.generate(node.namedChild(1))
    if (node.namedChildCount == 2)
      return `(()=>{if(${condition}){return ${consequence}}})()`

    if (node.namedChild(node.namedChildCount - 1).type === 'else_if_clauses') {
      const clauses = this.generate(node.namedChild(2))

      return `(()=>{if(${condition}){return ${consequence}}${clauses}})()`
    } else if (node.namedChildCount == 3) {
      const alternative = this.generate(node.namedChild(2))

      return `(()=>{if(${condition}){return ${consequence}}` +
             `else{return ${alternative}}})()`
    } else if (node.namedChildCount == 4) {
      const clauses = this.generate(node.namedChild(2))
      const alternative = this.generate(node.namedChild(3))

      return `(()=>{if(${condition}){return ${consequence}}${clauses}` +
             `else{return ${alternative}}})()`
    }
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
    return this.transformIdentifier.perform(node.text)
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

  generateModule = (node: Parser.SyntaxNode): string => {
    const name = this.generate(node.namedChild(0))
    this.declarationBlock = true
    const body = this.generate(node.namedChild(1))

    return `(()=>{${name}=${body};return ${name}})()`
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
    const declarations = this.getScope.perform(node).join(',')

    return `${DEFAULT_IMPORTS};${declarations ? 'let ' : ''}${declarations}` +
           `;${expressions}`
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

  generateShorthandAccessIdentifier = (node: Parser.SyntaxNode): string => {
    const name = this.transformIdentifier.perform(node.text)

    return `'${name}'`
  }

  generateShorthandPairIdentifier = (node: Parser.SyntaxNode): string => {
    return this.transformIdentifier.perform(node.text)
  }

  generateShorthandPairIdentifierPattern = (
    node: Parser.SyntaxNode
  ): string => {
    const identifierPattern = this.generate(node.namedChild(0))

    return `"${identifierPattern.substring(INTERNAL_TEMP_TOKEN.length + 1)}` +
           `:${identifierPattern}`
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

  generateWhenClause = (node: Parser.SyntaxNode): string => {
    const values = this.generate(node.namedChild(0))
    const consequence = this.generate(node.namedChild(1))

    return `${values}return ${consequence}`
  }

  generateWhenClauses = (node: Parser.SyntaxNode): string => {
    const clauses = node.namedChildren
      .map(clause => this.generate(clause))
      .join(';')

    return clauses
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
