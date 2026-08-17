import React, { useEffect, useRef, useState } from 'react'

// outExpo easing (canvas counters use outCubic/outExpo)
const outExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

export function useCountUp(target: number, opts: { duration?: number; delay?: number; comma?: boolean } = {}) {
  const { duration = 1100, delay = 150, comma = false } = opts
  const [value, setValue] = useState(0)
  const raf = useRef<number>(0)

  useEffect(() => {
    let start: number | null = null
    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (start === null) start = now
        const elapsed = now - start
        const t = Math.min(1, elapsed / duration)
        const n = Math.round(target * outExpo(t))
        setValue(n)
        if (t < 1) raf.current = requestAnimationFrame(tick)
      }
      raf.current = requestAnimationFrame(tick)
    }, delay)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf.current)
    }
  }, [target, duration, delay])

  return comma ? value.toLocaleString('en-US') : String(value)
}

export const CountUp: React.FC<{
  to: number
  duration?: number
  delay?: number
  comma?: boolean
  className?: string
}> = ({ to, duration, delay, comma, className }) => {
  const text = useCountUp(to, { duration, delay, comma })
  return <span className={`num-tabular ${className ?? ''}`}>{text}</span>
}

/** Click feedback — applies a 340ms press-bounce keyframe. */
export function usePress() {
  const ref = useRef<HTMLElement | null>(null)
  const press = () => {
    const el = ref.current
    if (!el) return
    el.classList.remove('press-bounce')
    // restart animation
    void el.offsetWidth
    el.classList.add('press-bounce')
  }
  return { ref, press }
}

export const Pressable: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: 'button' | 'div'; className?: string }
> = ({ className = '', as = 'button', onClick, children, ...rest }) => {
  const { ref, press } = usePress()
  const Tag = as as 'button'
  return (
    <Tag
      ref={ref as React.Ref<HTMLButtonElement>}
      className={className}
      onClick={e => {
        press()
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** Staggered rise-in on mount (canvas 'stg' cards). */
export const RiseIn: React.FC<{ delay?: number; className?: string; children: React.ReactNode }> = ({
  delay = 0,
  className = '',
  children,
}) => (
  <div className={`rise-in ${className}`} style={{ animationDelay: `${delay}ms` }}>
    {children}
  </div>
)

/** Pop-in for chain nodes / dials. */
export const PopIn: React.FC<{ delay?: number; className?: string; children: React.ReactNode }> = ({
  delay = 0,
  className = '',
  children,
}) => (
  <div className={`pop-in ${className}`} style={{ animationDelay: `${delay}ms` }}>
    {children}
  </div>
)

/** Bar that grows from 0 to `width`% once mounted (canvas '.bar' behavior). */
export const GrowingBar: React.FC<{
  width: number
  color?: string
  height?: string
  delay?: number
  className?: string
}> = ({ width, color = '#E8A552', height = 'h-full', delay = 300, className = '' }) => {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = window.setTimeout(() => setW(width), delay)
    return () => window.clearTimeout(t)
  }, [width, delay])
  return (
    <div className={`bar-grow h-full rounded-full ${height} ${className}`} style={{ width: `${w}%`, background: color }} />
  )
}

/** Skeleton shimmer block. */
export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-3 w-full' }) => (
  <div className={`skeleton rounded-full ${className}`} />
)
