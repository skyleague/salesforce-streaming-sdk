import { defaultStreamingApiPath, defaultSupportedTransportTypes } from './constants'
import type { CreateObservableInput } from './observable-types'

import { replayExtension } from '../extensions'

import { evaluate, mapValues, omitUndefined, memoize, defer } from '@skyleague/axioms'
import type { Message, SubscriptionHandle } from 'cometd'
import { CometD } from 'cometd'

// eslint-disable-next-line @typescript-eslint/consistent-type-imports, @typescript-eslint/no-var-requires
const applyAdapter = memoize(() => (require('cometd-nodejs-client') as typeof import('cometd-nodejs-client')).adapt())

export class SalesforceStreamingObservable {
    public readonly client: CometD
    public readonly subscriptions: Record<string, SubscriptionHandle>

    private constructor(enableAdapter: boolean) {
        if (enableAdapter) {
            applyAdapter()
        }
        this.client = new CometD()
        this.subscriptions = {}
    }
    public static async create({
        baseUrl,
        streamingApiPath = defaultStreamingApiPath,
        bearer,
        enableAdapter = true,
        replayIds = {},
        supportedTransportTypes = defaultSupportedTransportTypes,
    }: CreateObservableInput): Promise<SalesforceStreamingObservable> {
        const instance = new SalesforceStreamingObservable(enableAdapter)
        instance.client.configure({
            url: [baseUrl, streamingApiPath]
                .join('/')
                // remove duplicate slashes
                .replace(/[/]+/g, '/')
                // add double slash after http(s)
                .replace(/^(.+):\//, '$1://'),
            appendMessageTypeToURL: false,
            requestHeaders:
                bearer !== undefined
                    ? {
                          Authorization: await evaluate(bearer),
                      }
                    : {},
        })
        for (const transport of instance.client.getTransportTypes()) {
            if (!supportedTransportTypes.includes(transport)) {
                instance.client.unregisterTransport(transport)
            }
        }

        replayIds = omitUndefined(replayIds ?? {})
        if (Object.keys(replayIds).length > 0) {
            instance.client.registerExtension('replay', replayExtension(mapValues(replayIds, (v) => (v === 'all' ? -2 : v!))))
        }

        return instance
    }

    public async connect() {
        try {
            const handshake = defer<Message, Message>()
            this.client.handshake((message) => {
                if (message.successful) {
                    handshake.resolve(message)
                } else {
                    handshake.reject(message)
                }
            })
            return await handshake
        } catch (err) {
            this.client.disconnect()
            throw err
        }
    }

    public disconnect() {
        this.client.disconnect()
    }

    public async subscribe(channel: string, cb: (message: Message) => void) {
        if (this.subscriptions[channel] !== undefined) {
            throw new Error(`Channel already has a subscription (channel: ${channel})`)
        }
        const subscribed = defer<Message, Message>()
        const handle = this.client.subscribe(
            channel,
            (message) => cb(message),
            (message) => {
                if (message.successful) {
                    subscribed.resolve(message)
                } else {
                    subscribed.reject(message)
                }
            }
        )
        await subscribed
        this.subscriptions[channel] = handle

        return subscribed
    }

    public async unsubscribe(channel: string) {
        if (this.subscriptions[channel] === undefined) {
            throw new Error(`Channel has no subscription (channel: ${channel})`)
        }
        const unsubscribed = defer<Message, Message>()
        this.client.unsubscribe(this.subscriptions[channel], (message) => {
            if (message.successful) {
                unsubscribed.resolve(message)
            } else {
                unsubscribed.reject(message)
            }
        })
        return await unsubscribed
    }
}
