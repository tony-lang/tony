import fs from 'fs'
import path from 'path'

export const TEST_DIR_PATH = Object.freeze(path.join(__dirname, '..', '..', 'test', 'cases'))
export const TEST_EMITS_PATH = Object.freeze(path.join(__dirname, '..', '..', 'test', 'emits'))
export const TEST_OUT_DIR_PATH = Object.freeze(
  path.join(__dirname, '..', '..', 'dist', 'test'),
)

export const STDLIB = fs.readFileSync(path.join(TEST_DIR_PATH, '..', 'tmp', 'stdlib.tn')).toString()
