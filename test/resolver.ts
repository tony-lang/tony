import { TEST_DIR_PATH } from './constants'
import { TestCase } from './types'
import fs from 'fs'
import { isNotUndefined } from '../src/utilities'
import { parseTestCase } from './parser'
import path from 'path'

const selectDirectories = (file: string) =>
  fs.statSync(path.join(TEST_DIR_PATH, file)).isDirectory()

const collectFiles = (files: string[], directory: string) => [
  ...files,
  ...fs
    .readdirSync(path.join(TEST_DIR_PATH, directory))
    .map((file) => path.join(directory, file)),
]

const parse = (file: string) =>
  parseTestCase(
    file,
    fs.readFileSync(path.join(TEST_DIR_PATH, file)).toString(),
  )

export const resolve = (): TestCase[] =>
  fs
    .readdirSync(TEST_DIR_PATH)
    .filter(selectDirectories)
    .reduce(collectFiles, [])
    .map(parse)
    .filter(isNotUndefined)
