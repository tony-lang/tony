export abstract class GraphSearch<T, U> {
  private _frontier: T[]
  private _explored: T[] = []

  constructor(entry: T) {
    this._frontier = [entry]
  }

  perform = async (): Promise<U> => {
    if (this._frontier.length == 0) return this.success()

    const [vertice, ...frontier] = this._frontier
    this._explored = [...this._explored, vertice]

    const newVertices = await this.visit(vertice)
    this._frontier = [...frontier, ...newVertices]

    return this.perform()
  }

  protected isExplored = (vertice: T): boolean =>
    this._explored.includes(vertice)

  protected abstract success: () => U
  protected abstract visit: (vertice: T) => Promise<T[]>
}
