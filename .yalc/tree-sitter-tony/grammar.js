const PREC = Object.freeze({
  REGEX: -1,
  NAMED_INFIX: 1,
  OPERATOR_INFIX: 2,
  BICONDITIONAL: 3,
  IMPLICATION: 4,
  OR: 5,
  AND: 6,
  EQUALITY: 7,
  ORDER: 8,
  SUM: 9,
  PRODUCT: 10,
  EXPONENTIATION: 11,
  NOT: 12,
  PREFIX: 13,
  EXPRESSION: 14,
  PARAMETER: 14,
  APPLICATION: 15,
  PIPELINE: 16,
  DESTRUCTURING_PATTERN: 17
});

module.exports = grammar({
  name: 'tony',

  externals: $ => [
    $._newline,
    $._indent,
    $._dedent,
    $._string_start,
    $._string_content,
    $._string_end
  ],
  extras: $ => [$.comment, /\s+/],
  word: $ => $._identifier_without_operators,
  conflicts: $ => [[$.parameter, $._expression], [$.infix_application]],

  rules: {
    program: $ => seq(optional($.hash_bang_line), optional($._statement_seq)),
    hash_bang_line: $ => /#!.*/,

    _statement: $ => choice(
      $.import,
      $.export,
      $._expression
    ),
    _statement_seq: $ => choice(
      $._statement,
      seq($._statement, $._newline, optional($._statement_seq)),
    ),

    import: $ => seq(
      'import',
      field('clause', $.import_clause),
      'from',
      field('source', $.string)
    ),
    import_clause: $ => seq(
      '{',
      commaSep1(choice($.identifier, $.import_clause_identifier_pair)),
      '}'
    ),
    import_clause_identifier_pair: $ => seq(
      field('left', $.identifier),
      '=>',
      field('right', $.identifier)
    ),

    export: $ => seq(
      'export',
      field('declaration', $.assignment)
    ),

    _expression: $ => prec.left(PREC.EXPRESSION, choice(
      $._group,
      $.abstraction,
      $.application,
      $.prefix_application,
      $.infix_application,
      $.pipeline,
      $.assignment,
      $.return,
      $.map,
      $.tuple,
      $.list,
      $.list_comprehension,
      $.identifier,
      $._literal
    )),
    _expression_seq: $ => choice(
      $._expression,
      seq($._expression, $._newline, optional($._expression_seq)),
    ),

    block: $ => seq($._indent, $._expression_seq, $._dedent),

    parameter: $ => prec(PREC.PARAMETER, choice(
      field('value', $._literal),
      field('pattern', $._destructuring_pattern),
      seq(
        field('name', $.identifier),
        optional(seq('=', field('value', $._expression)))
      )
    )),
    parameters: $ => seq(
      '(',
      commaSep1($.parameter),
      ')'
    ),

    argument: $ => field('value', $._expression),
    arguments: $ => commaSep1($.argument),

    _destructuring_pattern: $ => prec(PREC.DESTRUCTURING_PATTERN, choice(
      $.map,
      $.tuple,
      $.list
    )),

    _group: $ => seq('(', $._expression, ')'),

    abstraction: $ => prec.left(commaSep1($.abstraction_branch)),
    abstraction_branch: $ => seq(
      field('parameters', $.parameters),
      '=>',
      field('body', $._expression)
    ),

    application: $ => prec(PREC.APPLICATION, seq(
      field('abstraction', $._expression),
      '(',
      field('arguments', $.arguments),
      ')'
    )),
    prefix_application: $ => prec.right(PREC.PREFIX, seq(
      field('abstraction', $.identifier),
      field('argument', $._expression)
    )),
    infix_application: $ => choice(
      prec.left(PREC.NOT, seq(field('left', $._expression), field('abstraction', alias('!', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.EXPONENTIATION, seq(field('left', $._expression), field('abstraction', alias('^', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.PRODUCT, seq(field('left', $._expression), field('abstraction', alias('*', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.PRODUCT, seq(field('left', $._expression), field('abstraction', alias('/', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.PRODUCT, seq(field('left', $._expression), field('abstraction', alias('%', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.SUM, seq(field('left', $._expression), field('abstraction', alias('+', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.SUM, seq(field('left', $._expression), field('abstraction', alias('-', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.ORDER, seq(field('left', $._expression), field('abstraction', alias('<', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.ORDER, seq(field('left', $._expression), field('abstraction', alias('<=', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.ORDER, seq(field('left', $._expression), field('abstraction', alias('>', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.ORDER, seq(field('left', $._expression), field('abstraction', alias('>=', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.EQUALITY, seq(field('left', $._expression), field('abstraction', alias('==', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.EQUALITY, seq(field('left', $._expression), field('abstraction', alias('!=', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.EQUALITY, seq(field('left', $._expression), field('abstraction', alias('===', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.EQUALITY, seq(field('left', $._expression), field('abstraction', alias('!==', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.AND, seq(field('left', $._expression), field('abstraction', alias('&&', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.OR, seq(field('left', $._expression), field('abstraction', alias('||', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.IMPLICATION, seq(field('left', $._expression), field('abstraction', alias('==>', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.BICONDITIONAL, seq(field('left', $._expression), field('abstraction', alias('<=>', $.infix_application_operator)), field('right', $._expression))),
      prec.left(PREC.OPERATOR_INFIX, seq(
        field('left', $._expression),
        field('abstraction', alias($._operator, $.infix_application_operator)),
        field('right', $._expression))
      ),
      prec.left(PREC.NAMED_INFIX, seq(
        field('left', $._expression),
        '`',
        field('abstraction', alias($._identifier_without_operators, $.infix_application_operator)),
        '`',
        field('right', $._expression))
      )
    ),

    pipeline: $ => prec.left(PREC.PIPELINE, seq(
      field('left', $._expression),
      '.',
      field('right', $._expression)
    )),

    assignment: $ => seq(
      field('left', choice($.identifier, $._destructuring_pattern)),
      ':=',
      field('right', $._expression)
    ),

    return: $ => prec.right(seq(
      'return',
      optional(field('value', $._expression))
    )),

    map: $ => seq(
      '{',
      commaSep(optional(choice(
        $.expression_pair,
        alias($.identifier, $.shorthand_pair_identifier),
        $.spread
      ))),
      '}'
    ),
    tuple: $ => seq(
      '(',
      commaSep2(choice(
        $._expression,
        $.spread
      )),
      ')'
    ),
    list: $ => seq(
      '[',
      commaSep(choice(
        $._expression,
        $.spread
      )),
      ']'
    ),
    expression_pair: $ => seq(
      field('left', $._expression),
      '->',
      field('right', $._expression)
    ),
    spread: $ => seq(
      '...',
      field('value', $._expression)
    ),

    list_comprehension: $ => seq(
      '[',
      field('body', $._expression),
      '|',
      field('generators', $.generators),
      ']'
    ),
    generators: $ => commaSep1($.generator),
    generator: $ => seq(
      field('name', $.identifier),
      'in',
      field('value', $._expression),
      optional(field('condition', $.generator_condition))
    ),
    generator_condition: $ => seq('if', $._expression),

    _identifier_without_operators: $ => /[a-z_][a-z0-9_]*\??/,
    _operator: $ => choice(/(==|[!@$%^&*|<>~*\\\-+/.]+)=*>?/, '/'),
    identifier: $ => choice($._operator, $._identifier_without_operators),

    _literal: $ => choice(
      $.boolean,
      $.number,
      $.string,
      prec(PREC.REGEX, $.regex)
    ),

    boolean: $ => choice('false', 'true'),

    _decimal: $ => {
      const digits = repeat1(/_?[0-9]+/)
      const exponent = seq(/e-?/, digits)

      return token(choice(
        seq(digits, '.', digits, optional(exponent)),
        seq(digits, exponent)
      ))
    },
    _integer: $ => token(choice(
      seq('0x', repeat1(/_?[A-Fa-f0-9]+/)),
      seq('0o', repeat1(/_?[0-7]+/)),
      seq('0b', repeat1(/_?[0-1]+/)),
      seq(repeat1(/_?[0-9]+/))
    )),
    number: $ => choice($._decimal, $._integer),

    string: $ => seq(
      $._string_start,
      repeat(choice($.interpolation, $.escape_sequence, $._string_content)),
      $._string_end
    ),
    interpolation: $ => seq(
      '{',
      field('value', $._expression),
      '}'
    ),
    escape_sequence: $ => token.immediate(seq(
      '\\',
      choice(
        /[^xu0-7]/,
        /[0-7]{1,3}/,
        /x[0-9a-fA-F]{2}/,
        /u[0-9a-fA-F]{4}/,
        /u{[0-9a-fA-F]+}/
      )
    )),

    regex: $ => seq(
      '/',
      $.regex_pattern,
      token.immediate('/'),
      optional($.regex_flags)
    ),
    regex_pattern: $ => token.immediate(
      repeat1(choice(seq(
        '[',
        repeat(choice(seq('\\', /./), /[^\]\n\\]/)),
        ']'
      ), seq('\\', /./), /[^/\\\[\n]/))
    ),
    regex_flags: $ => token.immediate(/[a-z]+/),

    comment: $ => token(seq('#', /.*/))
  }
});

function commaSep2(rule) {
  return seq(rule, repeat1(seq(',', rule)));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}
