import { useScreenSize } from '@visx/responsive'
import {
  useMemo, useRef
} from 'preact/hooks'
import {listCurrentAndParentElements} from '../utils'
import useMetricsConfig from './useMetricsConfig'

function useDimensions (metricsContainerGap: number) {
  const {
    height: viewportHeight, width: viewportWidth
  } = useScreenSize()

  const metricsContainerRowCount = viewportHeight > 720
    ? 2
    : 1

  const { metricsConfigList } = useMetricsConfig()

  const landScapeColumns = Math.ceil(metricsConfigList.length / metricsContainerRowCount)


  const metricsContainerRef = useRef<HTMLDivElement>(null)

  const isLandscape = useMemo(() => {
    return viewportWidth > viewportHeight
  }, [ viewportWidth, viewportHeight ])

  const totalGap = {
    x: (isLandscape
      ? ((landScapeColumns - 1) * metricsContainerGap)
      : 0),
    y: (isLandscape
      ? ((Math.max(metricsContainerRowCount, 1) - 1) * metricsContainerGap)
      : ((metricsConfigList.length - 1) * metricsContainerGap))
  }

  const SCROLLBAR_WIDTH = useMemo(() => {
    const outer = document.createElement('div')
    outer.style.visibility = 'hidden'
    outer.style.overflow = 'scroll'
    outer.style.width = '100px'
    document.body.appendChild(outer)

    const inner = document.createElement('div')
    inner.style.width = '100%'
    outer.appendChild(inner)

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth

    document.body.removeChild(outer)

    return scrollbarWidth
  }, [])

  const {
    parentHeightStyling, parentWidthStyling
  } = useMemo(() => listCurrentAndParentElements(metricsContainerRef.current).reduce((acc, element) => {
    if (!element) return acc
    const heightProperties = [ 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth' ] as const
    const widthProperties = [ 'marginLeft', 'marginRight', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth' ] as const
    heightProperties.forEach((prop) => {
      const value = parseFloat(getComputedStyle(element)[prop]) || 0
      acc.parentHeightStyling += value
    })
    widthProperties.forEach((prop) => {
      const value = parseFloat(getComputedStyle(element)[prop]) || 0
      acc.parentWidthStyling += value
    })
    return acc
  }, {
    parentHeightStyling: 0,
    parentWidthStyling: 0
  }), [ metricsContainerRef.current ])

  const {
    headerHeight, metricHeight, metricWidth
  } = useMemo(() => {
    const headerHeight = document.getElementsByTagName('header')[0]?.offsetHeight || 0
    let metricHeight: number
    let metricWidth: number
    const heightToWidthRatio = 2 / 3

    if (isLandscape) {
      const availableHeight = viewportHeight - parentHeightStyling - headerHeight - totalGap.y - SCROLLBAR_WIDTH// TODO: TÄSSÄ ON LIIKAA KORKEUTTA
      const availableWidth = Math.max(viewportWidth - parentWidthStyling - totalGap.x, 100)

      metricHeight = Math.max((availableHeight / metricsContainerRowCount), 100)
      const targetWidth = metricHeight / heightToWidthRatio
      const totalLeftOverWidth = availableWidth % targetWidth
      const fittingMetricsCount = Math.floor(availableWidth / targetWidth)
      const leftOverWidth = totalLeftOverWidth / fittingMetricsCount

      metricWidth = targetWidth + leftOverWidth

    } else {
      metricWidth = Math.max(viewportWidth - parentWidthStyling - SCROLLBAR_WIDTH, 100)

      const availableHeight = viewportHeight - parentHeightStyling - headerHeight - totalGap.y
      const targetHeight = metricWidth * heightToWidthRatio
      const fittingMetricsCount = Math.max(Math.floor(availableHeight / targetHeight), 1)
      const leftOverHeight = availableHeight % targetHeight
      const adjustedHeight = targetHeight + (leftOverHeight / (fittingMetricsCount))
      metricHeight = adjustedHeight
    }

    return {
      headerHeight,
      metricHeight,
      metricWidth
    }
  }, [ isLandscape, viewportHeight, viewportWidth ])

  return {
    headerHeight,
    isLandscape,
    metricHeight,
    metricsContainerRef,
    metricsContainerRowCount,
    metricWidth,
    SCROLLBAR_WIDTH,
    viewportHeight,
    viewportWidth
  }
}

export default useDimensions