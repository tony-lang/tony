import test from 'ava'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import childProcess from 'child_process'

import { compile } from '../src'
import { FILE_EXTENSION, TARGET_FILE_EXTENSION } from '../src/constants'

type Example = { name: string; source: string; expectedOutput: string }

const COMPILE_ERROR_PREFIX = Object.freeze('COMPILE_ERROR:')
const RUNTIME_ERROR_PREFIX = Object.freeze('RUNTIME_ERROR:')
const TEST_DIR_PATH = Object.freeze(path.join(__dirname, '..', '..', 'test'))
const TEST_OUT_DIR_PATH =
  Object.freeze(path.join(__dirname, '..', '..', 'dist', 'test'))
const STDLIB = fs.readFileSync(path.join(TEST_DIR_PATH, 'stdlib.tn')).toString()

const getTestFilePath = (file: string): string =>
  file.replace(FILE_EXTENSION, `.test${FILE_EXTENSION}`)

const findExamples = (): Example[] => {
  const examples = fs.readdirSync(TEST_DIR_PATH)
    .filter(file => fs.statSync(path.join(TEST_DIR_PATH, file)).isDirectory())
    .map(directory => {
      return fs.readdirSync(path.join(TEST_DIR_PATH, directory))
        .map(file => path.join(directory, file))
    })
    .reduce((acc, files) => acc.concat(files), [])
    .map(file => [
      file,
      fs.readFileSync(path.join(TEST_DIR_PATH, file)).toString()
    ])
    .reduce((acc, [file, content]) => {
      const [name, ext] = file.split('.')
      if (!['tn', 'txt'].includes(ext)) return acc

      acc[name] = {
        name,
        [ext === 'tn' ? 'source' : 'expectedOutput']: content,
        ...acc[name]
      }
      return acc
    }, {})

  return Object.values(examples)
}

const runExample = async (
  outputFile: string,
  source: string
): Promise<string> => {
  const sourcePath = path.join(TEST_OUT_DIR_PATH, getTestFilePath(outputFile))

  await mkdirp(path.dirname(sourcePath))
  fs.writeFileSync(sourcePath, source)

  try {
    await compile(sourcePath, {})
  } catch (error) {
    return error.message
  }

  const result = childProcess.spawnSync(
    'node',
    [sourcePath.replace(FILE_EXTENSION, TARGET_FILE_EXTENSION)]
  )
  return result.stdout.toString() || result.stderr.toString()
}

const runTests = async (examples: Example[]): Promise<void> => {
  examples.forEach(({ name, source, expectedOutput }) => {
    test.serial(name, async t => {
      // TODO: remove this check in error handling ticket, run concurrently
      if (expectedOutput.startsWith(COMPILE_ERROR_PREFIX)) {
        t.pass('Temporarily skip tests expecting compile errors.')
      } else {
        const output = await runExample(`${name}.tn`, `${STDLIB}\n${source}`)

        if (expectedOutput.startsWith(RUNTIME_ERROR_PREFIX) &&
            output.includes(expectedOutput.substring(RUNTIME_ERROR_PREFIX.length)
              .trim()))
          t.pass(name)
        else t.is(expectedOutput.trim(), output.trim())
      }
    })
  })
}

runTests(findExamples())
