import { SalesforceMessage } from './salesforce-message.type.js'

import type { Message } from 'cometd'

export function validateSalesforceMessage(message: Message): SalesforceMessage {
    if (SalesforceMessage.is(message)) {
        return message
    } else {
        const err = new Error(SalesforceMessage.errors?.[0]?.message ?? 'Failed to validate the message as a SalesforceMessage')
        err.cause = SalesforceMessage.errors
        throw err
    }
}
