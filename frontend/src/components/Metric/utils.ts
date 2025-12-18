import type { MetricData } from 'types'

export const getDate = (metric: MetricData) => {
    const timeStampInMs = metric?.TimeStamp * 1000
    return new Date(timeStampInMs)
}
export const getMetricValue = (metric: MetricData) => metric?.Value

export const listCurrentAndParentElements = (element: HTMLElement | null): HTMLElement[] => {
    const parents: HTMLElement[] = [element]
    let current = element?.parentElement

    while (current) {
        parents.push(current)
        current = current.parentElement
    }

    return parents
}

export const remToPx = (rem: number): number => {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
    return rem * rootFontSize
}