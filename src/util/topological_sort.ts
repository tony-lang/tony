import { CyclicDependency } from '../types'

// adjacency lists where where for each index in the list the corresponding
// sublist represents the indices of all adjacent nodes in the graph.
type Graph = number[][]

type State = {
  sorted: number[]
  visited: number[]
}

const initialState: State = {
  sorted: [],
  visited: [],
}

export const topologicalSort = (graph: Graph): number[] =>
  graph.reduce<State>(
    (state, adjacentNodes, node) => visit(graph, state, node, adjacentNodes),
    initialState,
  ).sorted

const visit = (
  graph: Graph,
  { sorted, visited }: State,
  node: number,
  adjacentNodes: number[],
  ancestors: number[] = [],
): State => {
  if (visited.includes(node)) return { sorted, visited }

  const newAncestors = [...ancestors, node]
  const {
    sorted: newSorted,
    visited: newVisited,
  } = adjacentNodes.reduce<State>(
    (state, adjacentNode) =>
      visitAdjacentNode(graph, state, adjacentNode, node, newAncestors),
    { sorted, visited: [...visited, node] },
  )

  return {
    sorted: [node, ...newSorted],
    visited: newVisited,
  }
}

const visitAdjacentNode = (
  graph: Graph,
  state: State,
  node: number,
  originalNode: number,
  ancestors: number[],
) => {
  if (ancestors.includes(node))
    throw new TopologicalSortError({
      a: originalNode,
      b: node,
      ancestorsOfA: ancestors,
    })

  return visit(graph, state, node, graph[node], ancestors)
}

export class TopologicalSortError extends Error {
  private _cyclicDependency: CyclicDependency<number>

  constructor(cyclicDependency: CyclicDependency<number>) {
    super()
    this.name = this.constructor.name

    this._cyclicDependency = cyclicDependency
  }

  get cyclicDependency(): CyclicDependency<number> {
    return this._cyclicDependency
  }
}
