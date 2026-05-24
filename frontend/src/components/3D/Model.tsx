import {
  useEffect, useRef
} from 'preact/compat'
import type { RefObject } from 'preact/compat'
import useMetricsConfig from '../../hooks/useMetricsConfig'
import ThreeJSManager from './ThreeJSManager'

function Model ({
  headerHeight,
  isLandscape,
  scrollContainerRef,
  setMetricPadding
}: {
  isLandscape: boolean,
  headerHeight: number,
  scrollContainerRef: RefObject<HTMLElement>
  setMetricPadding: (padding: number) => void
}) {

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const placeholderRef = useRef<HTMLDivElement>(null)

  const { metricsConfigList } = useMetricsConfig()
  const metricCount = metricsConfigList.length

  useEffect(() => {
    let cleanup: () => void
    const initializeScene = async () => {
      console.log('Initializing 3D scene')
      const ThreeJSManagerInstance = await ThreeJSManager.create(canvasRef.current!, placeholderRef.current!, scrollContainerRef.current!, metricCount, headerHeight, setMetricPadding)
      cleanup = ThreeJSManagerInstance.cleanup

      return () => {
        console.log('Cleaning up 3D scene')
        cleanup()
      }
    }
    initializeScene()
  }, [])

  const canvasParent = canvasRef.current?.parentElement
  const canvasParentOffsetWidth = canvasParent?.offsetWidth || 0
  const canvasParentClientWidth = canvasParent?.clientWidth || 0
  const canvasParentOffsetHeight = canvasParent?.offsetHeight || 0
  const canvasParentClientHeight = canvasParent?.clientHeight || 0
  const scrollBarOffset = isLandscape
    ? canvasParentOffsetHeight - canvasParentClientHeight
    : canvasParentOffsetWidth - canvasParentClientWidth

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
            ? scrollBarOffset
            : 0)}px)`,
          left: 0,
          maxHeight: "100vh",
          maxWidth: "100vw",
          position: 'absolute',
          right: 0,
          top: headerHeight,
          width: isLandscape
            ? '100%'
            : `calc(100% - ${scrollBarOffset}px)`,
          zIndex: -1
        }}
      />
    </>
  )
}

export default Model
