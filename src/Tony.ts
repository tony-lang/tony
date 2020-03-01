import path from 'path'

import parser from './parser'
import {
  readFile,
  getWorkingDirectoryName,
  getOutputFileName
} from './utilities'
import { compile } from './compile'
import { exec } from './exec'

export default class Tony {
  debug = false

  enableDebugMode = (): void => {
    this.debug = true
    console.log('Running Tony in debug mode...')
  }

  init = (project: string): void => {
    console.log('The init command has not been implemented yet.')
    process.exit(1)
  }

  run = (
    project: string,
    args: string[],
    { mode, outFile, outDir, retainOutDir }: {
      mode: string;
      outFile: string;
      outDir: string;
      retainOutDir: boolean;
    }
  ): void => {
    if (project === undefined) project = getWorkingDirectoryName()

    compile(
      this, project, mode, outFile || getOutputFileName(project), outDir, retainOutDir
    ).then((outputPath: string) => {
      exec(this, outputPath, args)
    })
  }

  compile = (
    project: string,
    { mode, outFile, outDir, retainOutDir }: {
      mode: string;
      outFile: string;
      outDir: string;
      retainOutDir: boolean;
    }
  ): void => {
    if (project === undefined) project = getWorkingDirectoryName()

    compile(
      this, project, mode, outFile || getOutputFileName(project), outDir, retainOutDir
    ).then((outputPath: string) => {
      console.log('Compilation was successful! Your built project can be ' +
                  `found here: ${outputPath}`)
    })
  }

  exec = (
    file: string,
    args: string[]
  ): void => {
    exec(this, path.join(process.cwd(), file), args)
  }

  parse = (file: string): void => {
    readFile(path.join(process.cwd(), file)).then((sourceCode: string) => {
      const tree = parser.parse(sourceCode)
      console.log(tree.rootNode.toString())
    })
  }

  repl = (projects: string[] = []): void => {
    console.log('The shell has not been implemented yet.')
    process.exit(1)
  }
}
