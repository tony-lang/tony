export const TRANSFORM_PLACEHOLDER_ARGUMENT = '$TRANSFORM_PLACEHOLDER_ARGUMENT'

type UnknownFunction = (...args: unknown[]) => unknown

/**
 * Curries the arguments of a given function.
 */
export const curry =
  (fn: UnknownFunction, ...cache: unknown[]) =>
  (...args: unknown[]): unknown => {
    const newArgs = addNewArgs(cache, args)
    const actualArgs = getActualArgs(newArgs)

    const result = fn(...actualArgs)
    return result === undefined ? curry(fn, ...newArgs) : result
  }

/**
 * Curries the arguments of a given function imported from JavaScript.
 */
export const curryJS =
  (fn: UnknownFunction, ...cache: unknown[]) =>
  (...args: unknown[]): unknown => {
    const all = cache.concat(args)

    return all.length >= fn.length ? fn(...all) : curryJS(fn, ...all)
  }

const getActualArgs = (args: unknown[]): unknown[] =>
  args.filter((arg) => arg !== TRANSFORM_PLACEHOLDER_ARGUMENT)

const addNewArgs = (args: unknown[], newArgs: unknown[]): unknown[] =>
  args
    .map((arg) =>
      arg === TRANSFORM_PLACEHOLDER_ARGUMENT ? newArgs.pop() : arg,
    )
    .concat(newArgs)
