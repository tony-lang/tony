import {
  AbstractionNode,
  AccessNode,
  ApplicationNode,
  AssignmentNode,
  BooleanNode,
  ExportNode,
  ExportedImportNode,
  GroupNode,
  IdentifierNode,
  IfNode,
  ImportNode,
  InfixApplicationNode,
  ListComprehensionNode,
  ListNode,
  NamedValueNode,
  NumberNode,
  PipelineNode,
  PrefixApplicationNode,
  RegexNode,
  ReturnNode,
  StringNode,
  StructNode,
  TupleNode,
  TypeAliasNode,
  TypeHintNode,
} from 'tree-sitter-tony'

export type TermNode =
  | AbstractionNode
  | AccessNode
  | ApplicationNode
  | AssignmentNode
  | BooleanNode
  | ExportNode
  | ExportedImportNode
  | GroupNode
  | IdentifierNode
  | IfNode
  | ImportNode
  | InfixApplicationNode
  | ListNode
  | ListComprehensionNode
  | NamedValueNode
  | NumberNode
  | PipelineNode
  | PrefixApplicationNode
  | RegexNode
  | ReturnNode
  | StringNode
  | StructNode
  | TupleNode
  | TypeAliasNode
  | TypeHintNode
