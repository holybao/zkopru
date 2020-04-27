/* eslint-disable jest/no-hooks */
import { nSQL, InanoSQLInstance } from '@nano-sql/core'
import Web3 from 'web3'
import { WebsocketProvider } from 'web3-core'
import { Docker } from 'node-docker-api'
import { Container } from 'node-docker-api/lib/container'
import { FullNode } from '~core'
import { schema } from '~database'
import { Coordinator } from '~coordinator'
import { ZkAccount } from '~account'
import { keys } from '~testnet'
import { sleep } from '~testnet/utils'

describe('coordinator test to run testnet', () => {
  const testName = 'coordinatortest'
  const address = '0xaD888d0Ade988EbEe74B8D4F39BF29a8d0fe8A8D'
  const accounts: ZkAccount[] = [new ZkAccount(Buffer.from(keys.alicePrivKey))]
  let container: Container
  let fullNode: FullNode
  let wsProvider: WebsocketProvider
  let db: InanoSQLInstance
  let coordinator: Coordinator
  beforeAll(async () => {
    const docker = new Docker({ socketPath: '/var/run/docker.sock' })
    try {
      container = await docker.container.create({
        Image: 'zkopru:contract',
        name: testName,
        rm: true,
      })
    } catch {
      container = docker.container.get(testName)
    }
    await container.start()
    const status = await container.status()
    const containerIP = (status.data as {
      NetworkSettings: { IPAddress: string }
    }).NetworkSettings.IPAddress
    await sleep(2000)
    wsProvider = new Web3.providers.WebsocketProvider(
      `ws://${containerIP}:5000`,
    )
    async function waitConnection() {
      return new Promise<void>(res => {
        if (wsProvider.connected) res()
        wsProvider.on('connect', res)
      })
    }
    await waitConnection()
    const dbName = 'zkopruFullNodeTester'
    await nSQL().createDatabase({
      id: dbName,
      mode: 'TEMP',
      tables: [
        schema.utxo,
        schema.utxoTree,
        schema.withdrawal,
        schema.withdrawalTree,
        schema.nullifiers,
        schema.nullifierTreeNode,
        schema.migration,
        schema.deposit,
        schema.massDeposit,
        schema.chain,
        schema.keystore,
        schema.hdWallet,
      ],
      version: 3,
    })
    db = nSQL().useDatabase(dbName)
    fullNode = await FullNode.new({
      provider: wsProvider,
      address,
      db,
      accounts,
      option: {
        header: true,
        deposit: true,
        migration: true,
        outputRollUp: true,
        withdrawalRollUp: true,
        nullifierRollUp: true, // Only for FULL NODE
        snark: true,
      },
    })
  }, 10000)
  afterAll(async () => {
    await container.kill()
    wsProvider.disconnect(0, 'close connection')
  }, 20000)
  describe('coordinator', () => {
    it('should be defined', async () => {
      coordinator = new Coordinator(fullNode, {
        maxBytes: 131072,
        bootstrapNode: true,
        priceMultiplier: 48, // 32 gas is the current default price for 1 byte
        db,
        apiPort: 8888,
      })
      expect(coordinator).toBeDefined()
    })
  })
})