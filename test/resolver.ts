import fs from 'fs'
import path from 'path'
import { isNotUndefined } from '../src/utilities'
import { TEST_DIR_PATH } from './constants'
import { parseTestCase } from './parser'
import { TestCase } from './types'

const selectDirectories = (file: string) => fs.statSync(path.join(TEST_DIR_PATH, file)).isDirectory()

const collectFiles = (files: string[], directory: string) => [...files, ...fs
  .readdirSync(path.join(TEST_DIR_PATH, directory))
  .map((file) => path.join(directory, file))]

const parse = (file: string) => parseTestCase(file, fs.readFileSync(path.join(TEST_DIR_PATH, file)).toString())

export const resolve = (): TestCase[] => fs
  .readdirSync(TEST_DIR_PATH)
  .filter(selectDirectories)
  .reduce(collectFiles, [])
  .map(parse)
  .filter(isNotUndefined)
