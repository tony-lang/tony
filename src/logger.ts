import { Config } from './config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const log = ({ verbose }: Config, ...messages: any[]): void => {
  if (!verbose) return

  console.log(...messages)
}
