/* Generated by ts-generator ver. 0.0.8 */
/* tslint:disable */

import BN from 'bn.js'
import { Contract, ContractOptions } from 'web3-eth-contract'
import { EventLog } from 'web3-core'
import { EventEmitter } from 'events'
import { ContractEvent, Callback, TransactionObject, BlockType } from './types'

interface EventOptions {
  filter?: object
  fromBlock?: BlockType
  topics?: string[]
}

export class IMigrationChallenge extends Contract {
  constructor(jsonInterface: any[], address?: string, options?: ContractOptions)
  clone(): IMigrationChallenge
  methods: {
    challengeMassMigrationToMassDeposit(
      destination: string,
      submission: string | number[],
    ): TransactionObject<void>

    challengeERC20Migration(
      destination: string,
      erc20: string,
      submission: string | number[],
    ): TransactionObject<void>

    challengeERC721Migration(
      destination: string,
      erc721: string,
      tokenId: number | string,
      submission: string | number[],
    ): TransactionObject<void>
  }
  events: {
    allEvents: (options?: EventOptions, cb?: Callback<EventLog>) => EventEmitter
  }
}
