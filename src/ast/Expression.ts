import { Abstraction } from './Abstraction'
import { Access } from './Access'
import { Application } from './Application'
import { Assignment } from './Assignment'
import { Case } from './Case'
import { Export } from './Export'
import { Identifier } from './Identifier'
import { If } from './If'
import { Import } from './Import'
import { InfixApplication } from './InfixApplication'
import { List } from './List'
import { ListComprehension } from './ListComprehension'
import { Literal } from './Literal'
import { Map } from './Map'
import { Module } from './Module'
import { Pipeline } from './Pipeline'
import { PrefixApplication } from './PrefixApplication'
import { Return } from './Return'
import { Tuple } from './Tuple'

export type Expression =
  | Abstraction
  | Access
  | Application
  | Assignment
  | Case
  | Export
  | Identifier
  | If
  | Import
  | InfixApplication
  | List
  | ListComprehension
  | Literal
  | Map
  | Module
  | Pipeline
  | PrefixApplication
  | Return
  | Tuple
