import { TEST_EMITS_PATH } from './constants'
import { Command, TestCase } from './types'
import fs from 'fs'
import path from 'path'

export class ParsingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }

  set filePath(value: string) {
    this.message = `[${value}] ${this.message}`
  }
}

// @error <file>:<line>:<pos> <code>
const parseErrorCommand = (testCase: TestCase, value: string): TestCase => {
  const args = value.split(' ')
  if (args.length !== 2)
    throw new ParsingError('@error: requires two arguments')

  const loc = args[0].split(':')
  if (loc.length !== 3)
    throw new ParsingError(
      '@error: the location argument must consist of file, line and position',
    )

  return {
    ...testCase,
    error: {
      file: loc[0],
      line: Number.parseInt(loc[1]),
      pos: Number.parseInt(loc[2]),
      code: args[1],
    },
  }
}

// @runtime-error <error>
const parseRuntimeErrorCommand = (
  testCase: TestCase,
  value: string,
): TestCase => ({
  ...testCase,
  runtimeError: value,
})

// @emit <path>
const parseEmitCommand = (testCase: TestCase, value: string): TestCase => ({
  ...testCase,
  emit: fs.readFileSync(path.join(TEST_EMITS_PATH, value)).toString(),
})

// @output
// hello
// world
const parseOutputCommand = (testCase: TestCase, value: string): TestCase => ({
  ...testCase,
  output: value
    .split('\n')
    .map((line) => line.slice(2))
    .join('\n'),
})

// @file <path>
// IO->print('hello\nworld')
const parseFileCommand = (testCase: TestCase, value: string): TestCase => {
  const [path, ...lines] = value.split('\n')

  if (path === '') throw new ParsingError('@file: given path must be nonempty')

  return {
    ...testCase,
    files: [
      ...testCase.files,
      {
        path,
        content: lines.join('\n'),
      },
    ],
  }
}

const detectCommand = (value: string): Command | undefined => {
  if (value.startsWith(`# ${Command.Error}`)) return Command.Error
  else if (value.startsWith(`# ${Command.RuntimeError}`))
    return Command.RuntimeError
  else if (value.startsWith(`# ${Command.Emit}`)) return Command.Emit
  else if (value.startsWith(`# ${Command.Output}`)) return Command.Output
  else if (value.startsWith(`# ${Command.File}`)) return Command.File
}

const parseCommand = (
  testCase: TestCase,
  currentCommand: string | undefined,
): TestCase => {
  if (currentCommand === undefined) return testCase

  const command = detectCommand(currentCommand)
  if (command === undefined)
    throw new ParsingError(`Invalid test command:\n${currentCommand}`)

  const value = currentCommand.slice(command.length + 2).trim()

  switch (command) {
    case Command.Error:
      return parseErrorCommand(testCase, value)
    case Command.RuntimeError:
      return parseRuntimeErrorCommand(testCase, value)
    case Command.Emit:
      return parseEmitCommand(testCase, value)
    case Command.Output:
      return parseOutputCommand(testCase, value)
    case Command.File:
      return parseFileCommand(testCase, value)
  }
}

export const parseTestCase = (
  name: string,
  content: string,
): TestCase | undefined => {
  const lines = content.split('\n')

  try {
    const { testCase, currentCommand } = lines.reduce<{
      testCase: TestCase
      currentCommand: string | undefined
    }>(
      ({ testCase, currentCommand }, line) => {
        const isNewCommand =
          detectCommand(line) !== undefined && currentCommand !== undefined
        if (isNewCommand)
          return {
            testCase: parseCommand(testCase, currentCommand),
            currentCommand: line,
          }

        return {
          testCase,
          currentCommand: currentCommand ? `${currentCommand}\n${line}` : line,
        }
      },
      { testCase: { name, files: [] }, currentCommand: undefined },
    )

    const finalTestCase = parseCommand(testCase, currentCommand)
    if (finalTestCase.files.length === 0)
      throw new ParsingError('Test case does not have any files')

    return finalTestCase
  } catch (error) {
    if (error instanceof ParsingError) error.filePath = name
    throw error
  }
}
