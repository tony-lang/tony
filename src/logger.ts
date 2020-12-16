import { Config } from './config'

export enum LogLevel {
  Debug,
  Info,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const print = (messages: any[]) => console.log(...messages)

export const log = (
  { debug, verbose }: Config,
  kind: LogLevel,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...messages: any[]
): void => {
  if (!verbose) return

  if (kind === LogLevel.Info && (verbose || debug)) print(messages)
  if (kind === LogLevel.Debug && debug) print(messages)
}
