function MetricHeader ({
  metricName, style
}: {
  metricName: string,
  style?: preact.CSSProperties
}) {

  return (
    <div
      style={style}>
      <h2
        style={{
          fontFamily: 'GoogleSansCode, monospace',
          fontSize: '2rem',
          margin: 0
        }}>{metricName}
      </h2>
    </div>
  )
}

export default MetricHeader