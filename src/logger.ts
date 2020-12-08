import { Config } from './config'

export const log = (value: string, { verbose }: Config) => {
  if (!verbose) return

  console.log(value)
}
