export const graphSearch = async <T, U>(
  visit: (
    acc: U,
    vertice: T,
    explored: T[],
  ) => Promise<[newAcc: U, newVertices: T[]]>,
  acc: U,
  frontier: T[],
  explored: T[] = [],
): Promise<U> => {
  if (frontier.length === 0) return acc

  const [vertice, ...remainingFrontier] = frontier
  const newExplored = [...explored, vertice]
  const [newAcc, newVertices] = await visit(acc, vertice, newExplored)
  const newFrontier = [...remainingFrontier, ...newVertices]

  return graphSearch(visit, newAcc, newFrontier, newExplored)
}
