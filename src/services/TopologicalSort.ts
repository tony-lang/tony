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
      if (ancestors.includes(j)) throw new TopologicalSortError([i, j])

      this.visit(j, this._dependencyGraph[j], ancestors)
    })

    this._sorted = [i, ...this._sorted]
  }
}

export class TopologicalSortError extends Error {
  private _cyclicDependency: [number, number]

  constructor(cyclicDependency: [number, number]) {
    super(undefined)
    this.name = this.constructor.name

    this._cyclicDependency = cyclicDependency
  }

  get cyclicDependency(): [number, number] {
    return this._cyclicDependency
  }
}
