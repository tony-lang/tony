import { TopologicalSortError } from '../errors/internal/TopologicalSortError'

export class TopologicalSort {
  // adjacency list where numbers represent nodes in the dependency graph
  private _dependencyGraph: number[][]

  private _sorted: number[] = []
  private _visited: number[] = []

  constructor(dependencyGraph: number[][]) {
    this._dependencyGraph = dependencyGraph
  }

  perform = (): number[] => {
    this._dependencyGraph.forEach((dependencies, i) =>
      this.visit(i, dependencies),
    )

    return this._sorted
  }

  visit = (
    i: number,
    dependencies: number[],
    ancestors: number[] = [],
  ): void => {
    if (this._visited.includes(i)) return

    ancestors = [...ancestors, i]
    this._visited = [...this._visited, i]

    dependencies.forEach((j) => {
      if (ancestors.includes(j))
        throw new TopologicalSortError({
          a: i,
          b: j,
          ancestorsOfA: ancestors,
        })

      this.visit(j, this._dependencyGraph[j], ancestors)
    })

    this._sorted = [i, ...this._sorted]
  }
}
