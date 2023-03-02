import { defaultStreamingApiPath, defaultSupportedTransportTypes } from './constants'
import { SalesforceStreamingObservable } from './observable'
import type { SubscribeInput, SubscribePlatformEventInput } from './streaming-types'

import type { SalesforceMessage } from '../types'
import { validateSalesforceMessage } from '../types'

import { defer, omitUndefined, sleep } from '@skyleague/axioms'
import type { Message } from 'cometd'

export class SalesforceStreaming {
    public readonly baseUrl: string
    public readonly bearer: string | (() => Promise<string>) | (() => string)
    public readonly streamingApiPath: string
    private readonly enableAdapter: boolean

    public constructor({
        baseUrl,
        bearer,
        streamingApiPath = defaultStreamingApiPath,
        enableAdapter = true,
    }: {
        baseUrl: string
        bearer: string | (() => Promise<string>) | (() => string)
        streamingApiPath?: string
        enableAdapter?: boolean
    }) {
        this.baseUrl = baseUrl
        this.bearer = bearer
        this.streamingApiPath = streamingApiPath
        this.enableAdapter = enableAdapter
    }

    public async *subscribe({
        channel,
        replayId,
        timeout,
        supportedTransportTypes = defaultSupportedTransportTypes,
    }: SubscribeInput): AsyncGenerator<SalesforceMessage, void, undefined> {
        const streamingClient = await SalesforceStreamingObservable.create({
            baseUrl: this.baseUrl,
            streamingApiPath: this.streamingApiPath,
            bearer: this.bearer,
            replayIds: omitUndefined({ [channel]: replayId }),
            supportedTransportTypes,
            enableAdapter: this.enableAdapter,
        })
        await streamingClient.connect()

        try {
            let buffer: Message[] = []
            let waiter = defer<void>()
            let done = false

            await streamingClient.subscribe(channel, (message) => {
                buffer.push(message)
                waiter.resolve()
            })

            const unsubscribed = sleep(timeout).then(async () => {
                done = true
                waiter.resolve()
                await streamingClient.unsubscribe(channel)
            })

            while (!done) {
                await waiter
                waiter = defer<void>()

                const buff = buffer
                buffer = []

                yield* buff.map(validateSalesforceMessage)
            }

            await unsubscribed
            yield* buffer.map(validateSalesforceMessage)
        } finally {
            streamingClient.disconnect()
        }
    }

    public subscribePlatformEvent({
        eventType,
        ...options
    }: SubscribePlatformEventInput): AsyncGenerator<SalesforceMessage, void, undefined> {
        return this.subscribe({ ...options, channel: `/event/${eventType}` })
    }
}
