const getActualArgs = (args: any[]): any[] => args.filter(arg => arg !== null)

const addNewArgs = (args: any[], newArgs: any[]): any[] => args
  .map(arg => arg === null ? newArgs.pop() : arg)
  .concat(newArgs)

export const curry = (fn: any, ...cache: any[]) => (...args: any[]): any => {
  const newArgs = addNewArgs(cache, args)
  const actualArgs = getActualArgs(newArgs)

  return actualArgs.length >= fn.length ?
    fn(...actualArgs) : curry(fn, ...newArgs)
}
