import test from 'ava'
import fs from 'fs'
import mkdirp from 'mkdirp'
import path from 'path'
import childProcess from 'child_process'

type Example = { name: string; source: string; expectedOutput: string }

const ERROR_PREFIX = Object.freeze('ERROR:')
const TEST_DIR_PATH = Object.freeze(path.join(__dirname, '..', 'test'))
const TEST_OUT_DIR_PATH = Object.freeze(path.join(__dirname, 'tmp'))
const STDLIB = fs.readFileSync(path.join(TEST_DIR_PATH, 'stdlib.tn'))

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
  const sourcePath = path.join(TEST_OUT_DIR_PATH, outputFile)

  await mkdirp(path.dirname(sourcePath))
  fs.writeFileSync(sourcePath, source)

  const result =
    childProcess.spawnSync('node', ['lib/index.js', 'run', sourcePath])
  return result.stdout.toString() || result.stderr.toString()
}

const runTests = async (examples: Example[]): Promise<void> => {
  examples.forEach(({ name, source, expectedOutput }) => {
    test(name, async t => {
      const output = await runExample(`${name}.tn`, `${STDLIB}\n${source}`)

      if (expectedOutput.startsWith(ERROR_PREFIX) &&
          output.includes(expectedOutput.substring(ERROR_PREFIX.length).trim()))
        t.pass(name)
      else t.is(expectedOutput.trim(), output.trim())
    })
  })
}

runTests(findExamples())
