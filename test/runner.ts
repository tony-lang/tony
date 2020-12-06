import { CompileError, compile } from '../src'
import { ExecutionContext, TestInterface } from 'ava'
import { ExpectedError, File, TestCase } from './types'
import { STDLIB, TEST_OUT_DIR_PATH } from './constants'
import childProcess from 'child_process'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'

const copyExample = async (
  outputPath: string,
  content: string,
): Promise<string> => {
  const completeOutputPath = path.join(TEST_OUT_DIR_PATH, outputPath)

  // TODO: remove once standard library is implemented
  const fileContent = outputPath.endsWith('.tn')
    ? `${STDLIB}\n${content}`
    : content

  await mkdirp(path.dirname(completeOutputPath))
  fs.writeFileSync(completeOutputPath, fileContent)

  return completeOutputPath
}

const setupTestCase = async (t: ExecutionContext, files: File[]) => {
  const outputPaths = await Promise.all(
    files.map(({ path, content }) => copyExample(path, content)),
  )

  return outputPaths[0]
}

const runTestCase = (entryPath: string): { stdout: string; stderr: string } => {
  const nodeProcess = childProcess.spawnSync('node', [entryPath])

  console.log(entryPath, nodeProcess.stdout.toString())

  return {
    stdout: nodeProcess.stdout.toString(),
    stderr: nodeProcess.stderr.toString(),
  }
}

const handleCompileError = (
  t: ExecutionContext,
  actual: CompileError,
  expected: ExpectedError,
) => {
  t.is(actual.name, expected.code, 'Wrong error thrown')
  t.is(
    actual.filePath.slice(TEST_OUT_DIR_PATH.length + 1),
    expected.file,
    'Error thrown in the wrong file',
  )
  t.is(actual.context.start.row, expected.line, 'Error thrown in wrong row')
  t.is(
    actual.context.start.column,
    expected.pos,
    'Error thrown in wrong column',
  )
}

const handleError = (
  t: ExecutionContext,
  actual: Error,
  expected: ExpectedError | undefined,
) => {
  if (expected === undefined) {
    t.fail(
      `Failed test with unexpected error [${actual.name}] ${actual.message}`,
    )
  } else if (actual instanceof CompileError) {
    handleCompileError(t, actual, expected)
  } else {
    t.fail(`[${actual.name}] ${actual.message}`)
  }
}

const handleEmit = (
  t: ExecutionContext,
  entryPath: string,
  expected: string,
) => {
  const actual = fs.readFileSync(entryPath).toString()

  t.is(actual, expected, 'Emit does not match')
}

const handleOutput = (
  t: ExecutionContext,
  entryPath: string,
  expected: string | undefined,
  expectedRuntimeError: string | undefined,
) => {
  const { stdout, stderr } = runTestCase(entryPath)

  if (stderr) {
    if (expectedRuntimeError === undefined)
      t.fail(`Encountered runtime error: ${stderr}`)

    t.true(stderr.includes(expectedRuntimeError))
  } else if (expectedRuntimeError !== undefined)
    t.fail('Did not encounter expected runtime error')

  if (expected !== undefined)
    t.is(stdout.trim(), expected, 'Output does not match')
}

const handleTestCase = (
  expectedError: ExpectedError | undefined,
  runtimeError: string | undefined,
  emit: string | undefined,
  output: string | undefined,
  files: File[],
) => async (t: ExecutionContext) => {
  const sourcePath = await setupTestCase(t, files)

  try {
    const entryPath = await compile(sourcePath, {})

    if (expectedError !== undefined) t.fail('Did not encounter expected error')

    if (emit !== undefined) handleEmit(t, entryPath, emit)
    handleOutput(t, entryPath, output, runtimeError)
  } catch (error) {
    if (error instanceof Error) handleError(t, error, expectedError)
  }
}

export const run = async (test: TestInterface, testCases: TestCase[]) =>
  testCases.forEach(({ name, error, runtimeError, emit, output, files }) => {
    test.serial(name, handleTestCase(error, runtimeError, emit, output, files))
  })
