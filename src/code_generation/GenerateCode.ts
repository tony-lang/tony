import Parser from 'tree-sitter'

import { SymbolTable, WalkSymbolTable } from '../analyzing'
import {
  DEFAULT_IMPORTS,
  TRANSFORM_PLACEHOLDER_ARGUMENT,
  TRANSFORM_REST_PATTERN
} from '../constants'
import { assert, InternalError } from '../errors'

import { CollectDefaultValues } from './CollectDefaultValues'
import { ParseStringContent } from './ParseStringContent'
import { ResolvePattern } from './ResolvePattern'
import { TransformIdentifier } from './TransformIdentifier'

export const INTERNAL_TEMP_TOKEN = Object.freeze('#TONY_INTERNAL_TEMP')

export class GenerateCode {
  private declarationBlock = false
  private listComprehensionGeneratorCountStack: any[] = []

  private transformIdentifier: TransformIdentifier
  private walkSymbolTable: WalkSymbolTable

  constructor(symbolTable: SymbolTable) {
    this.transformIdentifier = new TransformIdentifier
    this.walkSymbolTable = new WalkSymbolTable(symbolTable)
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
      return ''
    case 'else_if_clause':
      return this.generateElseIfClause(node)
    case 'else_if_clauses':
      return this.generateElseIfClauses(node)
    case 'export':
      return this.generateExport(node)
    case 'expression_pair':
      return this.generateExpressionPair(node)
    case 'external_import':
      return ''
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
    case 'identifier_pattern_name':
      return this.generateIdentifierPatternName(node)
    case 'if':
      return this.generateIf(node)
    case 'import':
      return ''
    case 'infix_application':
      return this.generateInfixApplication(node)
    case 'interpolation':
      return this.generateInterpolation(node)
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
    case 'pattern_list':
      return this.generatePatternList(node)
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
    case 'rest_tuple':
      return this.generateRestTuple(node)
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
    case 'type':
      return this.generateType(node)
    case 'when_clause':
      return this.generateWhenClause(node)
    case 'when_clauses':
      return this.generateWhenClauses(node)
    default:
      throw new InternalError(
        'GenerateCode: Could not find generator for AST node ' +
        `'${node.type}'.`
      )
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

    return `(()=>{const value=${right};[${identifiers.join(',')}]=new stdlib.` +
           `PatternMatch({defaults:${defaults},overmatching:true}).perform(` +
           `${pattern},value);return value})()`
  }

  generateBlock = (node: Parser.SyntaxNode): string => {
    this.walkSymbolTable.enterBlock()

    const isDeclaration = this.declarationBlock
    if (isDeclaration)
      this.declarationBlock = false

    const expressions = node.namedChildren
      .map(expression => this.generate(expression))

    const bindings = this.walkSymbolTable.currentScope.bindings
      .filter(binding => !binding.isImplicit)
    const declarations = bindings
      .map(binding => this.transformIdentifier.perform(binding.name))
    const combinedDeclarations =
      declarations.length > 0 ? `let ${declarations.join(',')}` : ''
    const returnedDeclarations = bindings
      .filter(binding => binding.isExported)
      .map(binding => this.transformIdentifier.perform(binding.name))
      .join(',')

    const returnValue =
      isDeclaration ? `{${returnedDeclarations}}` : expressions.pop()
    const explicitReturn =
      !isDeclaration && node.lastNamedChild.type === 'return' ? '' : 'return '

    this.walkSymbolTable.leaveBlock()
    return `(()=>{${combinedDeclarations};` +
           `${expressions.join(';')};${explicitReturn}${returnValue}})()`
  }

  generateBoolean = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generateCase = (node: Parser.SyntaxNode): string => {
    const value = this.generate(node.namedChild(0))
    const branches = this.generate(node.namedChild(1))
    if (node.namedChildCount == 2)
      return `stdlib.ResolveAbstractionBranch.perform(${value},[${branches}])`

    const defaultValue = this.generate(node.namedChild(2))
    return `stdlib.ResolveAbstractionBranch.perform(${value},[${branches}],` +
           `()=>${defaultValue},false)`
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

    return declaration
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
    return `${value}.map((${name})=>!${condition} ? "${INTERNAL_TEMP_TOKEN}" : `
  }

  generateGeneratorCondition = (node: Parser.SyntaxNode): string => {
    const expression = this.generate(node.namedChild(0))

    return expression
  }

  generateGenerators = (node: Parser.SyntaxNode): string => {
    const generators = node.namedChildren
      .map(generator => this.generate(generator))
      .join('')

    this.listComprehensionGeneratorCountStack.push(node.namedChildCount)
    return generators
  }

  generateIdentifier = (node: Parser.SyntaxNode): string => {
    return this.transformIdentifier.perform(node.text)
  }

  generateIdentifierPattern = (node: Parser.SyntaxNode): string => {
    return this.generate(node.namedChild(0))
  }

  generateIdentifierPatternName = (node: Parser.SyntaxNode): string => {
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

  generateInfixApplication = (node: Parser.SyntaxNode): string => {
    const abstraction = this.generate(node.namedChild(1))
    const left = this.generate(node.namedChild(0))
    const right = this.generate(node.namedChild(2))

    return `${abstraction}(${left},${right})`
  }

  generateInterpolation = (node: Parser.SyntaxNode): string => {
    return this.generate(node.namedChild(0))
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
    const generatorCount = this.listComprehensionGeneratorCountStack.pop()

    return `${generators}${body}${')'.repeat(generatorCount)}.flat(` +
           `${generatorCount - 1}).filter(e=>e!=="${INTERNAL_TEMP_TOKEN}")`
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

  generatePatternList = (node: Parser.SyntaxNode): string => {
    const patterns = node.namedChildren
      .map(pattern => this.generate(pattern))
      .join(';')

    return patterns
  }

  generatePatternPair = (node: Parser.SyntaxNode): string => {
    const left = this.generate(node.namedChild(0))
    const right = this.generate(node.namedChild(1))

    return `"[${left}]":${right}`
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

    const declarations = this.walkSymbolTable.currentScope.bindings
      .filter(binding => !binding.isImplicit)
      .map(binding => this.transformIdentifier.perform(binding.name))
    const combinedDeclarations =
      declarations.length > 0 ? `let ${declarations.join(',')}` : ''

    assert(
      this.walkSymbolTable.currentScope instanceof SymbolTable,
      'Symbol table walker should end up at symbol table scope.'
    )

    const imports = this.walkSymbolTable.currentScope.imports
      .map(imp => {
        const aliases = imp.bindings.map(binding => {
          const originalName = this.transformIdentifier
            .perform(binding.originalName)
          const name = this.transformIdentifier
            .perform(binding.name)

          return `${originalName} as ${name}${imp.isExternal ? 'EXT' : ''}`
        }).join(',')

        return `import {${aliases}} from '${imp.relativePath}'`
      }).join(';')
    const externalImports = this.walkSymbolTable.currentScope.imports
      .filter(imp => imp.isExternal)
      .reduce((bindings, imp) => {
        return bindings.concat(imp.bindings)
      }, [])
      .map(binding => {
        const tmpName = `${this.transformIdentifier.perform(binding.name)}EXT`
        const name = this.transformIdentifier
          .perform(binding.name)

        return `${name}=stdlib.Curry.external(${tmpName})`
      }).join(',')
    const combinedExternalImports = externalImports.length > 0 ?
      `const ${externalImports}` : ''


    const exports = this.walkSymbolTable.currentScope.bindings
      .filter(binding => binding.isExported)
      .map(binding => this.transformIdentifier.perform(binding.name))
    const combinedExports =
      exports.length > 0 ? `export {${exports.join(',')}}` : ''

    return `${DEFAULT_IMPORTS};${imports};${combinedExternalImports};` +
           `${combinedDeclarations};${expressions};${combinedExports}`
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

  generateRestTuple = (node: Parser.SyntaxNode): string => {
    const name = this.generate(node.namedChild(0)).slice(1, -1)

    return `"${INTERNAL_TEMP_TOKEN}${name}"`
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
    const interpolations = node.namedChildren
      .filter(child => child.type === 'interpolation')
      .map(child => this.generate(child))
    const content = ParseStringContent.perform(node.text)
      .replace(/(?<!\\){/g, '${')
      .replace(/(?<=\${).+?(?=})/g, () => interpolations.shift())

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

  generateType = (node: Parser.SyntaxNode): string => {
    const name = node.text

    return this.transformIdentifier.perform(name)
  }

  generateWhenClause = (node: Parser.SyntaxNode): string => {
    const patterns = this.generate(node.namedChild(0)).split(';')
      .map(pattern => ResolvePattern.perform(pattern))
    const body = this.generate(node.namedChild(1))
    const defaults = node.namedChild(0).namedChildren
      .map(pattern => new CollectDefaultValues(this).perform(pattern))

    return patterns.map(([pattern, identifiers], i) => {
      return `[${pattern},${defaults[i]},(match)=>{` +
             `const [${identifiers.join(',')}]=match;return ${body}}]`
    }).join(',')
  }

  generateWhenClauses = (node: Parser.SyntaxNode): string => {
    const clauses = node.namedChildren
      .map(clause => this.generate(clause))
      .join(',')

    return clauses
  }

  private static nodeHasChild = (
    node: Parser.SyntaxNode, type: string
  ): boolean => {
    return node.children.map(child => child.type).includes(type)
  }
}
