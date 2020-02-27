#!/usr/bin/env node

import commander from 'commander'

import { VERSION } from './version'
import Tony from './Tony'

const tony = new Tony()

commander
  .version(`Tony ${VERSION}`, '-v, --version')
  .option('-d, --debug', 'enable debug mode')
  .arguments('[projects...]')
  .description('Start a read-eval-print loop')
  .action(tony.repl)

commander
  .command('init [project]')
  .description('Initialize a project')
  .action(tony.init)

commander
  .command('run [project] [args...]')
  .description('Run a project')
  .option('-o, --out-file <path>', 'directory for build files')
  .option('--out-dir <path>', 'directory for build files', 'tmp')
  .action(tony.run)

commander
  .command('compile [project]')
  .description('Compile a project to JavaScript')
  .option('-o, --out-file <path>', 'location for build files')
  .option('--out-dir <path>', 'location for build files', 'tmp')
  .action(tony.compile)

commander
  .command('exec <file> [args...]')
  .description('Execute compiled source of a project')
  .action(tony.exec)

commander
  .command('parse <file>')
  .description('Print the abstract syntax tree of a file')
  .action(tony.parse)

commander
  .parse(process.argv)

if (commander.debug) tony.enableDebugMode()
if (commander.args.length === 0) tony.repl()
