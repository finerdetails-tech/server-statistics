import { useEffect } from "react"

function useHorizontalScrolling(isEnabled: boolean, scrollContainerRef: React.RefObject<HTMLElement>) {

    useEffect(() => {
        const el = scrollContainerRef.current
        if (!el || !isEnabled) return

        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault()
                el.scrollLeft += e.deltaY
            }
        }

        el.addEventListener("wheel", onWheel, { passive: false })

        return () => {
            el.removeEventListener("wheel", onWheel)
        }
    }, [isEnabled, scrollContainerRef.current])

}

export default useHorizontalScrolling