
import './style.css'
import { render } from 'preact'
import Header from './components/Header'
import MetricsContainer from './components/Metric/MetricsContainer'


export function App () {
  return (
    <div
      class="app-container">
      <Header />
      <MetricsContainer />
    </div>
  )
}


render(
  <App />, document.getElementById('app'))
