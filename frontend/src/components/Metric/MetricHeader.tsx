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
          fontSize: style?.fontSize || '2rem',
          margin: 0,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'pre-wrap'
        }}>{metricName}
      </h2>
    </div>
  )
}

export default MetricHeader