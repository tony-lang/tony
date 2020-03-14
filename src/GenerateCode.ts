import path from 'path'
import Parser from 'tree-sitter'

import { getOutputPathForFile } from './utilities'
import {
  FILE_EXTENSION,
  TARGET_FILE_EXTENSION,
  KEYWORD_IDENTIFIERS,
  DEFAULT_IMPORTS
} from './constants'

export default class GenerateCode {
  file: string
  private files: string[]
  // private identifiers: string[] = []
  private outputPath: string
  // private standardizeApartIdentifiers = true

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
    case 'identifier':
      return this.generateIdentifier(node)
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
    case 'map':
      return this.generateMap(node)
    case 'number':
      return this.generateNumber(node)
    case 'parameter':
      return this.generateParameter(node)
    case 'parameters':
      return this.generateParameters(node)
    case 'pipeline':
      return this.generatePipeline(node)
    case 'prefix_application':
      return this.generatePrefixApplication(node)
    case 'program':
      return this.generateProgram(node)
    case 'range':
      return this.generateRange(node)
    case 'regex':
      return this.generateRegex(node)
    case 'return':
      return this.generateReturn(node)
    case 'shorthand_pair_identifier':
      return this.generateShorthandPairIdentifier(node)
    case 'spread':
      return this.generateSpread(node)
    case 'string':
      return this.generateString(node)
    case 'tuple':
      return this.generateTuple(node)
    default:
      console.log(`Could not find generator for AST node '${node.type}'.`)
      process.exit(1)
    }
  }

  generateAbstraction = (node: Parser.SyntaxNode): string => {
    const body = node.namedChildren
      .map(element => this.generate(element))
      .join('')

    return `stdlib.curry((...args)=>stdlib.match(args)${body}.else((...args)` +
           '=>{throw(\'Pattern matching non-exhaustive!\')}))'
  }

  generateAbstractionBranch = (node: Parser.SyntaxNode): string => {
    const parameters = this.generate(node.namedChild(0))
    const body = this.generate(node.namedChild(1))

    return `.case(${parameters}=>${body})`
  }

  generateApplication = (node: Parser.SyntaxNode): string => {
    const abstraction = this.generate(node.namedChild(0))
    const args = this.generate(node.namedChild(1))

    return `${abstraction}(${args})`
  }

  generateArgument = (node: Parser.SyntaxNode): string => {
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

    return `const ${left}=${right}`
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

  generateIdentifier = (node: Parser.SyntaxNode): string => {
    return this.getIdentifier(node.text)
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
    // this.standardizeApartIdentifiers = false
    const left = this.generate(node.namedChild(0))
    // this.standardizeApartIdentifiers = true
    const right = this.generate(node.namedChild(1))

    return `${left} as ${right}`
  }

  generateInfixApplication = (node: Parser.SyntaxNode): string => {
    const abstraction = this.generate(
      node.child(1).text === '`' ? node.child(2) : node.child(1)
    )
    const left = this.generate(node.namedChild(0))
    const right = this.generate(node.namedChild(1))

    return `${abstraction}(${left}, ${right})`
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

  generateMap = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map(element => this.generate(element))
      .join(',')

    return `{${elements}}`
  }

  generateNumber = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generateParameter = (node: Parser.SyntaxNode): string => {
    if (!GenerateCode.nodeHasChild(node, 'identifier'))
      return `L${this.generate(node.namedChild(0))}`

    const name = this.generate(node.namedChild(0))
    if (!GenerateCode.nodeHasChild(node, '=')) return name

    const value = this.generate(node.namedChild(1))
    return `${name}=${value}`
  }

  generateParameters = (node: Parser.SyntaxNode): string => {
    const rawParameters = node.namedChildren
      .map(parameter => this.generate(parameter))
    const parameters = rawParameters
      .map(parameter => {
        switch (parameter[0]) {
        case 'L': return '_'
        default: return parameter
        }
      })
      .join(',')
    const pattern = rawParameters
      .map((parameter, i) => {
        switch (parameter[0]) {
        case 'L': return parameter.substring(1)
        default: return `args[${i}]`
        }
      })
      .join(',')

    return `[${pattern}],(${parameters})`
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

  generateRange = (node: Parser.SyntaxNode): string => {
    const start = this.generate(node.namedChild(0))
    const end = this.generate(node.namedChild(1))

    return `stdlib.range(${start},${end})`
  }

  generateRegex = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generateReturn = (node: Parser.SyntaxNode): string => {
    if (node.namedChildCount == 0) return 'return'

    const value = this.generate(node.namedChild(0))
    return `return ${value}`
  }

  generateShorthandPairIdentifier = (node: Parser.SyntaxNode): string => {
    return this.getIdentifier(node.text)
  }

  generateSpread = (node: Parser.SyntaxNode): string => {
    const expression = this.generate(node.namedChild(0))

    return `...${expression}`
  }

  generateString = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generateTuple = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map(element => this.generate(element))
      .join(',')

    return `[${elements}]`
  }

  private getIdentifier = (identifier: string): string => {
    return identifier

    // if (!this.standardizeApartIdentifiers) return identifier
    // if (KEYWORD_IDENTIFIERS.includes(identifier)) return identifier

    // const index = this.identifiers.indexOf(identifier)
    // if (index != -1) return `i${index}`

    // const length = this.identifiers.push(identifier)
    // return `i${length - 1}`
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

  static nodeHasChild = (node: Parser.SyntaxNode, type: string): boolean => {
    return node.children.map(child => child.type).includes(type)
  }
}
