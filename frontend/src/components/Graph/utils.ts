import type { MetricData } from 'types'

export const getDate = (metric: MetricData) => {
    const timeStampInMs = metric?.TimeStamp * 1000
    return new Date(timeStampInMs)
}
export const getMetricValue = (metric: MetricData) => metric?.Value