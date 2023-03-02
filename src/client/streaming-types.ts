export interface SubscribeInput {
    channel: string
    replayId?: number | 'all' | undefined
    timeout: number
    supportedTransportTypes?: [string, ...string[]]
}

export interface SubscribePlatformEventInput extends Omit<SubscribeInput, 'channel'> {
    eventType: string
}
