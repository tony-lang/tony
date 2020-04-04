import Parser from 'tree-sitter'

declare module 'tree-sitter-tony' {
  export enum NodeType {
    Abstraction = 'abstraction',
    AbstractionBranch = 'abstraction_branch',
    Access = 'access',
    Application = 'application',
    Argument = 'argument',
    Arguments = 'arguments',
    Assignment = 'assignment',
    Block = 'block',
    Boolean = 'boolean',
    Case = 'case',
    ElseIfClause = 'else_if_clause',
    ElseIfClauses = 'else_if_clauses',
    EscapeSequence = 'escape_sequence',
    Export = 'export',
    ExpressionPair = 'expression_pair',
    Generator = 'generator',
    Generators = 'generators',
    HashBangLine = 'hash_bang_line',
    Identifier = 'identifier',
    IdentifierPattern = 'identifier_pattern',
    IdentifierPatternName = 'identifier_pattern_name',
    If = 'if',
    Import = 'import',
    ImportClause = 'import_clause',
    ImportClauseIdentifierPair = 'import_clause_identifier_pair',
    InfixApplication = 'infix_application',
    Interpolation = 'interpolation',
    List = 'list',
    ListComprehension = 'list_comprehension',
    ListPattern = 'list_pattern',
    ListType = 'list_type',
    Map = 'map',
    MapPattern = 'map_pattern',
    MapType = 'map_type',
    Module = 'module',
    Number = 'number',
    Parameters = 'parameters',
    Pattern = 'pattern',
    PatternList = 'pattern_list',
    PatternPair = 'pattern_pair',
    Pipeline = 'pipeline',
    PrefixApplication = 'prefix_application',
    Program = 'program',
    Regex = 'regex',
    RegexFlags = 'regex_flags',
    RegexPattern = 'regex_pattern',
    RestList = 'rest_list',
    RestMap = 'rest_map',
    Return = 'return',
    ShorthandAccessIdentifier = 'shorthand_access_identifier',
    ShorthandPairIdentifier = 'shorthand_pair_identifier',
    ShorthandPairIdentifierPattern = 'shorthand_pair_identifier_pattern',
    Spread = 'spread',
    String = 'string',
    StringPattern = 'string_pattern',
    Tuple = 'tuple',
    TuplePattern = 'tuple_pattern',
    TupleType = 'tuple_type',
    Type = 'type',
    TypeConstructor = 'type_constructor',
    WhenClause = 'when_clause',
    WhenClauses = 'when_clauses'
  }

  type Expression = Abstraction | Access | Application | Assignment | Case | Export | Identifier | If | InfixApplication | List | ListComprehension | Literal | Map | Module | Pipeline | PrefixApplication | Return | Tuple
  type Declaration = Assignment | Module
  type Literal = Boolean | Number | Regex | String | Type
  type LiteralPattern = Boolean | Number | Regex | StringPattern | Type
  type DestructuringPattern = ListPattern | MapPattern | TuplePattern

  export interface Abstraction extends Parser.SyntaxNode {}
  export interface AbstractionBranch extends Parser.SyntaxNode {
    parametersNode: Parameters
    bodyNode: Block
  }
  export interface Access extends Parser.SyntaxNode {
    valueNode: Expression
    accessorNode: ShorthandAccessIdentifier | Expression
  }
  export interface Application extends Parser.SyntaxNode {
    valueNode: Expression
    argumentsNode: Arguments
  }
  export interface Argument extends Parser.SyntaxNode {
    valueNode?: Expression | Spread
  }
  export interface Arguments extends Parser.SyntaxNode {}
  export interface Assignment extends Parser.SyntaxNode {
    patternNode: IdentifierPattern | DestructuringPattern
    valueNode: Expression
  }
  export interface Block extends Parser.SyntaxNode {}
  export interface Boolean extends Parser.SyntaxNode {}
  export interface Case extends Parser.SyntaxNode {
    valueNode: Expression
    branchesNode: WhenClauses
    defaultNode?: Block
  }
  export interface ElseIfClause extends Parser.SyntaxNode {
    conditionNode: Expression
    consequenceNode: Block
  }
  export interface ElseIfClauses extends Parser.SyntaxNode {}
  export interface EscapeSequence extends Parser.SyntaxNode {}
  export interface Export extends Parser.SyntaxNode {
    declarationNode: Declaration
  }
  export interface ExpressionPair extends Parser.SyntaxNode {
    keyNode: ShorthandAccessIdentifier | Expression
    valueNode: Expression
  }
  export interface Generator extends Parser.SyntaxNode {
    nameNode: IdentifierPatternName
    valueNode: Expression
    conditionNode?: Expression
  }
  export interface Generators extends Parser.SyntaxNode {}
  export interface HashBangLine extends Parser.SyntaxNode {}
  export interface Identifier extends Parser.SyntaxNode {}
  export interface IdentifierPattern extends Parser.SyntaxNode {
    nameNode: IdentifierPatternName
    typeNode?: TypeConstructor
  }
  export interface IdentifierPatternName extends Parser.SyntaxNode {}
  export interface If extends Parser.SyntaxNode {
    conditionNode: Expression
    consequenceNode: Block
    alternativesNode?: ElseIfClauses
    alternativeNode?: Block
  }
  export interface Import extends Parser.SyntaxNode {
    clauseNode: ImportClause
    sourceNode: StringPattern
  }
  export interface ImportClause extends Parser.SyntaxNode {}
  export interface ImportClauseIdentifierPair extends Parser.SyntaxNode {
    nameNode: IdentifierPatternName
    asNode: IdentifierPattern
  }
  export interface InfixApplication extends Parser.SyntaxNode {
    leftNode: Expression
    valueNode: Identifier
    rightNode: Expression
  }
  export interface Interpolation extends Parser.SyntaxNode {
    valueNode: Expression
  }
  export interface List extends Parser.SyntaxNode {}
  export interface ListComprehension extends Parser.SyntaxNode {
    bodyNode: Block
    generatorsNode: Generators
  }
  export interface ListPattern extends Parser.SyntaxNode {}
  export interface ListType extends Parser.SyntaxNode {
    typeNode: TypeConstructor
  }
  export interface Map extends Parser.SyntaxNode {}
  export interface MapPattern extends Parser.SyntaxNode {}
  export interface MapType extends Parser.SyntaxNode {
    keyNode: TypeConstructor
    valueNode: TypeConstructor
  }
  export interface Module extends Parser.SyntaxNode {
    nameNode: Type
    bodyNode: Block
  }
  export interface Number extends Parser.SyntaxNode {}
  export interface Parameters extends Parser.SyntaxNode {}
  export interface Pattern extends Parser.SyntaxNode {
    patternNode?: DestructuringPattern
    valueNode?: LiteralPattern
    nameNode?: IdentifierPattern
    defaultNode?: Expression
  }
  export interface PatternList extends Parser.SyntaxNode {}
  export interface PatternPair extends Parser.SyntaxNode {
    keyNode: Expression | ShorthandAccessIdentifier
    valueNode: Pattern
  }
  export interface Pipeline extends Parser.SyntaxNode {
    argumentNode: Expression
    valueNode: Expression
  }
  export interface PrefixApplication extends Parser.SyntaxNode {
    valueNode: Identifier
    argumentNode: Expression
  }
  export interface Program extends Parser.SyntaxNode {}
  export interface Regex extends Parser.SyntaxNode {
    patternNode: RegexPattern
    flagsNode: RegexFlags
  }
  export interface RegexFlags extends Parser.SyntaxNode {}
  export interface RegexPattern extends Parser.SyntaxNode {}
  export interface Rest extends Parser.SyntaxNode {
    nameNode: IdentifierPattern
  }
  export interface RestList extends Rest {}
  export interface RestMap extends Rest {}
  export interface RestTuple extends Rest {}
  export interface Return extends Parser.SyntaxNode {
    valueNode: Expression
  }
  export interface ShorthandAccessIdentifier extends Identifier {}
  export interface ShorthandPairIdentifier extends Identifier {}
  export interface ShorthandPairIdentifierPattern extends Parser.SyntaxNode {
    nameNode: IdentifierPattern
    defaultNode?: Expression
  }
  export interface Spread extends Parser.SyntaxNode {
    valueNode: Expression
  }
  export interface String extends Parser.SyntaxNode {}
  export interface StringPattern extends Parser.SyntaxNode {}
  export interface Tuple extends Parser.SyntaxNode {}
  export interface TuplePattern extends Parser.SyntaxNode {}
  export interface TupleType extends Parser.SyntaxNode {}
  export interface Type extends Parser.SyntaxNode {}
  export interface TypeConstructor extends Parser.SyntaxNode {}
  export interface WhenClause extends Parser.SyntaxNode {
    valuesNode: PatternList
    consequenceNode: Block
  }
  export interface WhenClauses extends Parser.SyntaxNode {}
}
