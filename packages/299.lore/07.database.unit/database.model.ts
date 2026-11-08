import type Database from './fce/database.interface.js'
import type DatabaseBit from './fce/database.bit.js'

export class DatabaseModel implements Database {
  idx: string = '07.database'
  databaseBitList: DatabaseBit[] = []
  databaseBits: Record<string, DatabaseBit> = {}
}
