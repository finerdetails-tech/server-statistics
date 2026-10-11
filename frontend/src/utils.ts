import type {
  MetricData, ScrollPercent
} from 'types'

export const getDate = (metric: MetricData) => {
  const timeStampInMs = metric?.TimeStamp * 1000
  return new Date(timeStampInMs)
}
export const getMetricValue = (metric: MetricData) => metric?.Value

export const remToPx = (rem: number): number => {
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize)
  return rem * rootFontSize
}

export const downsampleMetrics = (metrics: MetricData[], graphWidth: number) => {
  if (metrics.length < 3) {
    return metrics
  }

  const PIXELS_PER_POINT = 5
  const evaluationStartTime = metrics[1].TimeStamp// Excluding the first point
  const evaluationEndTime = metrics[metrics.length - 2].TimeStamp // Excluding the last point

  const evaluationTimeInterval = evaluationEndTime - evaluationStartTime
  const totalPoints = Math.floor(graphWidth / PIXELS_PER_POINT)
  const pointsToEvaluate = totalPoints > 2
    ? totalPoints - 2 // Excluding the first and last points
    : totalPoints
  const timePerEvaluationPoint = evaluationTimeInterval / pointsToEvaluate


  const createBuckets = () => {
    let bucketIndex = 0
    const startPoint = metrics[0]
    const endPoint = metrics[metrics.length - 1]
    const buckets: MetricData[][] = []

    if (metrics.length < 3) {
      return [ [ startPoint ], [ endPoint ] ]
    }

    // Excluding the first and last points
    for (let i = 1; i < metrics.length - 1; i++) {
      const bucketStartTime = evaluationStartTime + (bucketIndex * timePerEvaluationPoint)
      const bucketEndTime = bucketStartTime + timePerEvaluationPoint

      const currentBucket = buckets[bucketIndex]
      if (!currentBucket) {
        buckets.push([])
      }
      buckets[bucketIndex].push(metrics[i])

      const nextMetric = metrics[i + 1]
      // TODO: Currently the next bucket is always iterated to, even if the next metric should be further away in time
      if (nextMetric && nextMetric.TimeStamp > bucketEndTime) {
        bucketIndex++
      }
    }
    return [ [ startPoint ], ...buckets, [ endPoint ] ]

    // TODO: feed each bucket directly to LTTB, instead of creating all buckets first?
  }

  /**
   * @param a Previously selected point from the previous bucket
   * @param b Candidate point from the current bucket
   * @param c Average of point in the next bucket
   * @returns The area of the triangle
   */
  const calculateTriangleArea = (a: MetricData, b: MetricData, c: MetricData) => {
    return Math.abs((a.TimeStamp - c.TimeStamp) * (b.Value - a.Value) - (a.TimeStamp - b.TimeStamp) * (c.Value - a.Value)) / 2
  }

  const calculateBucketAveragePoint = (bucket: MetricData[]) => {
    const initialValue = {
      TimeStampSum: 0,
      ValueSum: 0
    }
    const {
      TimeStampSum, ValueSum
    } = bucket.reduce((accumulator, current) => {
      return {
        TimeStampSum: accumulator.TimeStampSum + current.TimeStamp,
        ValueSum: accumulator.ValueSum + current.Value
      }
    }, initialValue)

    return {
      TimeStamp: TimeStampSum / bucket.length,
      Value: ValueSum / bucket.length
    }
  }

  const buckets = createBuckets()
  const firstValue = buckets[0][0]
  const lastValue = buckets[buckets.length - 1][0]
  const downSampledMetrics = [ firstValue ]
  for (let i = 1; i < buckets.length - 1; i++) {
    const a = downSampledMetrics[i - 1]
    const c = calculateBucketAveragePoint(buckets[i + 1])
    const currentBucket = buckets[i]

    const bucketAreas: number[] = []
    for (let j = 0; j < currentBucket.length; j++) {
      const b = currentBucket[j]
      const area = calculateTriangleArea(a, b, c)
      bucketAreas.push(area)
    }

    const maxAreaIndex = bucketAreas.indexOf(Math.max(...bucketAreas))
    downSampledMetrics.push(currentBucket[maxAreaIndex])
  }

  return [ ...downSampledMetrics, lastValue ]
}

export const removeUntilConditionIsNoLongerMet = <T>(
  array: T[],
  condition: (item: T) => boolean
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
    horizontalPercent: element.scrollLeft / maxScrollLeft,
    verticalPercent: element.scrollTop / maxScrollTop
  }
}