import { Node } from './ast'

export interface Binding {
  name: string
  node: Node
  isExported: boolean
  isImported: boolean
}
