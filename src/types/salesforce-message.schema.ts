import { $number, $object, $optional, $string, $unknown, $validator } from '@skyleague/therefore'

export const salesforceMessage = $validator(
    $object({
        data: $object({
            schema: $optional($string),
            payload: $unknown(),
            event: $object({
                EventUuid: $string(),
                replayId: $number(),
                EventApiName: $string(),
            }),
        }),
        channel: $optional($string),
    })
)
