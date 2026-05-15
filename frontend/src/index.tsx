
import './style.css'
import { render } from 'preact'
import {
  useRef, useState
} from 'preact/compat'
import Model from './components/3D/Model'
import Header from './components/Header'
import MetricsContainer from './components/Metric/MetricsContainer'
import { applyColorsAsCSSVariables } from './const/colors'
import useHorizontalScrolling from './hooks/useHorizontalScrolling'
import useIsLandscape from './hooks/useIsLandscape'
import useScrollSaving from './hooks/useScrollSaving'


export function App () {
  const [ isMetricsLoaded, setIsMetricsLoaded ] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const isLandscape = useIsLandscape()

  useHorizontalScrolling(isLandscape, scrollContainerRef)
  useScrollSaving(scrollContainerRef, isMetricsLoaded)
  applyColorsAsCSSVariables()

  const headerHeight = document.getElementsByTagName('header')[0]?.offsetHeight || 62

  return (
    <>
      <Header/>
      <div
        ref={scrollContainerRef}
        class="scroll-container"
        style={{
          display: 'flex',
          flexDirection: isLandscape
            ? 'row'
            : 'column',
          flexGrow: 1,
          flexWrap: 'nowrap',
          maxHeight: `calc(100vh - ${headerHeight}px)`,
          maxWidth: '100vw',
          overflow: 'auto'
        }}>
        <Model
          scrollContainerRef={scrollContainerRef}
          headerHeight={headerHeight}
          isLandscape={isLandscape}
        />
        <MetricsContainer
          isLandscape={isLandscape}
          scrollContainerRef={scrollContainerRef}
          setIsMetricsLoaded={setIsMetricsLoaded}
        />
      </div>
    </>
  )
}


render(
  <App />, document.body
)
