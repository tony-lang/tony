import Parser from 'tree-sitter'

import { PRIVATE_ACCESS_PREFIX } from '../constants'
import { ErrorHandler } from '../ErrorHandler'
import {
  ModuleType,
  TupleType,
  TypeConstructor,
  VOID_TYPE,
  VOID_TYPE_CONSTRUCTOR,
  NUMBER_TYPE_CONSTRUCTOR,
  STRING_TYPE_CONSTRUCTOR
} from '../types'

import { GetImport } from './GetImport'
import { InferAccessType } from './InferAccessType'
import { ParseType } from './ParseType'
import { PatternMatchType } from './PatternMatchType'
import { SymbolTable, Scope, Binding } from './SymbolTable'

export class Analyze {
  private currentScope: Scope
  private errorHandler: ErrorHandler
  private symbolTable: SymbolTable
  private getImport: GetImport

  private exportBindings = false

  constructor(file: string, outputPath: string) {
    this.errorHandler = new ErrorHandler(file)
    this.getImport = new GetImport(file, outputPath)
  }

  perform = (node: Parser.SyntaxNode): SymbolTable => {
    this.generate(node)
    return this.symbolTable
  }

  private generate = (node: Parser.SyntaxNode): TypeConstructor => {
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
    case 'comment':
      return this.generateComment(node)
    case 'export':
      return this.generateExport(node)
    case 'identifier':
      return this.generateIdentifier(node)
    case 'identifier_pattern':
      return this.generateIdentifierPattern(node)
    case 'interpolation':
      return this.generateInterpolation(node)
    case 'module':
      return this.generateModule(node)
    case 'number':
      return this.generateNumber(node)
    case 'parameters':
      return this.generateParameters(node)
    case 'pattern':
      return this.generatePattern(node)
    case 'program':
      return this.generateProgram(node)
    case 'shorthand_access_identifier':
      return this.generateShorthandAccessIdentifier(node)
    case 'string':
      return this.generateString(node)
    case 'type':
      return this.generateType(node)
    case 'type_constructor':
      return this.generateTypeConstructor(node)
    default:
      console.log(`Could not find generator for AST node '${node.type}'.`)
      process.exit(1)
    }
  }

  private generateAbstraction = (node: Parser.SyntaxNode): TypeConstructor => {
    const abstractionBranchTypes = node.namedChildren
      .map(child => this.generate(child))
    const abstractionType = abstractionBranchTypes[0]

    if (!abstractionBranchTypes.every(abstractionBranchType => {
      return abstractionBranchType.equals(abstractionType)
    })) this.errorHandler.throw('Abstraction branches have varying types', node)

    return abstractionType
  }

  private generateAbstractionBranch = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    this.currentScope = this.currentScope.createScope()
    const parameterTypes = this.generate(node.namedChild(0))
    const bodyType = this.generate(node.namedChild(1))

    this.currentScope = this.currentScope.parentScope
    return parameterTypes.concat(bodyType)
  }

  private generateAccess = (node: Parser.SyntaxNode): TypeConstructor => {
    const leftType = this.generate(node.namedChild(0))
    const rightType = this.generate(node.namedChild(1))

    return new InferAccessType(node, this.errorHandler)
      .perform(leftType, rightType)
  }

  private generateApplication = (node: Parser.SyntaxNode): TypeConstructor => {
    const abstractionType = this.generate(node.namedChild(0))
    const argTypes = this.generate(node.namedChild(1))

    if (abstractionType.types[0] === VOID_TYPE) abstractionType.pop()
    if (abstractionType.length <= argTypes.length)
      this.errorHandler.throw(
        `Expected at most ${abstractionType.length - 1} arguments, but ` +
        `applied ${argTypes.length} arguments`,
        node
      )
    argTypes.types.forEach((argType, i) => {
      if (!argType.equals(abstractionType.types[i]))
        this.errorHandler.throw(
          `Expected argument of type '${abstractionType.types[i].toString()}'` +
          `, but got '${argType.toString()}'`,
          node
        )
    })

    return abstractionType.apply(argTypes.length)
  }

  private generateArgument = (node: Parser.SyntaxNode): TypeConstructor => {
    if (node.namedChildCount == 0) {
      console.log('not implemented yet')
      process.exit(1)
    }

    return this.generate(node.namedChild(0))
  }

  private generateArguments = (node: Parser.SyntaxNode): TypeConstructor => {
    return node.namedChildren
      .map(argumentNode => this.generate(argumentNode))
      .reduce((argumentTypes, argumentType) => {
        return argumentTypes.concat(argumentType)
      })
  }

  private generateAssignment = (node: Parser.SyntaxNode): TypeConstructor => {
    // TODO: don't check types in pattern and instead use bindings returned by
    //       running PatternMatchType agains expressionType

    const pattern = node.namedChild(0)
    const patternType = this.generate(pattern)
    const isExported = this.exportBindings
    // required if it was previously set to true by the export generator
    this.exportBindings = false
    const expressionType = this.generate(node.namedChild(1))

    if (!patternType.equals(expressionType)) this.errorHandler.throw(
      `Pattern type '${patternType.toString()}' and expression type ` +
      `'${expressionType.toString()}' do not match`,
      node
    )

    const typeArgs = new PatternMatchType(isExported)
      .perform(pattern, expressionType)
      .map(binding => binding.type)
    return new TypeConstructor([new TupleType(typeArgs)])
  }

  private generateBlock = (node: Parser.SyntaxNode): TypeConstructor => {
    const expressionTypes = node.namedChildren
      .map(child => this.generate(child))

    return expressionTypes[expressionTypes.length - 1]
  }

  private generateComment = (node: Parser.SyntaxNode): TypeConstructor => {
    return
  }

  private generateExport = (node: Parser.SyntaxNode): TypeConstructor => {
    const declaration = node.namedChild(0)

    this.exportBindings = true
    this.generate(declaration)

    return
  }

  private generateIdentifier = (node: Parser.SyntaxNode): TypeConstructor => {
    const name = node.text

    const binding = this.currentScope.resolveBinding(name)
    if (binding) return binding.type
    else
      this.errorHandler.throw(`Could not find '${name}' in current scope`, node)
  }

  private generateIdentifierPattern = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    const name = node.namedChild(0).text
    const typeNode = node.namedChild(1)
    const type = ParseType.perform(typeNode)
    const isExported =
      this.exportBindings || this.currentScope.isNested() &&
      !name.startsWith(PRIVATE_ACCESS_PREFIX)

    this.generate(typeNode)

    const binding = new Binding(name, type, isExported)
    const matchingBinding = this.currentScope.resolveBinding(binding.name)
    if (matchingBinding)
      this.errorHandler.throw(
        `A binding with name '${matchingBinding.name}' already exists`,
        node
      )
    this.currentScope.addBinding(binding)

    return type
  }

  private generateInterpolation = (node: Parser.SyntaxNode): TypeConstructor =>
    this.generate(node.namedChild(0))

  private generateModule = (node: Parser.SyntaxNode): TypeConstructor => {
    const isExported = this.exportBindings
    // required if it was previously set to true by the export generator
    this.exportBindings = false

    const name = node.namedChild(0).text
    const body = node.namedChild(1)

    this.currentScope = this.currentScope.createScope()
    this.generate(body)
    const type = new TypeConstructor([
      new ModuleType(this.currentScope.getExportedBindingTypes())
    ])
    this.currentScope = this.currentScope.parentScope

    const binding = new Binding(name, type, isExported)
    const matchingBinding = this.currentScope.resolveBinding(binding.name)
    if (matchingBinding)
      this.errorHandler.throw(
        `A binding with name '${matchingBinding.name}' already exists`,
        node
      )
    this.currentScope.addBinding(binding)

    return type
  }

  private generateNumber = (node: Parser.SyntaxNode): TypeConstructor =>
    NUMBER_TYPE_CONSTRUCTOR

  private generateParameters = (node: Parser.SyntaxNode): TypeConstructor => {
    if (node.namedChildCount == 0) return VOID_TYPE_CONSTRUCTOR

    return node.namedChildren
      .map(parameterNode => this.generate(parameterNode))
      .reduce((parameterTypes, parameterType) => {
        return parameterTypes.concat(parameterType)
      })
  }

  private generatePattern = (node: Parser.SyntaxNode): TypeConstructor => {
    return this.generate(node.namedChild(0))
  }

  private generateProgram = (node: Parser.SyntaxNode): TypeConstructor => {
    this.symbolTable = new SymbolTable()
    this.currentScope = this.symbolTable

    node.namedChildren.map(child => this.generate(child))

    return
  }

  private generateShorthandAccessIdentifier = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    return STRING_TYPE_CONSTRUCTOR
  }

  private generateString = (node: Parser.SyntaxNode): TypeConstructor => {
    node.namedChildren.forEach(child => {
      if (child.type !== 'interpolation') return

      const type = this.generate(child)
      if (!type.equals(STRING_TYPE_CONSTRUCTOR))
        this.errorHandler.throw(
          'String interpolation must return \'String\', instead returned ' +
          `'${type.toString()}'`,
          child
        )
    })

    return STRING_TYPE_CONSTRUCTOR
  }

  private generateType = (node: Parser.SyntaxNode): TypeConstructor => {
    const name = node.text

    const binding = this.currentScope.resolveBinding(name)
    if (binding) return binding.type
    else this.errorHandler.throw(
      `Could not find type '${name}' in current scope`,
      node
    )
  }

  private generateTypeConstructor = (
    node: Parser.SyntaxNode
  ): TypeConstructor => {
    return node.namedChildren
      .map(childNode => this.generate(childNode))
      .reduce((childTypes, childType) => childTypes.concat(childType))
  }
}
