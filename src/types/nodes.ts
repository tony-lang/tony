import {
  AbstractionBranchNode,
  AbstractionNode,
  AccessNode,
  AccessTypeNode,
  ApplicationNode,
  ArgumentNode,
  AssignmentNode,
  BlockNode,
  BooleanNode,
  CaseNode,
  ConditionalTypeNode,
  CurriedTypeNode,
  DestructuringPatternNode,
  ElseIfNode,
  EnumNode,
  EnumValueNode,
  ErrorNode,
  ExportedImportNode,
  ExportNode,
  GeneratorNode,
  GroupNode,
  IdentifierNode,
  IdentifierPatternNode,
  IfNode,
  ImplementNode,
  ImportIdentifierNode,
  ImportNode,
  ImportTypeNode,
  InfixApplicationNode,
  InterfaceMemberNode,
  InterfaceNode,
  InterpolationNode,
  IntersectionTypeNode,
  LeftSectionNode,
  ListComprehensionNode,
  ListNode,
  ListPatternNode,
  ListTypeNode,
  MapTypeNode,
  MemberNode,
  MemberPatternNode,
  MemberTypeNode,
  NumberNode,
  ParametricTypeNode,
  PatternGroupNode,
  PipelineNode,
  PrefixApplicationNode,
  ProgramNode,
  RawStringNode,
  RefinementTypeDeclarationNode,
  RefinementTypeNode,
  RegexNode,
  ReturnNode,
  RightSectionNode,
  ShorthandAccessIdentifierNode,
  ShorthandMemberIdentifierNode,
  ShorthandMemberNode,
  ShorthandMemberPatternNode,
  SpreadNode,
  StringNode,
  StructNode,
  StructPatternNode,
  StructTypeNode,
  SubtractionTypeNode,
  SyntaxNode,
  SyntaxType,
  TaggedPatternNode,
  TaggedTypeNode,
  TaggedValueNode,
  TupleNode,
  TuplePatternNode,
  TupleTypeNode,
  TypeAliasNode,
  TypeDeclarationNode,
  TypeGroupNode,
  TypeHintNode,
  TypeNode,
  TypeofNode,
  TypeVariableDeclarationNode,
  TypeVariableNode,
  UnionTypeNode,
  WhenNode,
} from 'tree-sitter-tony'

// ---- Types ----

export type LiteralNode = BooleanNode | NumberNode | RawStringNode | RegexNode

export type TermLevelNode =
  | LiteralNode
  | AbstractionNode
  | AbstractionBranchNode
  | AccessNode
  | ApplicationNode
  | ArgumentNode
  | AssignmentNode
  | BlockNode
  | CaseNode
  | ElseIfNode
  | EnumNode
  | EnumValueNode
  | ExportNode
  | GeneratorNode
  | GroupNode
  | IdentifierNode
  | IfNode
  | ImplementNode
  | InfixApplicationNode
  | InterfaceMemberNode
  | InterfaceNode
  | InterpolationNode
  | LeftSectionNode
  | ListNode
  | ListComprehensionNode
  | MemberNode
  | PipelineNode
  | PrefixApplicationNode
  | ProgramNode
  | ReturnNode
  | RightSectionNode
  | ShorthandAccessIdentifierNode
  | ShorthandMemberIdentifierNode
  | ShorthandMemberNode
  | SpreadNode
  | StringNode
  | StructNode
  | TaggedValueNode
  | TupleNode
  | TypeAliasNode
  | TypeHintNode
  | WhenNode

export type PatternLevelNode =
  | LiteralNode
  | DestructuringPatternNode
  | IdentifierPatternNode
  | ListPatternNode
  | MemberPatternNode
  | PatternGroupNode
  | ShorthandMemberPatternNode
  | StructPatternNode
  | TaggedPatternNode
  | TuplePatternNode

type TypeLevelNode =
  | AccessTypeNode
  | ConditionalTypeNode
  | CurriedTypeNode
  | IntersectionTypeNode
  | ListTypeNode
  | MapTypeNode
  | MemberTypeNode
  | ParametricTypeNode
  | RefinementTypeNode
  | RefinementTypeDeclarationNode
  | StructTypeNode
  | SubtractionTypeNode
  | TaggedTypeNode
  | TupleTypeNode
  | TypeDeclarationNode
  | TypeGroupNode
  | TypeVariableNode
  | TypeVariableDeclarationNode
  | TypeofNode
  | UnionTypeNode
  | TypeNode

export type ImportLevelNode =
  | ExportedImportNode
  | ImportNode
  | ImportIdentifierNode
  | ImportTypeNode

export type NonTypeLevelNode = TermLevelNode | PatternLevelNode | ErrorNode

export type NodeWithinProgram = TermLevelNode | PatternLevelNode | TypeLevelNode

// ---- Factories ----

export const isNodeWithinProgram = (node: SyntaxNode): node is NodeWithinProgram => {
  if (!node.isNamed) return false

  switch (node.type) {
    case SyntaxType.Boolean:
    case SyntaxType.Number:
    case SyntaxType.RawString:
    case SyntaxType.Regex:

    case SyntaxType.Abstraction:
    case SyntaxType.AbstractionBranch:
    case SyntaxType.Access:
    case SyntaxType.Application:
    case SyntaxType.Argument:
    case SyntaxType.Assignment:
    case SyntaxType.Block:
    case SyntaxType.Case:
    case SyntaxType.ElseIf:
    case SyntaxType.Enum:
    case SyntaxType.EnumValue:
    case SyntaxType.Export:
    case SyntaxType.Generator:
    case SyntaxType.Group:
    case SyntaxType.Identifier:
    case SyntaxType.If:
    case SyntaxType.Implement:
    case SyntaxType.InfixApplication:
    case SyntaxType.InterfaceMember:
    case SyntaxType.Interface:
    case SyntaxType.Interpolation:
    case SyntaxType.LeftSection:
    case SyntaxType.List:
    case SyntaxType.ListComprehension:
    case SyntaxType.Member:
    case SyntaxType.Pipeline:
    case SyntaxType.PrefixApplication:
    case SyntaxType.Program:
    case SyntaxType.Return:
    case SyntaxType.RightSection:
    case SyntaxType.ShorthandAccessIdentifier:
    case SyntaxType.ShorthandMemberIdentifier:
    case SyntaxType.ShorthandMember:
    case SyntaxType.Spread:
    case SyntaxType.String:
    case SyntaxType.Struct:
    case SyntaxType.TaggedValue:
    case SyntaxType.Tuple:
    case SyntaxType.TypeAlias:
    case SyntaxType.TypeHint:
    case SyntaxType.When:

    case SyntaxType.DestructuringPattern:
    case SyntaxType.IdentifierPattern:
    case SyntaxType.ListPattern:
    case SyntaxType.MemberPattern:
    case SyntaxType.PatternGroup:
    case SyntaxType.ShorthandMemberPattern:
    case SyntaxType.StructPattern:
    case SyntaxType.TaggedPattern:
    case SyntaxType.TuplePattern:

    case SyntaxType.AccessType:
    case SyntaxType.ConditionalType:
    case SyntaxType.CurriedType:
    case SyntaxType.IntersectionType:
    case SyntaxType.ListType:
    case SyntaxType.MapType:
    case SyntaxType.MemberType:
    case SyntaxType.ParametricType:
    case SyntaxType.RefinementType:
    case SyntaxType.RefinementTypeDeclaration:
    case SyntaxType.StructType:
    case SyntaxType.SubtractionType:
    case SyntaxType.TaggedType:
    case SyntaxType.TupleType:
    case SyntaxType.TypeDeclaration:
    case SyntaxType.TypeGroup:
    case SyntaxType.TypeVariable:
    case SyntaxType.TypeVariableDeclaration:
    case SyntaxType.Typeof:
    case SyntaxType.UnionType:
    case SyntaxType.Type:
      return true
  }

  return false
}
