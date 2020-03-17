import { TRANSFORM_PLACEHOLDER_ARGUMENT } from '../constants'

export class Curry {
  static perform = (fn: any, ...cache: any[]) => (...args: any[]): any => {
    const newArgs = Curry.addNewArgs(cache, args)
    const actualArgs = Curry.getActualArgs(newArgs)

    return actualArgs.length >= fn.length ?
      fn(...actualArgs) : Curry.perform(fn, ...newArgs)
  }

  private static getActualArgs = (args: any[]): any[] =>
    args.filter(arg => arg !== null)

  private static addNewArgs = (args: any[], newArgs: any[]): any[] => args
    .map(arg => arg === TRANSFORM_PLACEHOLDER_ARGUMENT ? newArgs.pop() : arg)
    .concat(newArgs)
}
