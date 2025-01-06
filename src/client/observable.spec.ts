import http from 'node:http'
import { json, random, sleep } from '@skyleague/axioms'
import { createCometDServer } from 'cometd-nodejs-server'
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest'
import { SalesforceStreamingObservable } from './index.js'

const cometServer = createCometDServer()
const httpServer = http.createServer((request, response) => cometServer.handle(request, response))

beforeAll(
    () =>
        new Promise((done) => {
            httpServer.listen(12345, 'localhost', 0, () => done(0))
        }),
)

afterAll(() => {
    cometServer.close()
    httpServer.close()
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
