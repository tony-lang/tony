import * as Declaration from 'tree-sitter-tony/dtn'
import * as Source from 'tree-sitter-tony/tony'
import {
  DeclarationDependency,
  Dependency,
  SourceDependency,
} from './dependencies'
import {
  DeclaredTermBinding,
  ImportedTermBinding,
  LocalTermBinding,
  TermBinding,
  TypeAssignment,
  TypeBinding,
  TypeVariableBinding,
} from './bindings'
import { ErrorAnnotation, MountedErrorAnnotation } from '../errors/annotations'
import { NodeWithInferrableType, TermLevelNode } from '../nodes'
import { AbsolutePath } from '../path'
import { TypedNode } from '../type_inference/nodes'

// ---- Types ----

export type NestingNode =
  | Source.AbstractionBranchNode
  | Source.BlockNode
  | Source.ClassNode
  | Source.ListComprehensionNode
  | Source.RefinementTypeNode
  | Source.TypeAliasNode
  | Source.WhenNode

export type NestingTermLevelNode = NestingNode & TermLevelNode

enum ScopeKind {
  Global,
  File,
  Nested,
  RefinementType,
}

export type ScopeWithTerms<T extends TermBinding = TermBinding> = {
  readonly terms: T[]
}

export type TypingEnvironment = {
  readonly typeAssignments: TypeAssignment[]
}

export type ScopeWithTypes = {
  readonly types: TypeBinding[]
  readonly typeVariables: TypeVariableBinding[]
}

export type ScopeWithErrors = {
  readonly errors: MountedErrorAnnotation[]
}

export type ScopeWithNode<
  T extends Declaration.SyntaxNode | Source.SyntaxNode,
> = {
  readonly node: T
}

export type TypedScope<T extends NodeWithInferrableType> = {
  readonly typedNode: TypedNode<T>
}

export type RecursiveScope<T> = {
  readonly scopes: T[]
}

export interface RecursiveScopeWithErrors
  extends RecursiveScope<RecursiveScopeWithErrors>,
    ScopeWithErrors {}

export type GlobalScope<
  T extends FileScope | TypedFileScope = FileScope | TypedFileScope,
> = RecursiveScope<T> & {
  readonly kind: typeof ScopeKind.Global
  readonly errors: ErrorAnnotation[]
}

type AbstractFileScope = ScopeWithTypes & ScopeWithErrors
export type DeclarationFileScope = AbstractFileScope &
  ScopeWithTerms<DeclaredTermBinding> &
  ScopeWithNode<Declaration.ProgramNode> & {
    readonly kind: typeof ScopeKind.File
    readonly dependency: DeclarationDependency
    readonly source: AbsolutePath
    readonly dependencies: Dependency[]
  }
export type SourceFileScope<T extends NestingNode = NestingNode> =
  AbstractFileScope &
    RecursiveScope<NestedScope<T>> &
    ScopeWithTerms<ImportedTermBinding | LocalTermBinding> &
    ScopeWithNode<Source.ProgramNode> & {
      readonly kind: typeof ScopeKind.File
      readonly dependency: SourceDependency
      readonly dependencies: Dependency[]
    }
export type FileScope<T extends NestingNode = NestingNode> =
  | DeclarationFileScope
  | SourceFileScope<T>

export type TypedDeclarationFileScope = DeclarationFileScope &
  TypedScope<Declaration.ProgramNode> &
  TypingEnvironment
export type TypedSourceFileScope = SourceFileScope &
  RecursiveScope<TypedNestedScope> &
  TypedScope<Source.ProgramNode> &
  TypingEnvironment
export type TypedFileScope = TypedDeclarationFileScope | TypedSourceFileScope

export interface NestedScope<T extends NestingNode = NestingNode>
  extends RecursiveScope<NestedScope<T>>,
    ScopeWithTerms<ImportedTermBinding | LocalTermBinding>,
    ScopeWithTypes,
    ScopeWithErrors,
    ScopeWithNode<T> {
  readonly kind: typeof ScopeKind.Nested
}

export interface TypedNestedScope<
  T extends NestingTermLevelNode = NestingTermLevelNode,
> extends NestedScope<T>,
    TypingEnvironment,
    TypedScope<T> {
  readonly scopes: TypedNestedScope<T>[]
}

// ---- Factories ----

export const buildGlobalScope = <T extends FileScope | TypedFileScope>(
  scopes: T[],
  errors: ErrorAnnotation[] = [],
): GlobalScope<T> => ({
  kind: ScopeKind.Global,
  scopes,
  errors,
})

export const buildDeclarationFileScope = (
  dependency: DeclarationDependency,
  source: AbsolutePath,
  node: Declaration.ProgramNode,
): DeclarationFileScope => ({
  kind: ScopeKind.File,
  dependency,
  source,
  node,
  dependencies: [],
  terms: [],
  types: [],
  typeVariables: [],
  errors: [],
})

export const buildSourceFileScope = <
  T extends NestingNode | never = NestingNode,
>(
  dependency: SourceDependency,
  node: Source.ProgramNode,
): SourceFileScope<T> => ({
  kind: ScopeKind.File,
  dependency,
  node,
  scopes: [],
  dependencies: [],
  terms: [],
  types: [],
  typeVariables: [],
  errors: [],
})

export const buildTypedDeclarationFileScope = (
  fileScope: DeclarationFileScope,
  typedNode: TypedNode<Declaration.ProgramNode>,
  typeAssignments: TypeAssignment[],
): TypedDeclarationFileScope => ({
  ...fileScope,
  typedNode,
  typeAssignments,
})

export const buildTypedSourceFileScope = (
  fileScope: SourceFileScope,
  scopes: TypedNestedScope[],
  typedNode: TypedNode<Source.ProgramNode>,
  typeAssignments: TypeAssignment[],
): TypedSourceFileScope => ({
  ...fileScope,
  scopes,
  typedNode,
  typeAssignments,
})

export const buildNestedScope = (node: NestingNode): NestedScope => ({
  kind: ScopeKind.Nested,
  node,
  terms: [],
  types: [],
  typeVariables: [],
  scopes: [],
  errors: [],
})

export const buildTypedNestedScope = <T extends NestingTermLevelNode>(
  scope: NestedScope<T>,
  scopes: TypedNestedScope<T>[],
  typedNode: TypedNode<T>,
  typeAssignments: TypeAssignment[],
): TypedNestedScope<T> => ({
  ...scope,
  scopes,
  typedNode,
  typeAssignments,
})

export const isFileScope = <T extends { kind: ScopeKind }>(
  scope: T,
): scope is T & FileScope => scope.kind === ScopeKind.File

export const isNestingNode = (node: Source.NamedNode): node is NestingNode => {
  switch (node.type) {
    case Source.SyntaxType.AbstractionBranch:
    case Source.SyntaxType.Block:
    case Source.SyntaxType.Class:
    case Source.SyntaxType.ListComprehension:
    case Source.SyntaxType.RefinementType:
    case Source.SyntaxType.TypeAlias:
    case Source.SyntaxType.When:
      return true
    default:
      return false
  }
}
