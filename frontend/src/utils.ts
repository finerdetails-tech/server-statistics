import type { MetricData, ScrollPercent } from 'types'

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
  metrics: MetricData[]
): MetricData[] => {
  const VISIBLE_METRICS_SENDING_INTERVAL_SECONDS: number = Number(import.meta.env.VISIBLE_METRICS_SENDING_INTERVAL_SECONDS) || 30
  const metricsLength = metrics.length
  const metricsTimeSpanSeconds = metricsLength * VISIBLE_METRICS_SENDING_INTERVAL_SECONDS
  const a = 2.44 * Math.pow(10, -10)
  const b = 6.26 * Math.pow(10, -5)
  const c = 0.773
  /*
  formula matches the following points:
  (1 hour, 1 bucket)
  (1 day, 8 buckets)
  (1 week, 128 buckets)
  capped at min 1 and max 256 buckets
  */
  const formula = (x: number) => a * Math.pow(x, 2) + b * x + c
  const bucketSize = Math.ceil(Math.min(formula(metricsTimeSpanSeconds), 256))


  const buckets: MetricData[] = []

  for (let i = 0; i < metricsLength; i += bucketSize) {
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


export const elementScrollToPercent = (element: HTMLElement): ScrollPercent => {
  const maxScrollLeft = element.scrollWidth - element.clientWidth
  const maxScrollTop = element.scrollHeight - element.clientHeight

  return {
    verticalPercent: element.scrollTop / maxScrollTop,
    horizontalPercent: element.scrollLeft / maxScrollLeft
  }
}