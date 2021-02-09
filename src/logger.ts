import { Config } from './config'

export enum LogLevel {
  Debug,
  Info,
}

const print = (messages: unknown[]) => console.log(...messages)

export const log = (
  { debug, verbose }: Config,
  kind: LogLevel,
  ...messages: unknown[]
): void => {
  if (!verbose) return

  if (kind === LogLevel.Info && (verbose || debug)) print(messages)
  if (kind === LogLevel.Debug && debug) print(messages)
}
