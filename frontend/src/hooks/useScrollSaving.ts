import { useLayoutEffect } from "react"

const elementToPercent = (element: HTMLElement) => {
    const maxScrollLeft = element.scrollWidth - element.clientWidth
    const maxScrollTop = element.scrollHeight - element.clientHeight

    return {
        verticalPercent: element.scrollTop / maxScrollTop,
        horizontalPercent: element.scrollLeft / maxScrollLeft
    }
}

const JSONStringToPx = (element: HTMLElement, jsonString: string) => {
    const maxScrollLeft = element.scrollWidth - element.clientWidth
    const maxScrollTop = element.scrollHeight - element.clientHeight
    const { horizontalPercent, verticalPercent } = JSON.parse(jsonString)

    return {
        verticalPx: verticalPercent * maxScrollTop,
        horizontalPx: horizontalPercent * maxScrollLeft
    }
}

function useScrollSaving(scrollContainerRef: React.RefObject<HTMLElement>, isMetricsLoaded: boolean) {
    useLayoutEffect(() => {
        const element = scrollContainerRef.current
        if (!element || !isMetricsLoaded) return

        const restore = () => {
            const raw = localStorage.getItem("scrollPosition")
            if (!raw) return

            const { horizontalPx, verticalPx } = JSONStringToPx(element, raw)
            const isScrollable = element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight

            if (isScrollable) {
                element.scrollTo(horizontalPx, verticalPx)
            } else {
                requestAnimationFrame(restore)
            }
        }

        restore()

        const onScrollend = () => {
            localStorage.setItem(
                "scrollPosition",
                JSON.stringify(elementToPercent(element))
            )
        }

        element.addEventListener("scrollend", onScrollend)
        return () => element.removeEventListener("scrollend", onScrollend)
    }, [scrollContainerRef, isMetricsLoaded])
}
export default useScrollSaving