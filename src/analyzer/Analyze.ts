import Parser from 'tree-sitter'

import { ErrorHandler } from '../ErrorHandler'

import { GetImport } from './GetImport'
import { SymbolTable, Scope } from './SymbolTable'
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
    case 'assignment':
      return this.generateAssignment(node)
    case 'export':
      return this.generateExport(node)
    case 'identifier':
      return this.generateIdentifier(node)
    case 'number':
      return this.generateNumber(node)
    // case 'parameters':
    //   return this.generateParameters(node)
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

    if (!abstractionBranchTypes.every(abstractionBranchType => abstractionBranchType == abstractionType))
      this.errorHandler.throw('Abstraction branches have varying types', node)

    return abstractionType
  }

  private generateAbstractionBranch = (node: Parser.SyntaxNode): TypeConstructor => {
    this.currentScope = this.currentScope.createScope(node)
    const parameterTypes = this.generate(node.namedChild(0))
    const bodyType = this.generate(node.namedChild(1))

    this.currentScope = this.currentScope.parentScope
    return [...parameterTypes, bodyType]
  }

  private generateApplication = (node: Parser.SyntaxNode): TypeConstructor => {
    const abstractionType = this.generate(node.namedChild(0))
    const argTypes = this.generate(node.namedChild(1))

    if (abstractionType[0] === VOID_TYPE) abstractionType.pop()
    if (abstractionType.length <= argTypes.length)
      this.errorHandler.throw('Too many arguments applied to abstraction', node)
    argTypes.forEach((argType, i) => {
      if (argType != abstractionType[i])
        this.errorHandler.throw('Argument type mismatch', node)
    })

    return abstractionType.slice(argTypes.length)
  }

  private generateAssignment = (
    node: Parser.SyntaxNode,
    isExported = false
  ): TypeConstructor => {
    const pattern = node.namedChild(0)
    const type = node.namedChild(1)
    const expression = node.namedChild(2)

    this.generate(type)
    this.generate(expression)

    const bindings = this.currentScope.buildBindings(pattern, type, isExported)
    const matchingBinding = bindings
      .map(binding => this.currentScope.resolveBinding(binding.name))
      .find(binding => binding !== null)
    if (matchingBinding)
      this.errorHandler.throw(
        `A binding with name '${matchingBinding.name}' already exists`,
        node
      )
    this.currentScope.addBindings(bindings)

    const typeArgs = bindings.map(binding => binding.type)
    return [constructGenericType(TUPLE_TYPE, typeArgs)]
  }

  private generateExport = (node: Parser.SyntaxNode): TypeConstructor => {
    const assignment = node.namedChild(0)

    this.generateAssignment(assignment, true)

    return
  }

  private generateIdentifier = (node: Parser.SyntaxNode): TypeConstructor => {
    const name = node.text

    const binding = this.currentScope.resolveBinding(name)
    if (binding) return binding.type
    else
      this.errorHandler.throw(`Could not find '${name}' in current scope`, node)
  }

  private generateNumber = (node: Parser.SyntaxNode): TypeConstructor =>
    [NUMBER_TYPE]

  // private generateParameters = (node: Parser.SyntaxNode): TypeConstructor => {
  // }

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
      if (type != [STRING_TYPE])
        this.errorHandler.throw(
          `String interpolation must return String, instead returned ${type}`,
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
