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
  ClassMemberNode,
  ClassNode,
  ConditionalTypeNode,
  CurriedTypeNode,
  DestructuringPatternNode,
  ElseIfNode,
  EnumNode,
  EnumValueNode,
  ErrorNode,
  ExportNode,
  GeneratorNode,
  GroupNode,
  IdentifierNode,
  IdentifierPatternNode,
  IfNode,
  InfixApplicationNode,
  InstanceNode,
  InterpolationNode,
  IntersectionTypeNode,
  KeyofNode,
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
  ProgramNode as SourceProgramNode,
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
  TypeVariableDeclarationNode,
  TypeVariableNode,
  TypeofNode,
  UnionTypeNode,
  WhenNode,
} from 'tree-sitter-tony/tony'
import { ProgramNode as DeclarationProgramNode } from 'tree-sitter-tony/dtn'

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
  | ClassMemberNode
  | ClassNode
  | ElseIfNode
  | EnumNode
  | EnumValueNode
  | ExportNode
  | GeneratorNode
  | GroupNode
  | IdentifierNode
  | IfNode
  | InfixApplicationNode
  | InstanceNode
  | InterpolationNode
  | LeftSectionNode
  | ListNode
  | ListComprehensionNode
  | MemberNode
  | PipelineNode
  | PrefixApplicationNode
  | SourceProgramNode
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
  | KeyofNode
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

export type DeclarationNodeWithInferrableType = DeclarationProgramNode
export type SourceNodeWithInferrableType =
  | TermLevelNode
  | PatternLevelNode
  | ErrorNode
export type NodeWithInferrableType =
  | DeclarationNodeWithInferrableType
  | SourceNodeWithInferrableType

export type NodeWithinProgram = TermLevelNode | PatternLevelNode | TypeLevelNode

// ---- Factories ----

export const isNodeWithinProgram = (
  node: SyntaxNode,
): node is NodeWithinProgram => {
  if (!node.isNamed) return false

  switch (node.type) {
    case SyntaxType.Boolean:
    case SyntaxType.Number:
    case SyntaxType.RawString:
    case SyntaxType.Regex:
    // falls through

    case SyntaxType.Abstraction:
    case SyntaxType.AbstractionBranch:
    case SyntaxType.Access:
    case SyntaxType.Application:
    case SyntaxType.Argument:
    case SyntaxType.Assignment:
    case SyntaxType.Block:
    case SyntaxType.Case:
    case SyntaxType.ClassMember:
    case SyntaxType.Class:
    case SyntaxType.ElseIf:
    case SyntaxType.Enum:
    case SyntaxType.EnumValue:
    case SyntaxType.Export:
    case SyntaxType.Generator:
    case SyntaxType.Group:
    case SyntaxType.Identifier:
    case SyntaxType.If:
    case SyntaxType.InfixApplication:
    case SyntaxType.Instance:
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
    // falls through

    case SyntaxType.DestructuringPattern:
    case SyntaxType.IdentifierPattern:
    case SyntaxType.ListPattern:
    case SyntaxType.MemberPattern:
    case SyntaxType.PatternGroup:
    case SyntaxType.ShorthandMemberPattern:
    case SyntaxType.StructPattern:
    case SyntaxType.TaggedPattern:
    case SyntaxType.TuplePattern:
    // falls through

    case SyntaxType.AccessType:
    case SyntaxType.ConditionalType:
    case SyntaxType.CurriedType:
    case SyntaxType.IntersectionType:
    case SyntaxType.Keyof:
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
