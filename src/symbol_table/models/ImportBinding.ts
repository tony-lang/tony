import { Binding } from './Binding'

export interface ImportBinding extends Binding {
  filePath: string
  originalName: string
}
