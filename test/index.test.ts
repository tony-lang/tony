import { InternalError, compile } from '../src'
import { FILE_EXTENSION } from '../src/constants'
import childProcess from 'child_process'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import test from 'ava'

const COMPILE_ERROR_PREFIX = Object.freeze('COMPILE_ERROR:')
const RUNTIME_ERROR_PREFIX = Object.freeze('RUNTIME_ERROR:')
const TEST_DIR_PATH = Object.freeze(path.join(__dirname, '..', '..', 'test'))
const TEST_OUT_DIR_PATH = Object.freeze(
  path.join(__dirname, '..', '..', 'dist', 'test'),
)
const STDLIB = fs.readFileSync(path.join(TEST_DIR_PATH, 'stdlib.tn')).toString()

type Example = { name: string; source: string; expected: string }
type ExampleSet = {
  [key: string]: Example
}

const getTestFilePath = (file: string): string =>
  file.replace(FILE_EXTENSION, `.test${FILE_EXTENSION}`)

const matchesError = (expected: string, actual: string): boolean =>
  matchesCompileError(expected, actual) || matchesRuntimeError(expected, actual)

const matchesCompileError = (expected: string, actual: string): boolean => {
  const expectedError = expected.substring(COMPILE_ERROR_PREFIX.length).trim()

  return expected.startsWith(COMPILE_ERROR_PREFIX) && actual === expectedError
}

const matchesRuntimeError = (expected: string, actual: string): boolean => {
  const expectedError = expected.substring(RUNTIME_ERROR_PREFIX.length).trim()

  return (
    expected.startsWith(RUNTIME_ERROR_PREFIX) && actual.includes(expectedError)
  )
}

const findExamples = (): Example[] => {
  const examples = fs
    .readdirSync(TEST_DIR_PATH)
    .filter((file) => fs.statSync(path.join(TEST_DIR_PATH, file)).isDirectory())
    .map((directory) => {
      return fs
        .readdirSync(path.join(TEST_DIR_PATH, directory))
        .map((file) => path.join(directory, file))
    })
    .reduce((acc, files) => acc.concat(files), [])
    .reduce(accumulateExamples, {})

  return Object.values(examples)
}

const accumulateExamples = (acc: ExampleSet, file: string): ExampleSet => {
  const content = fs.readFileSync(path.join(TEST_DIR_PATH, file)).toString()
  const [name, ext] = file.split('.')
  if (!['tn', 'txt'].includes(ext)) return acc

  acc[name] = {
    name,
    [ext === 'tn' ? 'source' : 'expected']: content,
    ...acc[name],
  }

  return acc
}

const runExample = async (
  outputFile: string,
  source: string,
): Promise<string> => {
  const sourcePath = await copyExample(outputFile, source)

  let entryPath: string
  try {
    entryPath = await compile(sourcePath, {})
  } catch (error) {
    if (error instanceof InternalError) return error.message
    return error.name
  }

  const nodeProcess = childProcess.spawnSync('node', [entryPath])
  return nodeProcess.stdout.toString() || nodeProcess.stderr.toString()
}

const copyExample = async (
  outputFile: string,
  source: string,
): Promise<string> => {
  const sourcePath = path.join(TEST_OUT_DIR_PATH, getTestFilePath(outputFile))

  await mkdirp(path.dirname(sourcePath))
  fs.writeFileSync(sourcePath, source)

  return sourcePath
}

const runTests = async (examples: Example[]): Promise<void> => {
  examples.forEach(({ name, source, expected }) => {
    test.serial(name, async (t) => {
      const actual = await runExample(`${name}.tn`, `${STDLIB}\n${source}`)

      if (matchesError(expected, actual)) t.pass(name)
      else t.is(expected.trim(), actual.trim())
    })
  })
}

runTests(findExamples())
