import type NetBit from './net.bit.js'

export interface PromptSeriesNameOptions {
    readonly defaultName?: string
    readonly label?: string
    readonly customGridNet?: NetBit
}

export interface PromptSeriesNameResult {
    readonly rawName: string
    readonly cancelled: boolean
    readonly isHeadless: boolean
}
