import { useState, useEffect } from 'react'

export const useDevicePerformance = () => {
  const [isLowEnd, setIsLowEnd] = useState(false)

  useEffect(() => {
    const checkPerformance = () => {
      const memory = navigator.deviceMemory
      const cores = navigator.hardwareConcurrency
      const connection = navigator.connection?.effectiveType

      const lowMem = memory && memory <= 2
      const lowCores = cores && cores <= 2
      const slowNet = connection && ['slow-2g', '2g'].includes(connection)

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      setIsLowEnd(lowMem || lowCores || slowNet || prefersReducedMotion)
    }
    checkPerformance()
  }, [])

  return { isLowEnd }
}
