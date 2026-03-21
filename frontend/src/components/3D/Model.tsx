import {
  useEffect, useRef
} from 'preact/compat'
import {
  cleanup, init, resize, setScrollElements
} from './three'

function Model ({
  headerHeight,
  isLandscape,
  SCROLLBAR_WIDTH,
  scrollContainerRef
}: {
  isLandscape: boolean,
  headerHeight: number,
  SCROLLBAR_WIDTH: number,
  scrollContainerRef: React.RefObject<HTMLElement>
}) {

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.warn('Initializing 3D scene')
    const onResize = () => {
      resize(window.innerHeight, window.innerWidth)
    }
    window.addEventListener('resize', onResize)
    init(canvasRef.current)
    return () => {
      window.removeEventListener('resize', onResize)
      cleanup()
    }
  }, [])


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
          maxHeight: "100vh",
          maxWidth: "100vw",
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
