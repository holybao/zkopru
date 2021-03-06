/* eslint-disable jest/no-hooks */
import Web3 from 'web3'
import { Docker } from 'node-docker-api'
import { WebsocketProvider } from 'web3-core'
import { Container } from 'node-docker-api/lib/container'
import { MockupDB, DB } from '@zkopru/prisma'
import { ZkAccount } from '~account'
import { sleep, readFromContainer } from '~utils'
import { FullNode } from '~core'

describe('integration test to run testnet', () => {
  const testName = 'fullnodetest'
  let address: string
  let container: Container
  let fullNode: FullNode
  let wsProvider: WebsocketProvider
  let mockup: MockupDB
  beforeAll(async () => {
    mockup = await DB.mockup()
    const docker = new Docker({ socketPath: '/var/run/docker.sock' })
    try {
      container = await docker.container.create({
        Image: 'wanseob/zkopru-contract:0.0.1',
        name: testName,
        rm: true,
      })
    } catch {
      container = docker.container.get(testName)
    }
    await container.start()
    const deployed = await readFromContainer(
      container,
      '/proj/build/deployed/ZkOptimisticRollUp.json',
    )
    address = JSON.parse(deployed.toString()).address
    const status = await container.status()
    const containerIP = (status.data as {
      NetworkSettings: { IPAddress: string }
    }).NetworkSettings.IPAddress
    await sleep(2000)
    wsProvider = new Web3.providers.WebsocketProvider(
      `ws://${containerIP}:5000`,
      { reconnect: { auto: true } },
    )
    async function waitConnection() {
      return new Promise<void>(res => {
        if (wsProvider.connected) res()
        wsProvider.on('connect', res)
      })
    }
    await waitConnection()
  }, 60000)
  afterAll(async () => {
    await container.stop()
    await container.delete()
    await mockup.terminate()
    wsProvider.disconnect(0, 'close connection')
  }, 20000)
  describe('full node', () => {
    it('should be defined', async () => {
      const accounts: ZkAccount[] = [
        new ZkAccount(Buffer.from('sample private key')),
      ]
      fullNode = await FullNode.new({
        provider: wsProvider,
        address,
        db: mockup.db,
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
      expect(fullNode).toBeDefined()
    }, 60000)
  })
})
