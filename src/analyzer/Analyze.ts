import deepEqual from 'deep-equal'
import Parser from 'tree-sitter'

import { ErrorHandler } from '../ErrorHandler'

import { GetImport } from './GetImport'
import { ParseType } from './ParseType'
import { PatternMatchType } from './PatternMatchType'
import { SymbolTable, Scope, Binding } from './SymbolTable'
import {
  TypeConstructor,
  constructGenericType,
  NUMBER_TYPE,
  STRING_TYPE,
  TUPLE_TYPE,
  VOID_TYPE
} from './types'

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
    case 'application':
      return this.generateApplication(node)
    case 'argument':
      return this.generateArgument(node)
    case 'arguments':
      return this.generateArguments(node)
    case 'assignment':
      return this.generateAssignment(node)
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

    if (!abstractionBranchTypes.every(abstractionBranchType => deepEqual(abstractionBranchType, abstractionType)))
      this.errorHandler.throw('Abstraction branches have varying types', node)

    return abstractionType
  }

  private generateAbstractionBranch = (node: Parser.SyntaxNode): TypeConstructor => {
    this.currentScope = this.currentScope.createScope()
    const parameterTypes = this.generate(node.namedChild(0))
    const bodyType = this.generate(node.namedChild(1))

    this.currentScope = this.currentScope.parentScope
    return [...parameterTypes, ...bodyType]
  }

  private generateApplication = (node: Parser.SyntaxNode): TypeConstructor => {
    const abstractionType = this.generate(node.namedChild(0))
    const argTypes = this.generate(node.namedChild(1))

    if (abstractionType[0] === VOID_TYPE) abstractionType.pop()
    if (abstractionType.length <= argTypes.length)
      this.errorHandler.throw('Too many arguments applied to abstraction', node)
    argTypes.forEach((argType, i) => {
      if (!deepEqual(argType, abstractionType.slice(i, i + 1)))
        this.errorHandler.throw('Argument type mismatch', node)
    })

    return abstractionType.slice(argTypes.length)
  }

  private generateArgument = (node: Parser.SyntaxNode): TypeConstructor => {
    if (node.namedChildCount == 0) {
      console.log('not implemented yet')
      process.exit(1)
    }

    return this.generate(node.namedChild(0))
  }

  private generateArguments = (node: Parser.SyntaxNode): TypeConstructor => {
    return node.namedChildren.map(argument => this.generate(argument))
  }

  private generateAssignment = (node: Parser.SyntaxNode): TypeConstructor => {
    // TODO: don't check types in pattern and instead use bindings returned by running PatternMatchType agains expressionType

    const pattern = node.namedChild(0)
    const patternType = this.generate(pattern)
    const isExported = this.exportBindings
    this.exportBindings = false // required if it was previously set to true by the export generator
    const expressionType = this.generate(node.namedChild(1))

    if (!deepEqual(patternType, expressionType)) this.errorHandler.throw(
      `Pattern type [${patternType}] and expression type [${expressionType}] do not match`,
      node
    )

    const typeArgs = new PatternMatchType(isExported)
      .perform(pattern, expressionType)
      .map(binding => binding.type)
    return [constructGenericType(TUPLE_TYPE, typeArgs)]
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

  private generateIdentifierPattern = (node: Parser.SyntaxNode): TypeConstructor => {
    const isExported = this.exportBindings

    const name = node.namedChild(0).text
    const typeNode = node.namedChild(1)
    const type = ParseType.perform(typeNode)

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

  private generateInterpolation = (node: Parser.SyntaxNode): TypeConstructor => {
    return this.generate(node.namedChild(0))
  }

  private generateModule = (node: Parser.SyntaxNode): TypeConstructor => {
    const isExported = this.exportBindings
    this.exportBindings = false // required if it was previously set to true by the export generator

    const name = node.namedChild(0).text
    const body = node.namedChild(1)

    this.generate(body)

    const binding = new Binding(name, null, isExported)
    const matchingBinding = this.currentScope.resolveBinding(binding.name)
    if (matchingBinding)
      this.errorHandler.throw(
        `A binding with name '${matchingBinding.name}' already exists`,
        node
      )
    this.currentScope.addBinding(binding)

    return [name]
  }

  private generateNumber = (node: Parser.SyntaxNode): TypeConstructor =>
    [NUMBER_TYPE]

  private generateParameters = (node: Parser.SyntaxNode): TypeConstructor => {
    if (node.namedChildCount == 0) return [VOID_TYPE]

    return node.namedChildren
      .reduce((acc, parameter) => acc.concat(this.generate(parameter)), [])
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

  private generateString = (node: Parser.SyntaxNode): TypeConstructor => {
    node.namedChildren.forEach(child => {
      if (child.type !== 'interpolation') return

      const type = this.generate(child)
      if (type[0] !== STRING_TYPE)
        this.errorHandler.throw(
          `String interpolation must return [String], instead returned [${type}]`,
          child
        )
    })

    return [STRING_TYPE]
  }

  private generateType = (node: Parser.SyntaxNode): TypeConstructor => {
    const name = node.text

    const binding = this.currentScope.resolveBinding(name)
    if (binding) return
    else this.errorHandler.throw(
      `Could not find type '${name}' in current scope`,
      node
    )
  }

  private generateTypeConstructor = (node: Parser.SyntaxNode): TypeConstructor => {
    node.namedChildren.map(child => this.generate(child))

    return
  }
}
