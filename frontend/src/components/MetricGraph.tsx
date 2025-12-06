import type { Metric } from 'types'
import { scaleTime, scaleLinear } from '@vx/scale'
import { extent, max } from 'd3-array'
import { AreaClosed } from '@vx/shape'
import { Group } from '@vx/group'

function MetricGraph({ metrics }: { metrics: Metric[] }) {

  const margin = {
    top: 60,
    bottom: 60,
    left: 80,
    right: 80,
  };

  type MetricData = {
    TimeStamp: number;
    Value: number;
  };

  const metricData: MetricData[] = metrics.map(({ TimeStamp, Value }) => ({ 
    TimeStamp, 
    Value: parseFloat(Value)
  }));

  const width = 750;
  const height = 400;

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const x = (m: MetricData) => m.TimeStamp;  // Convert timestamp to Date
  const y = (m: MetricData) => m.Value;

  const xScale = scaleTime({
    range: [0, xMax],
    domain: extent(metricData, x)
  });

  const yScale = scaleLinear({
    range: [yMax, 0],
    domain: [0, max(metricData, y)]
  });

  return (
    <svg width={width} height={height}>
      <Group top={margin.top} left={margin.left}>
        <AreaClosed
          data={metricData}
          x={(d) => xScale(new Date(d.TimeStamp)) ?? 0}
          y={(d) => yScale(d.Value) ?? 0}
          yScale={yScale}
          fill={"magenta"}
        />
      </Group>
    </svg>
  )

}

export default MetricGraph