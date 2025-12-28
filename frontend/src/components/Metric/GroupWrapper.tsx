import type {ComponentChild} from 'preact'

function GroupWrapper ({
  children, isLandscape, rowCount
}: {
  isLandscape: boolean,
  rowCount: number,
  children: ComponentChild[]
}) {
  if (isLandscape) {
    const groupedRows = children.reduce((acc: ComponentChild[][], child, index) => {
      const isEmpty = acc.length === 0
      const isCutOff = index % rowCount === 0

      if (isEmpty || isCutOff) {
        acc.push([ child ])
      } else {
        acc.at(-1)?.push(child)
      }

      return acc
    }, []) as ComponentChild[][]

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row'

        }}
        class="metric-group-wrapper-landscape">
        {groupedRows.map((row, index) => (
          <div
            key={index} class="metric-group-row">
            {row}
          </div>
        ))}
      </div>
    )
  }

  return (<>{children}</>)
}

export default GroupWrapper