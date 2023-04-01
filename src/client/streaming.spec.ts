import { SalesforceMessage, SalesforceStreaming, SalesforceStreamingObservable } from '../index.js'

import { array, asyncForAll, sleep } from '@skyleague/axioms'
import { arbitrary } from '@skyleague/therefore'

test('yields all the items', async () => {
    await asyncForAll(
        array(
            arbitrary(SalesforceMessage).map((e) => ({ ...e, channel: '/event/myEvent' })),
            { maxLength: 20 }
        ),
        async (messages) => {
            jest.spyOn(SalesforceStreamingObservable.prototype, 'connect').mockResolvedValue(undefined as any)
            const subscribeMock = jest.spyOn(SalesforceStreamingObservable.prototype, 'subscribe')
            jest.spyOn(SalesforceStreamingObservable.prototype, 'unsubscribe').mockResolvedValue(undefined as any)
            jest.spyOn(SalesforceStreamingObservable.prototype, 'disconnect').mockReturnValue()

            subscribeMock.mockImplementation(async (channel, cb) => {
                await sleep(5)
                for (const message of messages) {
                    cb({ ...message, channel })
                    await sleep(1)
                }
                return {} as never
            })

            const client = new SalesforceStreaming({
                baseUrl: 'https://localhost',
                bearer: () => '',
            })

            const results: SalesforceMessage[] = []

            for await (const message of client.subscribePlatformEvent({
                eventType: 'myEvent',
                timeout: 200,
            })) {
                results.push(message)
            }
            expect(results).toEqual(messages)
        },
        { tests: 5 }
    )
}, 120_000)
