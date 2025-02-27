import { evaluate, mapValues, memoize, omitUndefined } from '@skyleague/axioms'
import type { Message, SubscriptionHandle } from 'cometd'
import { CometD } from 'cometd'
import { adapt } from 'cometd-nodejs-client'
import { replayExtension } from '../extensions/index.js'
import { defaultStreamingApiPath, defaultSupportedTransportTypes } from './constants.js'
import type { CreateObservableInput } from './observable-types.js'

const applyAdapter = memoize(() => adapt())

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
            // biome-ignore lint/style/noNonNullAssertion: mapValues doesn't return undefined
            instance.client.registerExtension('replay', replayExtension(mapValues(replayIds, (v) => (v === 'all' ? -2 : v!))))
        }

        return instance
    }

    public async connect() {
        try {
            const { promise, resolve, reject } = Promise.withResolvers<Message>()
            this.client.handshake((message) => {
                if (message.successful) {
                    resolve(message)
                } else {
                    reject(message)
                }
            })
            return await promise
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
        const { promise, resolve, reject } = Promise.withResolvers<Message>()
        const handle = this.client.subscribe(
            channel,
            (message) => cb(message),
            (message) => {
                if (message.successful) {
                    resolve(message)
                } else {
                    reject(message)
                }
            },
        )
        await promise
        this.subscriptions[channel] = handle

        return promise
    }

    public async unsubscribe(channel: string) {
        if (this.subscriptions[channel] === undefined) {
            throw new Error(`Channel has no subscription (channel: ${channel})`)
        }
        const { promise, resolve, reject } = Promise.withResolvers<Message>()
        // biome-ignore lint/style/noNonNullAssertion: this channel has a subscription
        this.client.unsubscribe(this.subscriptions[channel]!, (message) => {
            if (message.successful) {
                resolve(message)
            } else {
                reject(message)
            }
        })
        return await promise
    }
}
