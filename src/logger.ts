import { Config } from './config'

export const log = ({ verbose }: Config, ...messages: any[]) => {
  if (!verbose) return

  console.log(...messages)
}
