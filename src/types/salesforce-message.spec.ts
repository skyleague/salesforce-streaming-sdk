import { SalesforceMessage } from './salesforce-message.type.js'

import type { Dependent } from '@skyleague/axioms'
import { alphaNumeric, constant, dict, forAll, integer, object, unknown } from '@skyleague/axioms'
import type { Message } from 'cometd'

test('validation', () => {
    forAll(
        alphaNumeric({ minLength: 1 })
            .map((e) => `${e}__e`)
            .chain(
                (eventType): Dependent<Message> =>
                    object({
                        data: object({
                            schema: alphaNumeric({ minLength: 1 }),
                            payload: dict(unknown()),
                            event: object({
                                EventUuid: alphaNumeric({ minLength: 1 }),
                                replayId: integer({ min: 1 }),
                                EventApiName: constant(eventType),
                                // Doesn't actually exist, just testing the validation to be lenient
                                meta: unknown(),
                            }),
                            // Doesn't actually exist, just testing the validation to be lenient
                            meta: unknown(),
                        }),
                        channel: constant(`/event/${eventType}`),
                        // Doesn't actually exist, just testing the validation to be lenient
                        meta: unknown(),
                    })
            ),
        (message: Message) => {
            expect(SalesforceMessage.is(message)).toBe(true)
        }
    )
})
