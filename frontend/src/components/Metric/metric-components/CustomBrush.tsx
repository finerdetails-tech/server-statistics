import type { AxisScale } from '@visx/axis'
import { Brush } from '@visx/brush'
import type BaseBrush from '@visx/brush/lib/BaseBrush'
import { BrushHandleRenderProps } from '@visx/brush/lib/BrushHandle'
import { Bounds } from '@visx/brush/lib/types'
import { Group } from '@visx/group'
import { PatternLines } from '@visx/pattern'
import type { MutableRef } from 'preact/hooks'
import { colors } from '../../../const/colors'

type Margin = {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

type BrushPosition = {
  start: {x: number};
  end: {x: number};
}

export const PATTERN_ID = 'brush_pattern'

/*
 * The hatch fill is rendered separately as an underlay behind the overview
 * line (see MetricContainer). The brush itself only contributes its outline
 * and handles on top, so its selection box uses a transparent (but still
 * hit-testable) fill to keep drag-to-move working.
 */
const selectedBrushStyle = { fill: 'transparent' }

function CustomBrush ({
  height,
  initialBrushPosition,
  innerRef,
  isHeaderOnRight,
  margin,
  onChange,
  width,
  xScale,
  yScale

}: {
  xScale: AxisScale<number>,
  yScale: AxisScale<number>,
  width: number,
  height: number,
  margin: Margin,
  innerRef: MutableRef<BaseBrush | null>,
  initialBrushPosition?: BrushPosition,
  onChange: (domain: Bounds | null) => void,
  isHeaderOnRight: boolean
}) {

  return (
    <>
      <PatternLines
        id={PATTERN_ID}
        height={8}
        width={8}
        stroke={colors.brushBackground}
        strokeWidth={2}
        orientation={[ 'diagonal' ]}
      />
      <Brush
        xScale={xScale}
        yScale={yScale}
        width={width}
        height={height}
        margin={margin}
        handleSize={8}
        innerRef={innerRef}
        resizeTriggerAreas={[ 'left', 'right' ]}
        brushDirection="horizontal"
        initialBrushPosition={initialBrushPosition}
        onChange={onChange}
        selectedBoxStyle={selectedBrushStyle}
        useWindowMoveEvents={isHeaderOnRight}
        renderBrushHandle={(props) => (
          <BrushHandle
            {...props} />
        )}
      />
    </>
  )
}

function BrushHandle ({
  height, isBrushActive, x
}: BrushHandleRenderProps) {
  const pathWidth = 8
  const outterPathHeight = height - 12
  const innerPathHeight = outterPathHeight - 6
  if (!isBrushActive) {
    return null
  }
  return (
    <Group
      left={x + pathWidth / 2} top={(height - outterPathHeight) / 2}>
      <path
        fill="#504e4f"
        d={`M -4.5 0.5 L 3.5 0.5 L 3.5 ${outterPathHeight} L -4.5 ${outterPathHeight} L -4.5 0.5`}
        style={{ cursor: 'ew-resize' }}
      />
      <path
        d={`M -0.5 4 L -0.5 ${innerPathHeight}`}
        stroke={colors.text}
        strokeWidth="2"
        style={{ cursor: 'ew-resize' }}
      />
    </Group>
  )
}

export default CustomBrush