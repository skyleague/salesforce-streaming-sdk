import type { SetRequired } from '@skyleague/axioms/types'
import type { Extension } from 'cometd'

export function replayExtension(
    replayIds: Record<string, number>,
): SetRequired<Extension, 'incoming' | 'outgoing'> & { readonly enabled: boolean } {
    let enabled = false
    return {
        get enabled() {
            return enabled
        },
        incoming: (message) => {
            if (message.channel === '/meta/handshake') {
                const { ext = {} } = message
                enabled = 'replay' in ext && ext.replay === true
            }
            return message
        },
        outgoing: (message) => {
            if (message.channel === '/meta/subscribe' && enabled) {
                return {
                    ...message,
                    ext: { ...message.ext, replay: replayIds },
                }
            }
            return message
        },
    }
}
