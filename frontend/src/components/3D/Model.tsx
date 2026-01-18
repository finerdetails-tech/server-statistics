import {
  useEffect, useRef
} from 'preact/compat'
import { init } from './three'

function Model ({
  headerHeight,
  isLandscape,
  SCROLLBAR_WIDTH
}: {
  isLandscape: boolean,
  headerHeight: number,
  SCROLLBAR_WIDTH: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    console.warn('Initializing 3D scene')
    init(canvasRef.current)
  }, [])

  const baseStyle = {
    height: isLandscape
      ? `calc(100% - ${headerHeight + SCROLLBAR_WIDTH}px)`
      : '100vh',
    width: isLandscape
      ? '100vw'
      : '100%'
  }


  return (
    <>
      <div
        style={{
          flexShrink: 0,
          ...baseStyle
        }}
      />
      <canvas
        ref={canvasRef} style={{
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          top: headerHeight,
          ...baseStyle
        }}
      />
    </>
  )
}

export default Model
