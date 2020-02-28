import Parser from 'tree-sitter'

export default class GenerateCode {
  generate = (node: Parser.SyntaxNode): string => {
    switch (node.type) {
    case 'abstraction':
      return this.generateAbstraction(node)
    case 'application':
      return this.generateApplication(node)
    case 'argument':
      return this.generateArgument(node)
    case 'arguments':
      return this.generateArguments(node)
    case 'block':
      return this.generateBlock(node)
    case 'boolean':
      return this.generateBoolean(node)
    case 'comment':
      return this.generateComment(node)
    case 'expression_pair':
      return this.generateExpressionPair(node)
    case 'identifier':
      return this.generateIdentifier(node)
    case 'infix_application':
      return this.generateInfixApplication(node)
    case 'list':
      return this.generateList(node)
    case 'map':
      return this.generateMap(node)
    case 'number':
      return this.generateNumber(node)
    case 'parameter':
      return this.generateParameter(node)
    case 'parameters':
      return this.generateParameters(node)
    case 'pipeline':
      return this.generatePipeline(node)
    case 'prefix_application':
      return this.generatePrefixApplication(node)
    case 'program':
      return this.generateProgram(node)
    case 'range':
      return this.generateRange(node)
    case 'regex':
      return this.generateRegex(node)
    case 'return':
      return this.generateReturn(node)
    case 'spread':
      return this.generateSpread(node)
    case 'string':
      return this.generateString(node)
    case 'tuple':
      return this.generateTuple(node)
    default:
      console.log(`Could not find generator for AST node '${node.type}'.`)
      process.exit(1)
    }
  }

  generateAbstraction = (node: Parser.SyntaxNode): string => {
    const parameters = this.generate(node.namedChild(0))
    const body = this.generate(node.namedChild(1))

    return `((${parameters})=>${body})`
  }

  generateApplication = (node: Parser.SyntaxNode): string => {
    const abstraction = this.generate(node.namedChild(0))
    const args = this.generate(node.namedChild(1))

    return `${abstraction}(${args})`
  }

  generateArgument = (node: Parser.SyntaxNode): string => {
    const expression = this.generate(node.namedChild(0))

    return expression
  }

  generateArguments = (node: Parser.SyntaxNode): string => {
    const args = node.namedChildren
      .map(argument => this.generate(argument))
      .join(',')

    return args
  }

  generateBlock = (node: Parser.SyntaxNode): string => {
    const expressions = node.namedChildren
      .map(expression => this.generate(expression))
      .join(';')

    return expressions
  }

  generateBoolean = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generateComment = (node: Parser.SyntaxNode): string => {
    return ''
  }

  generateExpressionPair = (node: Parser.SyntaxNode): string => {
    const key = this.generate(node.namedChild(0))
    const value = this.generate(node.namedChild(1))

    return `${key}:${value}`
  }

  generateIdentifier = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generateInfixApplication = (node: Parser.SyntaxNode): string => {
    const abstraction = node.child(1).text === '`' ? node.child(2).text : node.child(1).text
    const left = this.generate(node.namedChild(0))
    const right = this.generate(node.namedChild(1))

    return `${abstraction}(${left}, ${right})`
  }

  generateList = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map(element => this.generate(element))
      .join(',')

    return `[${elements}]`
  }

  generateMap = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map(element => this.generate(element))
      .join(',')

    return `{${elements}}`
  }

  generateNumber = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generateParameter = (node: Parser.SyntaxNode): string => {
    const name = this.generate(node.namedChild(0))
    if (!nodeHasChild(node, '=')) return name

    const value = this.generate(node.namedChild(1))
    return `${name}=${value}`
  }

  generateParameters = (node: Parser.SyntaxNode): string => {
    const parameters = node.namedChildren
      .map(parameter => this.generate(parameter))
      .join(',')

    return parameters
  }

  generatePipeline = (node: Parser.SyntaxNode): string => {
    const left = this.generate(node.namedChild(0))
    const right = this.generate(node.namedChild(1))

    return `${right}(${left})`
  }

  generatePrefixApplication = (node: Parser.SyntaxNode): string => {
    const abstraction = this.generate(node.namedChild(0))
    const argument = this.generate(node.namedChild(1))

    return `${abstraction}(${argument})`
  }

  generateProgram = (node: Parser.SyntaxNode): string => {
    const expressions = node.namedChildren
      .map(expression => this.generate(expression))
      .join(';')

    return expressions
  }

  generateRange = (node: Parser.SyntaxNode): string => {
    const start = this.generate(node.namedChild(0))
    const end = this.generate(node.namedChild(1))

    return `...Array(${end}-${start}).keys().map(i => i+${start})`
  }

  generateRegex = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generateReturn = (node: Parser.SyntaxNode): string => {
    if (node.namedChildCount == 0) return 'return'

    const value = this.generate(node.namedChild(0))
    return `return ${value}`
  }

  generateSpread = (node: Parser.SyntaxNode): string => {
    const expression = this.generate(node.namedChild(0))

    return `...${expression}`
  }

  generateString = (node: Parser.SyntaxNode): string => {
    return node.text
  }

  generateTuple = (node: Parser.SyntaxNode): string => {
    const elements = node.namedChildren
      .map(element => this.generate(element))
      .join(',')

    return `[${elements}]`
  }
}

const nodeHasChild = (node: Parser.SyntaxNode, type: string): boolean => {
  return node.children.map(child => child.type).includes(type)
}
