
import './style.css'
import { render } from 'preact'
import {
  useRef, useState
} from 'preact/compat'
import Model from './components/3D/Model'
import Header from './components/Header'
import MetricsContainer from './components/Metric/MetricsContainer'
import useDimensions from './hooks/useDimensions'
import useHorizontalScrolling from './hooks/useHorizontalScrolling'
import useScrollSaving from './hooks/useScrollSaving'
import { remToPx } from './utils'


export function App () {
  const [ isMetricsLoaded, setIsMetricsLoaded ] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const metricsContainerGap = remToPx(2)

  const {
    headerHeight, isLandscape, metricHeight, metricsContainerRef, metricsContainerRowCount, metricWidth, SCROLLBAR_WIDTH, viewportHeight, viewportWidth
  } = useDimensions(metricsContainerGap)

  useHorizontalScrolling(isLandscape, scrollContainerRef)
  useScrollSaving(scrollContainerRef, isMetricsLoaded)

  return (
    <>
      <Header />
      <div
        ref={scrollContainerRef}
        class="app-container"
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
          SCROLLBAR_WIDTH={SCROLLBAR_WIDTH}
          viewportHeight={viewportHeight}
          viewportWidth={viewportWidth}
        />
        <MetricsContainer
          gap={metricsContainerGap}
          metricHeight={metricHeight}
          metricWidth={metricWidth}
          isLandscape={isLandscape}
          metricsContainerRef={metricsContainerRef}
          rowCount={metricsContainerRowCount}
          setIsMetricsLoaded={setIsMetricsLoaded}
        />
      </div>
    </>
  )
}


render(
  <App />, document.getElementById('app'))
