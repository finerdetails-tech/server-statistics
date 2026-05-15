import { useState } from 'preact/hooks'
function useIsLandscape () {
  const mediaQueryList = window.matchMedia("(orientation: landscape)")
  const [ isLandscape, setIsLandscape ] = useState(mediaQueryList.matches)

  mediaQueryList.addEventListener("change", (e) => setIsLandscape(e.matches))

  return isLandscape
}

export default useIsLandscape