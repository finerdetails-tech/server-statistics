import {
  useEffect, useState
} from 'preact/hooks'
function useIsLandscape () {
  const mediaQueryList = window.matchMedia("(orientation: landscape)")
  const [ isLandscape, setIsLandscape ] = useState(mediaQueryList.matches)

  useEffect(() => {
    const handleChange = (e: MediaQueryListEvent) => setIsLandscape(e.matches)
    mediaQueryList.addEventListener("change", handleChange)
    return () => {
      mediaQueryList.removeEventListener("change", handleChange)
    }
  }, [])

  return isLandscape
}

export default useIsLandscape