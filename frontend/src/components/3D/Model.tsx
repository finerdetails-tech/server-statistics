import {
  useEffect, useRef
} from 'preact/compat'
import { debounce } from 'throttle-debounce'
import {
  init, resize, setScrollElements
} from './three'

const debouncedResize = debounce(250, (viewportHeight: number, viewportWidth: number) => resize(viewportHeight, viewportWidth))

function Model ({
  headerHeight,
  isLandscape,
  SCROLLBAR_WIDTH,
  scrollContainerRef,
  viewportHeight,
  viewportWidth
}: {
  isLandscape: boolean,
  headerHeight: number,
  SCROLLBAR_WIDTH: number,
  viewportHeight: number,
  viewportWidth: number,
  scrollContainerRef: React.RefObject<HTMLElement>
}) {

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.warn('Initializing 3D scene')
    init(canvasRef.current)
  }, [])

  useEffect(() => {
    debouncedResize(viewportHeight, viewportWidth)
  }, [ viewportHeight, viewportWidth, debouncedResize ])

  useEffect(() => {
    if (scrollContainerRef.current) {
      setScrollElements(placeholderRef.current, scrollContainerRef.current, isLandscape)
    }
  }, [ scrollContainerRef, isLandscape ])

  return (
    <>
      <div
        ref={placeholderRef}
        style={{
          flexShrink: 0,
          height: isLandscape
            ? '100%'
            : '200%',
          width: isLandscape
            ? '200vw'
            : '100%'
        }}
      />
      <canvas
        ref={canvasRef} style={{
          bottom: 0,
          height: `calc(100% - ${headerHeight + (isLandscape
            ? SCROLLBAR_WIDTH
            : 0)}px)`,
          left: 0,
          position: 'absolute',
          right: 0,
          top: headerHeight,
          width: isLandscape
            ? '100vw'
            : '100%',
          zIndex: -1
        }}
      />
    </>
  )
}

export default Model
