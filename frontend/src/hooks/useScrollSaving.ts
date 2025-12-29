import { useLayoutEffect } from "react"
function useScrollSaving(scrollContainerRef: React.RefObject<HTMLElement>) {
    useLayoutEffect(() => {
        const element = scrollContainerRef.current
        if (!element) return

        const restore = () => {
            const raw = localStorage.getItem("scrollPosition")
            if (!raw) return
            const { horizontal, vertical } = JSON.parse(raw)
            const isScrollable = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight
            if (isScrollable) {
                element.scrollTo(horizontal, vertical)
            } else {
                requestAnimationFrame(restore)
            }
        }

        restore()

        const onScrollend = () => {
            localStorage.setItem(
                "scrollPosition",
                JSON.stringify({
                    vertical: element.scrollTop,
                    horizontal: element.scrollLeft
                })
            )
        }

        element.addEventListener("scrollend", onScrollend)
        return () => element.removeEventListener("scrollend", onScrollend)
    }, [scrollContainerRef])
}
export default useScrollSaving