import { ImportBinding } from './ImportBinding'

export type Import = {
  fullPath: string;
  relativePath: string;
  bindings: ImportBinding[];
  isExternal: boolean;
}
