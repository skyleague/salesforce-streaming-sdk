import type { AsyncConstExpr } from '@skyleague/axioms'

export interface CreateObservableInput {
    baseUrl: string
    streamingApiPath: string
    bearer: AsyncConstExpr<string> | undefined
    enableAdapter?: boolean
    replayIds?: Record<string, number | 'all' | undefined>
    supportedTransportTypes?: [string, ...string[]]
}
