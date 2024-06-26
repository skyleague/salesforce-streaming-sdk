import { $number, $object, $string, $unknown } from '@skyleague/therefore'

export const salesforceMessage = $object({
    data: $object({
        schema: $string().optional(),
        payload: $unknown(),
        event: $object({
            EventUuid: $string(),
            replayId: $number(),
            EventApiName: $string(),
        }),
    }),
    channel: $string().optional(),
}).validator()
