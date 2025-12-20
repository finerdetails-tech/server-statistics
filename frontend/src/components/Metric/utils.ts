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

export const aggregateMetrics = (
  metrics: MetricData[],
  bucketSize: number
): MetricData[] => {
  const buckets: MetricData[] = []

  for (let i = 0; i < metrics.length; i += bucketSize) {
    const bucket = metrics.slice(i, i + bucketSize)
    const avgValue = bucket.reduce((sum, m) => sum + m.Value, 0) / bucket.length
    const midTimestamp = bucket[Math.floor(bucket.length / 2)].TimeStamp

    buckets.push({
      TimeStamp: midTimestamp,
      Value: avgValue
    })
  }

  return buckets
}

export const removeUntilConditionIsNoLongerMet = (
  array: any[],
  condition: (item: any) => boolean
) => {
  let startIndex = 0

  while (startIndex < array.length && condition(array[startIndex])) {
    startIndex++
  }

  return array.slice(startIndex)
}