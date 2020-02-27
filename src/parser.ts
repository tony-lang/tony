import Parser from 'tree-sitter'
import TreeSitterTony from 'tree-sitter-tony'

const parser = new Parser()
parser.setLanguage(TreeSitterTony)

export default parser
