import { BuildType, TypeConstraint, TypeEqualityGraph } from '../../types'
import {
  FileModuleScope,
  IdentifierBinding,
  IdentifierBindingTemplate,
} from '../../symbol_table'
import {
  IdentifierImport,
  ModuleBinding,
  ModuleImport,
} from '../../symbol_table'
import {
  InvalidExternalTypeImportError,
  MissingBindingError,
  assert,
} from '../../errors'
import Parser from 'tree-sitter'
import { isNotUndefined } from '../../utilities'

export class InferImportBindingTypes {
  private _typeEqualityGraph: TypeEqualityGraph
  private _fileScopes: FileModuleScope[]
  private _scope: FileModuleScope

  constructor(
    scope: FileModuleScope,
    fileScopes: FileModuleScope[],
    typeEqualityGraph: TypeEqualityGraph,
  ) {
    this._typeEqualityGraph = typeEqualityGraph
    this._fileScopes = fileScopes
    this._scope = scope
  }

  perform = (node: Parser.SyntaxNode): void => {
    assert(node.type === 'import', 'Should be import node.')

    this.traverse(node)
  }

  private traverse = (node: Parser.SyntaxNode): void => {
    switch (node.type) {
      case 'identifier_pattern':
        return this.handleIdentifier(node)
      case 'import_clause_identifier_pair':
        return this.handleIdentifier(node)
      case 'import_clause_type_pair':
        return this.handleType(node)
      case 'type':
        return this.handleType(node)
      default:
        return node.namedChildren.forEach(this.traverse)
    }
  }

  private handleIdentifier = (node: Parser.SyntaxNode): void => {
    const imp = this._scope.imports.find((imp) => imp.node === node)
    assert(imp instanceof IdentifierImport, 'Should be an identifier import.')

    const fileScope = this._fileScopes.find(
      (fileScope) => fileScope.filePath === imp.filePath,
    )

    if (fileScope) this.handleInternalIdentifierImport(node, imp, fileScope)
    else this.handleExternalIdentifierImport(node, imp)
  }

  // eslint-disable-next-line max-lines-per-function
  private handleInternalIdentifierImport = (
    node: Parser.SyntaxNode,
    imp: IdentifierImport,
    fileScope: FileModuleScope,
  ): void => {
    const bindings = fileScope
      .resolveBindings(imp.name)
      .map((binding) => {
        assert(
          binding instanceof IdentifierBinding,
          'Should be an identifier binding.',
        )

        const typeConstraint = new TypeConstraint(
          imp.type,
          this._typeEqualityGraph,
        ).unify(binding.typeConstraint)
        if (typeConstraint === undefined) return

        return new IdentifierBinding(
          node,
          imp.alias,
          IdentifierBindingTemplate.getTransformedName(),
          typeConstraint,
          {
            isImplicit: true,
            importInformation: {
              filePath: imp.filePath,
              transformedImportName: binding.transformedName,
            },
          },
        )
      })
      .filter(isNotUndefined)

    if (bindings.length > 0)
      bindings.forEach((binding) => this._scope.addBinding(binding))
    else throw new MissingBindingError(name)
  }

  private handleExternalIdentifierImport = (
    node: Parser.SyntaxNode,
    imp: IdentifierImport,
  ): void => {
    this._scope.addBinding(
      new IdentifierBinding(
        node,
        imp.alias,
        IdentifierBindingTemplate.getTransformedName(),
        new TypeConstraint(imp.type),
        {
          isImplicit: true,
          importInformation: {
            filePath: imp.filePath,
            transformedImportName: imp.name,
          },
        },
      ),
    )
  }

  private handleType = (node: Parser.SyntaxNode): void => {
    const name = new BuildType().perform(node).name
    const imp = this._scope.imports.find((imp) => imp.node === node)
    assert(imp instanceof ModuleImport, 'Should be a module import.')

    const fileScope = this._fileScopes.find(
      (fileScope) => fileScope.filePath === imp.filePath,
    )

    if (fileScope) this.handleInternalTypeImport(node, imp, fileScope)
    else throw new InvalidExternalTypeImportError(name)
  }

  private handleInternalTypeImport = (
    node: Parser.SyntaxNode,
    imp: ModuleImport,
    fileScope: FileModuleScope,
  ): void => {
    const bindings = fileScope.resolveBindings(imp.name).map((binding) => {
      assert(binding instanceof ModuleBinding, 'Should be a module binding.')

      return new ModuleBinding(node, imp.aliasType, binding.type, {
        importInformation: {
          filePath: imp.filePath,
          transformedImportName: binding.transformedName,
        },
      })
    })

    if (bindings.length > 0)
      bindings.forEach((binding) => this._scope.addBinding(binding))
    else throw new MissingBindingError(name)
  }
}
