import {
  AbstractionBranchNode,
  AbstractionNode,
  AccessNode,
  ApplicationNode,
  ArgumentNode,
  AssignmentNode,
  BlockNode,
  BooleanNode,
  CaseNode,
  DestructuringPatternNode,
  ElseIfNode,
  EnumNode,
  EnumValueNode,
  ErrorNode,
  ExportNode,
  ExportedImportNode,
  GeneratorNode,
  GroupNode,
  IdentifierNode,
  IdentifierPatternNode,
  IfNode,
  ImportIdentifierNode,
  ImportNode,
  ImportTypeNode,
  InfixApplicationNode,
  InterfaceNode,
  InterpolationNode,
  LeftSectionNode,
  ListComprehensionNode,
  ListNode,
  ListPatternNode,
  MemberNode,
  MemberPatternNode,
  NumberNode,
  PatternGroupNode,
  PipelineNode,
  PrefixApplicationNode,
  ProgramNode,
  RawStringNode,
  RegexNode,
  RestNode,
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
  TaggedPatternNode,
  TaggedValueNode,
  TupleNode,
  TuplePatternNode,
  TypeAliasNode,
  TypeHintNode,
  WhenNode,
} from 'tree-sitter-tony'

export type LiteralNode = BooleanNode | NumberNode | RawStringNode | RegexNode

export type TermNode =
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
  | ExportedImportNode
  | GeneratorNode
  | GroupNode
  | IdentifierNode
  | IfNode
  | ImportNode
  | ImportIdentifierNode
  | ImportTypeNode
  | InfixApplicationNode
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

export type PatternNode =
  | LiteralNode
  | DestructuringPatternNode
  | IdentifierPatternNode
  | ListPatternNode
  | MemberPatternNode
  | PatternGroupNode
  | RestNode
  | ShorthandMemberPatternNode
  | StructPatternNode
  | TaggedPatternNode
  | TuplePatternNode

export type NonTypeNode = TermNode | PatternNode | ErrorNode
