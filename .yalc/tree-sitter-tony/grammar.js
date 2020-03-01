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
  INLINE_EXPRESSION: 14,
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
  conflicts: $ => [[$.parameter, $._simple_expression]],

  rules: {
    program: $ => seq(optional($.hash_bang_line), optional($._statement_seq)),
    hash_bang_line: $ => /#!.*/,

    _statement: $ => choice($._simple_statement, $._compound_statement),
    _statement_seq: $ => choice(
      $._statement,
      seq($._simple_statement, $._newline, optional($._statement_seq)),
      seq($._compound_statement, $._statement_seq)
    ),
    _compound_statement: $ => $._compound_expression,
    _simple_statement: $ => choice(
      $.import,
      $._simple_expression
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

    _expression: $ => choice($._simple_expression, $._compound_expression),
    _expression_seq: $ => choice(
      $._expression,
      seq($._simple_expression, $._newline, optional($._expression_seq)),
      seq($._compound_expression, $._expression_seq)
    ),
    _compound_expression: $ => choice(
      alias($._compound_abstraction, $.abstraction),
      alias($._compound_assignment, $.assignment),
      alias($._compound_return, $.return)
    ),
    _simple_expression: $ => prec(PREC.INLINE_EXPRESSION, choice(
      $._group,
      alias($._simple_abstraction, $.abstraction),
      $.application,
      $.prefix_application,
      $.infix_application,
      $.pipeline,
      alias($._simple_assignment, $.assignment),
      alias($._simple_return, $.return),
      $.map,
      $.tuple,
      $.list,
      $.identifier,
      $._literal
    )),

    block: $ => seq($._indent, $._expression_seq, $._dedent),

    parameter: $ => prec(PREC.PARAMETER, seq(
      field('name', $.identifier),
      optional(seq('=', field('value', $._simple_expression)))
    )),
    parameters: $ => commaSep1($.parameter),

    argument: $ => field('value', $._expression),
    arguments: $ => commaSep1($.argument),

    _destructuring_pattern: $ => prec(PREC.DESTRUCTURING_PATTERN, choice(
      $.map,
      $.tuple,
      $.list
    )),

    _compound_abstraction: $ => seq(
      field('parameters', $.parameters),
      '=>',
      field('body', $.block)
    ),

    _compound_assignment: $ => seq(
      field('left', choice($.identifier, $._destructuring_pattern)),
      ':=',
      field('right', $._compound_expression)
    ),

    _compound_return: $ => seq(
      'return',
      field('value', $._compound_expression)
    ),

    _group: $ => seq('(', $._simple_expression, ')'),

    _simple_abstraction: $ => seq(
      field('parameters', $.parameters),
      '=>',
      field('body', $._simple_expression)
    ),

    application: $ => prec(PREC.APPLICATION, seq(
      field('abstraction', $._simple_expression),
      '(',
      field('arguments', $.arguments),
      ')'
    )),
    prefix_application: $ => prec.right(PREC.PREFIX, seq(
      field('abstraction', $.identifier),
      field('argument', $._simple_expression)
    )),
    infix_application: $ => choice(
      prec.left(PREC.NOT, seq(field('left', $._simple_expression), field('abstraction', '!'), field('right', $._simple_expression))),
      prec.left(PREC.EXPONENTIATION, seq(field('left', $._simple_expression), field('abstraction', '^'), field('right', $._simple_expression))),
      prec.left(PREC.PRODUCT, seq(field('left', $._simple_expression), field('abstraction', '*'), field('right', $._simple_expression))),
      prec.left(PREC.PRODUCT, seq(field('left', $._simple_expression), field('abstraction', '/'), field('right', $._simple_expression))),
      prec.left(PREC.PRODUCT, seq(field('left', $._simple_expression), field('abstraction', '%'), field('right', $._simple_expression))),
      prec.left(PREC.SUM, seq(field('left', $._simple_expression), field('abstraction', '+'), field('right', $._simple_expression))),
      prec.left(PREC.SUM, seq(field('left', $._simple_expression), field('abstraction', '-'), field('right', $._simple_expression))),
      prec.left(PREC.ORDER, seq(field('left', $._simple_expression), field('abstraction', '<'), field('right', $._simple_expression))),
      prec.left(PREC.ORDER, seq(field('left', $._simple_expression), field('abstraction', '<='), field('right', $._simple_expression))),
      prec.left(PREC.ORDER, seq(field('left', $._simple_expression), field('abstraction', '>'), field('right', $._simple_expression))),
      prec.left(PREC.ORDER, seq(field('left', $._simple_expression), field('abstraction', '>='), field('right', $._simple_expression))),
      prec.left(PREC.EQUALITY, seq(field('left', $._simple_expression), field('abstraction', '=='), field('right', $._simple_expression))),
      prec.left(PREC.EQUALITY, seq(field('left', $._simple_expression), field('abstraction', '!='), field('right', $._simple_expression))),
      prec.left(PREC.EQUALITY, seq(field('left', $._simple_expression), field('abstraction', '==='), field('right', $._simple_expression))),
      prec.left(PREC.EQUALITY, seq(field('left', $._simple_expression), field('abstraction', '!=='), field('right', $._simple_expression))),
      prec.left(PREC.AND, seq(field('left', $._simple_expression), field('abstraction', '&&'), field('right', $._simple_expression))),
      prec.left(PREC.OR, seq(field('left', $._simple_expression), field('abstraction', '||'), field('right', $._simple_expression))),
      prec.left(PREC.IMPLICATION, seq(field('left', $._simple_expression), field('abstraction', '==>'), field('right', $._simple_expression))),
      prec.left(PREC.BICONDITIONAL, seq(field('left', $._simple_expression), field('abstraction', '<=>'), field('right', $._simple_expression))),
      prec.left(PREC.OPERATOR_INFIX, seq(
        field('left', $._simple_expression),
        field('abstraction', $._operator),
        field('right', $._simple_expression))
      ),
      prec.left(PREC.NAMED_INFIX, seq(
        field('left', $._simple_expression),
        '`',
        field('abstraction', $._identifier_without_operators),
        '`',
        field('right', $._simple_expression))
      )
    ),

    pipeline: $ => prec.left(PREC.PIPELINE, seq(
      field('left', $._simple_expression),
      '.',
      field('right', $._simple_expression)
    )),

    _simple_assignment: $ => seq(
      field('left', choice($.identifier, $._destructuring_pattern)),
      ':=',
      field('right', $._simple_expression)
    ),

    _simple_return: $ => prec.right(seq(
      'return',
      optional(field('value', $._simple_expression))
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
        $.spread,
        $.range
      )),
      ']'
    ),
    expression_pair: $ => seq(
      field('left', $._expression),
      '=>',
      field('right', $._expression)
    ),
    spread: $ => seq(
      '...',
      field('value', $._simple_expression)
    ),
    range: $ => seq(
      field('left', $._expression),
      '..',
      field('right', $._expression)
    ),

    _identifier_without_operators: $ => /_?[a-z][a-z0-9_]*\??/,
    _operator: $ => /(==|[!@#$%^&*|<>~*\\\-+/]+)=*>?/,
    identifier: $ => choice($._operator, $._identifier_without_operators, '/'),

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
      field('value', $._simple_expression),
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
