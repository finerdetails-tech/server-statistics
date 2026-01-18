
import './style.css'
import { render } from 'preact'
import {useRef} from 'preact/compat'
import Model from './components/3D/Model'
import Header from './components/Header'
import MetricsContainer from './components/Metric/MetricsContainer'
import useDimensions from './hooks/useDimensions'
import useHorizontalScrolling from './hooks/useHorizontalScrolling'
import useScrollSaving from './hooks/useScrollSaving'
import { remToPx } from './utils'


export function App () {

  const appContainerRef = useRef<HTMLDivElement>(null)

  const metricsContainerGap = remToPx(2)

  const {
    headerHeight, isLandscape, metricHeight, metricsContainerRef, metricsContainerRowCount, metricWidth, SCROLLBAR_WIDTH
  } = useDimensions(metricsContainerGap)

  useHorizontalScrolling(isLandscape, appContainerRef)
  useScrollSaving(appContainerRef)

  return (
    <div>
      <Header />
      <div
        ref={appContainerRef}
        class="app-container"
        style={{
          backgroundColor: '#0A0A0C',
          display: 'flex',
          flexDirection: isLandscape
            ? 'row'
            : 'column',
          flexGrow: 1,
          flexWrap: 'nowrap',
          maxWidth: '100vw',
          overflow: 'auto'
        }}>
        <Model
          headerHeight={headerHeight}
          isLandscape={isLandscape}
          SCROLLBAR_WIDTH={SCROLLBAR_WIDTH}
        />
        <MetricsContainer
          gap={metricsContainerGap}
          metricHeight={metricHeight}
          metricWidth={metricWidth}
          isLandscape={isLandscape}
          metricsContainerRef={metricsContainerRef}
          rowCount={metricsContainerRowCount}
        />
      </div>
    </div>
  )
}


render(
  <App />, document.getElementById('app'))
