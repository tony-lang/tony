import { CompileError, Context } from '../CompileError'

export class UnsupportedSyntaxError extends CompileError {
  constructor(context: Context, message: string) {
    super(context, message)
    this.name = this.constructor.name
  }
}
