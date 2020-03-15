#!/usr/bin/env node

import commander from 'commander'

import { VERSION } from './version'
import Tony from './Tony'

const tony = new Tony()

commander
  .version(`Tony ${VERSION}`, '-v, --version')
  .option('-d, --debug', 'enable debug mode', false)

commander
  .command('init [project]')
  .description('Initialize a project')
  .action(tony.init)

commander
  .command('run [project] [args...]')
  .description('Run a project')
  .option(
    '-m, --mode <mode>',
    'enable production optimizations or development hints\n' +
      '[choices: "development", "production", "none"]',
    'production'
  )
  .option('-o, --out-file <path>', 'output file')
  .option('--out-dir <path>', 'location for build files', '.tony')
  .option('--retain-out-dir', 'retain temporarily generated build files', false)
  .action(tony.run)

commander
  .command('compile [project]')
  .description('Compile a project to JavaScript')
  .option(
    '-m, --mode <mode>',
    'enable production optimizations or development hints\n' +
      '[choices: "development", "production", "none"]',
    'production'
  )
  .option('-o, --out-file <path>', 'output file')
  .option('--out-dir <path>', 'location for build files', '.tony')
  .option('--retain-out-dir', 'retain temporarily generated build files', false)
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
  .command('shell [projects...]', { isDefault: true })
  .description('Start a shell session')
  .action(tony.repl)

commander
  .parse(process.argv)

if (commander.debug) tony.enableDebugMode()
