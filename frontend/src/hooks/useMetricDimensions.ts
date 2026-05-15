import type { RefObject } from 'preact/compat'
import {
  useEffect, useMemo, useState
} from 'preact/hooks'
import useIsLandscape from './useIsLandscape'

function useMetricDimensions (metricsContainerGap: number, scrollContainerRef: RefObject<HTMLDivElement>) {

  const isLandscape = useIsLandscape()

  const [ scrollContainerWidth, setScrollContainerWidth ] = useState(0)
  const [ scrollContainerHeight, setScrollContainerHeight ] = useState(0)

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current

    if (!scrollContainer) return
    const resizeObserver = new ResizeObserver(([ entry ]) => {
      const {
        blockSize, inlineSize
      } = entry.contentBoxSize[0]
      setScrollContainerWidth(inlineSize)
      setScrollContainerHeight(blockSize)

    })
    resizeObserver.observe(scrollContainer)
    return () => resizeObserver.disconnect()
  }, [])


  const metricsContainerRowCount = scrollContainerHeight > 594
    ? 2
    : 1


  const getTotalGap = (fittingMetricsCount?: number) => {
    return {
      x: (isLandscape
        ? ((fittingMetricsCount! - 1) * metricsContainerGap)
        : 0),
      y: (isLandscape
        ? ((Math.max(metricsContainerRowCount, 1) - 1) * metricsContainerGap)
        : ((fittingMetricsCount! - 1) * metricsContainerGap))
    }
  }

  const {
    metricHeight, metricWidth
  } = useMemo(() => {
    let metricHeight: number
    let metricWidth: number
    const heightToWidthRatio = 2 / 3

    const totalContainerPadding = (2 * metricsContainerGap)

    if (isLandscape) {
      const totalGapY = getTotalGap().y
      const availableHeight = scrollContainerHeight - totalGapY - totalContainerPadding
      const availableWidth = Math.max(scrollContainerWidth - totalContainerPadding, 100)

      metricHeight = Math.max(((availableHeight) / metricsContainerRowCount), 100)
      const targetWidth = metricHeight / heightToWidthRatio

      const fittingMetricsCount = Math.max(Math.floor((availableWidth + metricsContainerGap) / (targetWidth + metricsContainerGap)), 1)
      const totalGapX = getTotalGap(fittingMetricsCount).x
      metricWidth = (availableWidth - totalGapX) / fittingMetricsCount
    } else {
      metricWidth = Math.max(scrollContainerWidth - totalContainerPadding, 100)

      const availableHeight = scrollContainerHeight - totalContainerPadding
      const availableWidth = scrollContainerWidth - totalContainerPadding
      const targetHeight = availableWidth * heightToWidthRatio

      const fittingMetricsCount = Math.max(Math.floor((availableHeight + metricsContainerGap) / (targetHeight + metricsContainerGap)), 1)
      metricHeight = (availableHeight - getTotalGap(fittingMetricsCount).y) / fittingMetricsCount
    }

    return {
      metricHeight,
      metricWidth
    }
  }, [ scrollContainerHeight, scrollContainerWidth, isLandscape, metricsContainerGap, metricsContainerRowCount ])

  return {
    metricHeight,
    metricsContainerRowCount,
    metricWidth
  }
}

export default useMetricDimensions