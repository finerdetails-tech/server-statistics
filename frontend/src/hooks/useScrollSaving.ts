import { useLayoutEffect } from 'preact/compat'
import { debounce } from "throttle-debounce"
import { elementScrollToPercent } from '../utils'

const JSONStringToPx = (element: HTMLElement, jsonString: string) => {
  const maxScrollLeft = element.scrollWidth - element.clientWidth
  const maxScrollTop = element.scrollHeight - element.clientHeight
  const {
    horizontalPercent, verticalPercent
  } = JSON.parse(jsonString)

  return {
    horizontalPx: horizontalPercent * maxScrollLeft,
    verticalPx: verticalPercent * maxScrollTop
  }
}

function useScrollSaving (scrollContainerRef: React.RefObject<HTMLElement>, isMetricsLoaded: boolean) {

  useLayoutEffect(() => {
    const element = scrollContainerRef.current
    if (!element || !isMetricsLoaded) return

    const restore = () => {
      const raw = localStorage.getItem("scrollPosition")
      if (!raw) return

      const {
        horizontalPx, verticalPx
      } = JSONStringToPx(element, raw)
      const isScrollable = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight

      if (isScrollable) {
        element.scrollTo(horizontalPx, verticalPx)
      } else {
        requestAnimationFrame(restore)
      }
    }

    restore()

    const onScrollend = debounce(500, () => {
      localStorage.setItem(
        "scrollPosition",
        JSON.stringify(elementScrollToPercent(element))
      )
    })

    element.addEventListener("scrollend", onScrollend)

    return () => element.removeEventListener("scrollend", onScrollend)
  }, [ scrollContainerRef, isMetricsLoaded ])
}
export default useScrollSaving