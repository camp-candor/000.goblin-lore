import type DatabaseBit from './database.bit.js'

export default interface Database {
  idx: string
  databaseBitList: DatabaseBit[]
  databaseBits: Record<string, DatabaseBit>
}
