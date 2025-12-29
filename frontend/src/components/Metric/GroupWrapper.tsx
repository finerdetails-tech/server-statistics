import type { ComponentChild } from 'preact'

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
      <>
        {groupedRows.map((row, index) => (
          <div
            key={index} class="metric-group-row">
            {row}
          </div>
        ))}
      </>
    )
  }

  return (<>{children}</>)
}

export default GroupWrapper