import { replayExtension } from './replay.js'

import { alphaNumeric, forAll, integer, record, tuple, unknown } from '@skyleague/axioms'
import { describe, expect, it, vi } from 'vitest'

describe('incoming', () => {
    it.each([true, false])(
        'checks the handshake message to see if the server supports the extension, server enabled: %s',
        (enabled) => {
            const extension = replayExtension({})
            expect(extension.enabled).toBe(false)
            const message = {
                channel: '/meta/handshake',
                ext: { replay: enabled },
            }
            expect(extension.incoming(message)).toEqual(message)
            expect(extension.enabled).toBe(enabled)
        },
    )

    it('ignores messages on channels other than the handshake', () => {
        forAll(alphaNumeric({ minLength: 1 }), (channel) => {
            const extension = replayExtension({})
            const ext = vi.fn(() => ({}))

            const message = {
                channel,
                get ext() {
                    return ext()
                },
            }
            expect(extension.incoming(message)).toEqual(message)
            expect(ext).not.toHaveBeenCalled()
        })
    })
})

describe('outgoing', () => {
    it('adds the replay ID for known channels, if the server supports replay', () => {
        forAll(tuple(record(integer({ min: 1 })), unknown()), ([replayIds, data]) => {
            const extension = replayExtension(replayIds)
            extension.incoming({ channel: '/meta/handshake', ext: { replay: true } })

            const message = { channel: '/meta/subscribe', data }
            expect(extension.outgoing(message)).toEqual({ ...message, ext: { replay: replayIds } })
        })
    })
    it("doesn't add the replay ID for known channels, if the server doesn't support replay", () => {
        forAll(tuple(record(integer({ min: 1 })), unknown()), ([replayIds, data]) => {
            const extension = replayExtension(replayIds)
            extension.incoming({ channel: '/meta/handshake' })

            const message = { channel: '/meta/subscribe', data }
            expect(extension.outgoing(message)).toEqual(message)
        })
    })
    it('ignores messages on channels other than the subscribe', () => {
        forAll(alphaNumeric({ minLength: 1 }), (channel) => {
            const extension = replayExtension({})
            extension.incoming({ channel: '/meta/handshake', ext: { replay: true } })

            const message = { channel }
            expect(extension.incoming(message)).toEqual(message)
        })
    })
})
