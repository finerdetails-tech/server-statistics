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


  return (
    <>
      <div
        style={{
          flexShrink: 0,
          height: '100%',
          width: isLandscape
            ? '100vw'
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
