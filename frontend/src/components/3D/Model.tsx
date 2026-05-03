import {
  useEffect, useRef
} from 'preact/compat'
import useMetricsConfig from '../../hooks/useMetricsConfig'
import ThreeJSManager from './ThreeJSManager'

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

  const { metricsConfigList } = useMetricsConfig()
  const metricCount = metricsConfigList.length

  useEffect(() => {
    let cleanup: () => void
    const initializeScene = async () => {
      console.log('Initializing 3D scene')
      const ThreeJSManagerInstance = await ThreeJSManager.create(canvasRef.current!, placeholderRef.current!, scrollContainerRef.current!, metricCount)
      cleanup = ThreeJSManagerInstance.cleanup

      return () => {
        console.log('Cleaning up 3D scene')
        cleanup()
      }
    }
    initializeScene()
  }, [])

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
