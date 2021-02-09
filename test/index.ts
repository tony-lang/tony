import { resolve } from './resolver'
import { run } from './runner'
import test from 'ava'

const cases = resolve()

run(test, cases)
