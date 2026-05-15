import type { RefObject } from 'preact/compat'
import {
  useEffect, useMemo, useState
} from 'preact/hooks'
import useIsLandscape from './useIsLandscape'

function useDimensions (metricsContainerGap: number, metricContainerRef: RefObject<HTMLDivElement>) {

  const isLandscape = useIsLandscape()

  const [ metricContainerWidth, setMetricContainerWidth ] = useState(0)
  const [ metricContainerHeight, setMetricContainerHeight ] = useState(0)

  useEffect(() => {
    const metricContainer = metricContainerRef.current

    if (!metricContainer) return
    const resizeObserver = new ResizeObserver(([ entry ]) => {
      const {
        blockSize, inlineSize
      } = entry.contentBoxSize[0]
      setMetricContainerWidth(inlineSize)
      setMetricContainerHeight(blockSize)

    })
    resizeObserver.observe(metricContainer)
    return () => resizeObserver.disconnect()
  }, [])


  const metricsContainerRowCount = metricContainerHeight > 594
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

    if (isLandscape) {
      const totalGapY = getTotalGap().y
      const availableHeight = metricContainerHeight - totalGapY
      const availableWidth = Math.max(metricContainerWidth, 100)

      metricHeight = Math.max(((availableHeight) / metricsContainerRowCount), 100)
      const targetWidth = metricHeight / heightToWidthRatio

      const fittingMetricsCount = Math.max(Math.floor((availableWidth + metricsContainerGap) / (targetWidth + metricsContainerGap)), 1)
      const totalGapX = getTotalGap(fittingMetricsCount).x
      metricWidth = (availableWidth - totalGapX) / fittingMetricsCount
    } else {
      metricWidth = Math.max(metricContainerWidth, 100)

      const availableHeight = metricContainerHeight
      const targetHeight = metricWidth * heightToWidthRatio

      const fittingMetricsCount = Math.max(Math.floor((availableHeight + metricsContainerGap) / (targetHeight + metricsContainerGap)), 1)
      metricHeight = (availableHeight - getTotalGap(fittingMetricsCount).y) / fittingMetricsCount
    }

    return {
      metricHeight,
      metricWidth
    }
  }, [ metricContainerHeight, metricContainerWidth ])

  return {
    metricContainerHeight,
    metricContainerWidth,
    metricHeight,
    metricsContainerRowCount,
    metricWidth
  }
}

export default useDimensions