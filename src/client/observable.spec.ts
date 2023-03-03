/* eslint-disable @typescript-eslint/no-unsafe-call */

import { SalesforceStreamingObservable } from '.'

import { json, random, sleep } from '@skyleague/axioms'

import http from 'http'

const cometServer = require('cometd-nodejs-server').createCometDServer()
const server = http.createServer(cometServer.handle)
beforeAll((done) => {
    server.listen(12345, 'localhost', done)
})
afterAll((done) => {
    cometServer.close()
    server.close(done)
}, 60_000)

let client: SalesforceStreamingObservable
afterEach(() => {
    client.client.clearListeners()
    client.client.clearSubscriptions()
    client.disconnect()
})

test('is able to connect', async () => {
    const channel = '/event/foo__e'
    const serverChannel = cometServer.createServerChannel(channel)

    client = await SalesforceStreamingObservable.create({
        baseUrl: 'http://localhost:12345',
        streamingApiPath: '/',
        bearer: undefined,
    })
    await client.connect()

    const onMessage = jest.fn()
    await client.subscribe(channel, onMessage)

    const data = random(json({ type: 'object' }))
    serverChannel.publish(channel, data)
    await sleep(50)

    await client.unsubscribe(channel)

    expect(onMessage).toHaveBeenCalledWith({ channel, data })
})
