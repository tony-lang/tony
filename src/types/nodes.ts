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

export type TermNode =
  | AbstractionNode
  | AbstractionBranchNode
  | AccessNode
  | ApplicationNode
  | ArgumentNode
  | AssignmentNode
  | BlockNode
  | BooleanNode
  | CaseNode
  | DestructuringPatternNode
  | ElseIfNode
  | EnumNode
  | EnumValueNode
  | ExportNode
  | ExportedImportNode
  | GeneratorNode
  | GroupNode
  | IdentifierNode
  | IdentifierPatternNode
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
  | ListPatternNode
  | MemberNode
  | MemberPatternNode
  | NumberNode
  | PatternGroupNode
  | PipelineNode
  | PrefixApplicationNode
  | ProgramNode
  | RawStringNode
  | RegexNode
  | RestNode
  | ReturnNode
  | RightSectionNode
  | ShorthandMemberPatternNode
  | SpreadNode
  | StringNode
  | StructNode
  | StructPatternNode
  | TaggedPatternNode
  | TaggedValueNode
  | TupleNode
  | TuplePatternNode
  | TypeAliasNode
  | TypeHintNode
  | WhenNode
  | ErrorNode
