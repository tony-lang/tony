import { TRANSFORM_PLACEHOLDER_ARGUMENT } from '../constants'

export class Curry {
  static perform = (fn: any, ...cache: any[]) => (...args: any[]): any => {
    const newArgs = Curry.addNewArgs(cache, args)
    const actualArgs = Curry.getActualArgs(newArgs)

    const result = fn(...actualArgs)
    return result === null ? Curry.perform(fn, ...newArgs) : result
  }

  private static getActualArgs = (args: any[]): any[] =>
    args.filter(arg => arg !== TRANSFORM_PLACEHOLDER_ARGUMENT)

  private static addNewArgs = (args: any[], newArgs: any[]): any[] => args
    .map(arg => arg === TRANSFORM_PLACEHOLDER_ARGUMENT ? newArgs.pop() : arg)
    .concat(newArgs)

  static external = (fn: any, ...cache: any[]) => (...args: any[]): any => {
    const all = cache.concat(args)

    return all.length >= fn.length ? fn(...all) : Curry.external(fn, ...all)
  }
}
