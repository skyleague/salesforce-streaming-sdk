import { SalesforceStreamingObservable } from './index.js'

import { json, random, sleep } from '@skyleague/axioms'
import { expect, beforeAll, afterEach, afterAll, it, vi } from 'vitest'

import http from 'node:http'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
const cometServer = (require('cometd-nodejs-server') as typeof import('cometd-nodejs-server')).createCometDServer()
const server = http.createServer(cometServer.handle)

beforeAll(
    () =>
        new Promise((done) => {
            server.listen(12345, 'localhost', done)
        })
)

afterAll(() => {
    cometServer.close()
    server.close()
}, 60_000)

let client: SalesforceStreamingObservable
afterEach(() => {
    client.client.clearListeners()
    client.client.clearSubscriptions()
    client.disconnect()
})

it('is able to connect', async () => {
    const channel = '/event/foo__e'
    const serverChannel = cometServer.createServerChannel(channel)
    const session = cometServer.getServerSession(channel)

    client = await SalesforceStreamingObservable.create({
        baseUrl: 'http://localhost:12345',
        streamingApiPath: '/',
        bearer: undefined,
    })
    await client.connect()

    const onMessage = vi.fn()
    await client.subscribe(channel, onMessage)

    const data = random(json({ type: 'object' }))
    serverChannel.publish(session, data)
    await sleep(50)

    await client.unsubscribe(channel)

    expect(onMessage).toHaveBeenCalledWith({ channel, data })
})
