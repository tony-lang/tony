import test from 'ava'
import fs from 'fs'
import path from 'path'
import childProcess from 'child_process'

const ERROR_PREFIX = Object.freeze('ERROR: ')
const EXAMPLES_DIR_PATH =
  Object.freeze(path.join(__dirname, '..', 'test', 'examples'))

type Example = { name: string; source: string; expectedOutput: string }
type ExampleSet = { name: string; beforeSource: string; examples: Example[] }

const parseExamples = (dir: string): ExampleSet[] => {
  return fs.readdirSync(dir)
    .map(file => [file, fs.readFileSync(path.join(dir, file)).toString()])
    .map(([file, fileContent]) => parseExampleFile(file, fileContent))
}

const parseExampleFile = (name: string, fileContent: string): ExampleSet => {
  const [beforeSource, ...rawExamples] = fileContent.split('==================')
  const examples = rawExamples
    .map(example => example.split('---'))
    .reduce((acc, value, i) => {
      if (i % 2 == 0) {
        return [...acc, value]
      } else {
        const prev = acc.pop()
        return [...acc, prev.concat(value)]
      }
    }, [[]])
    .slice(1)
    .map(([name, source, expectedOutput]) => ({
      name: name.trim(),
      source: source.trim(),
      expectedOutput: expectedOutput.trim()
    }))

  return { name, beforeSource: beforeSource.trim(), examples }
}

const runExample = (fileName: string, source: string): string => {
  const sourcePath = path.join(__dirname, 'examples', fileName)

  fs.writeFileSync(sourcePath, source)

  const result =
    childProcess.spawnSync('node', ['lib/index.js', 'run', sourcePath])
  return result.stdout.toString() || result.stderr.toString()
}

const exampleSets = parseExamples(EXAMPLES_DIR_PATH)

exampleSets.forEach(({ name: fileName, beforeSource, examples }) => {
  examples.forEach(({ name, source, expectedOutput }) => {
    const [testCase, outputFileName] = name.split('@')
    test(`${fileName}/${testCase}`, t => {
      const output = runExample(
        outputFileName || 'tmp.tn',
        `${beforeSource}\n${source}`
      ).trim()

      if (expectedOutput.startsWith(ERROR_PREFIX) &&
          output.includes(expectedOutput.substring(ERROR_PREFIX.length)))
        t.pass(name)
      else t.is(output, expectedOutput)
    })
  })
})
