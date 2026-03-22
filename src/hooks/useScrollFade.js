import { useEffect, useRef } from 'react'

export const useScrollFade = (threshold = 0.12) => {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.style.opacity = '0'
    el.style.transform = 'translateY(22px)'
    el.style.transition = 'opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1)'

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          obs.unobserve(el)
        }
      },
      { threshold }
    )
    obs.observe(el)

    return () => obs.disconnect()
  }, [threshold])

  return ref
}

export const useScrollFadeAll = (selector = '[data-fade]') => {
  useEffect(() => {
    const elements = document.querySelectorAll(selector)
    if (!elements.length) return

    elements.forEach((el) => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(22px)'
      el.style.transition = 'opacity 0.55s cubic-bezier(0.4,0,0.2,1), transform 0.55s cubic-bezier(0.4,0,0.2,1)'
    })

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    elements.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [selector])
}
