import { useScreenSize } from '@visx/responsive'
import { useMemo, useRef } from 'preact/hooks'

import {
    listCurrentAndParentElements
} from '../utils'

function useContainerDimensions(rowCount: number) {
    const {
        height: viewportHeight, width: viewportWidth
    } = useScreenSize()

    const metricsContainerRef = useRef<HTMLDivElement>(null)

    const isLandscape = useMemo(() => {
        return viewportWidth > viewportHeight
    }, [viewportWidth, viewportHeight])

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
    } = useMemo(() =>
        listCurrentAndParentElements(metricsContainerRef.current).reduce((acc, element) => {
            if (!element) return acc
            const heightProperties = ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'] as const
            const widthProperties = ['marginLeft', 'marginRight', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'] as const
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
        }), [metricsContainerRef.current])

    const {
        metricHeight, metricWidth
    } = useMemo(() => {
        const headerHeight = document.getElementsByTagName('header')[0]?.offsetHeight || 0
        let metricHeight: number
        let metricWidth: number
        const heightToWidthRatio = 2 / 3

        if (isLandscape) {
            const availableHeight = viewportHeight - parentHeightStyling - headerHeight
            const availableWidth = Math.max(viewportWidth - parentWidthStyling, 100)

            metricHeight = Math.max((availableHeight / rowCount), 100)
            const targetWidth = metricHeight / heightToWidthRatio
            const totalLeftOverWidth = availableWidth % targetWidth
            const fittingMetricsCount = Math.floor(availableWidth / targetWidth)
            const leftOverWidth = totalLeftOverWidth / fittingMetricsCount

            metricWidth = targetWidth + leftOverWidth

        } else {
            metricWidth = Math.max(viewportWidth - parentWidthStyling - SCROLLBAR_WIDTH, 100)

            const availableHeight = viewportHeight - parentHeightStyling - headerHeight
            const targetHeight = metricWidth * heightToWidthRatio
            const fittingMetricsCount = Math.max(Math.floor(availableHeight / targetHeight), 1)
            const leftOverHeight = availableHeight % targetHeight
            const adjustedHeight = targetHeight + (leftOverHeight / (fittingMetricsCount))
            metricHeight = adjustedHeight
        }

        return {
            metricHeight,
            metricWidth
        }
    }, [isLandscape, viewportHeight, viewportWidth])

    return { metricHeight, metricWidth, isLandscape, metricsContainerRef }

}

export default useContainerDimensions