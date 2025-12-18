
import './style.css'
import { render } from 'preact'
import MetricsContainer from './components/Metric/MetricsContainer'


export function App () {
  return (
    <MetricsContainer />
  )
}


render(
  <App />, document.getElementById('app'))
