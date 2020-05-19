import {
  InanoSQLTableConfig,
  InanoSQLFKActions,
} from '@nano-sql/core/lib/interfaces'

export interface DepositSql {
  id?: string
  note: string
  fee: string
  queuedAt: string
  zkopru: string
  blockNumber: number
  l2Block?: string
}

export const deposit: InanoSQLTableConfig = {
  name: 'deposit',
  model: {
    'id:uuid': { pk: true },
    'note:string': {},
    'fee:string': {},
    'queuedAt:string': {},
    'zkopru:uuid': {},
    'blockNumber:int': {},
    'l2Block:string': {},
  },
  indexes: {
    'queuedAt:int': {
      foreignKey: {
        target: 'massDeposit.index',
        onDelete: InanoSQLFKActions.CASCADE,
      },
    },
    'zkopru:uuid': {
      foreignKey: {
        target: 'zkopru.id',
        onDelete: InanoSQLFKActions.CASCADE,
      },
    },
  },
  queries: [
    {
      name: 'getSyncStart',
      args: { 'zkopru:uuid': {} },
      call: (db, args) => {
        return db
          .query('select', ['MAX(blockNumber)'])
          .where(['zkopru', '=', args.zkopru])
          .emit()
      },
    },
    {
      name: 'writeNewDeposit',
      args: { 'deposit:object': {} },
      call: (db, args) => {
        return db.query('upsert', [args.deposit as DepositSql]).emit()
      },
    },
    {
      name: 'getDeposits',
      args: {
        'commitIndex:string': {},
        'zkopru:uuid': {},
      },
      call: (db, args) => {
        return db
          .query('select')
          .where([
            ['queuedAt', '=', args.commitIndex],
            'AND',
            ['zkopru', '=', args.zkopru],
          ])
          .emit()
      },
    },
  ],
}
