import { useEffect } from "react"

function useHorizontalScrolling (isEnabled: boolean, scrollContainerRef: React.RefObject<HTMLElement>) {

  useEffect(() => {
    const element = scrollContainerRef.current
    if (!element || !isEnabled) return

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        element.scrollLeft += e.deltaY
      }
    }

    element.addEventListener("wheel", onWheel, { passive: false })

    return () => {
      element.removeEventListener("wheel", onWheel)
    }
  }, [ isEnabled, scrollContainerRef.current ])

}

export default useHorizontalScrolling