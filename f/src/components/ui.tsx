import React, { useEffect, useState } from 'react'
import { CirclePlay, Pause, FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Pressable, GrowingBar } from '@/components/motion'

/* ------------------------------------------------------------------ */
/* Surfaces                                                             */
/* ------------------------------------------------------------------ */

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...rest }) => (
  <div className={cn('card-n rounded-[20px] p-7', className)} {...rest}>
    {children}
  </div>
)

export const SectionTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <h2 className={cn('font-display text-[20px] text-ink', className)}>{children}</h2>
)

export const MonoLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <p className={cn('font-mono text-[10px] uppercase tracking-[0.14em] text-faint', className)}>{children}</p>
)

/* ------------------------------------------------------------------ */
/* Dial — animated SVG arc (canvas '.dial' behavior)                   */
/* ------------------------------------------------------------------ */

export const Dial: React.FC<{
  value: number // 0-100 percent to fill
  read: string
  unit?: string
  label?: string
  color?: string
  size?: number
  delay?: number
  detail?: string
}> = ({ value, read, unit, label, color = '#7FB069', size = 104, delay = 300, detail }) => {
  const r = size * 0.423 // 44/104 ratio
  const C = 2 * Math.PI * r
  const max = C * 0.78
  const [offset, setOffset] = useState<number>(() => C) // start empty

  useEffect(() => {
    const t = window.setTimeout(() => setOffset(C - (max * value) / 100), delay)
    return () => window.clearTimeout(t)
  }, [value, C, max, delay])

  const wrap = Math.round(size * 1.154) // 120/104 ratio
  return (
    <div className="flex flex-col items-center">
      <div className="recessed rounded-full flex items-center justify-center relative" style={{ width: wrap, height: wrap }}>
        <svg width={size} height={size} viewBox="0 0 104 104" className="-rotate-90">
          <circle
            cx="52"
            cy="52"
            r="44"
            fill="none"
            stroke="#DCD5CC"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={max}
            strokeDashoffset="0"
            transform="rotate(126 52 52)"
          />
          <circle
            className="dial-arc"
            cx="52"
            cy="52"
            r="44"
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            transform="rotate(126 52 52)"
            style={{ transitionDelay: `${delay}ms` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-[19px] font-semibold text-ink num-tabular">{read}</span>
          {unit && <span className="font-mono text-[10px] text-faint">{unit}</span>}
        </div>
      </div>
      {label && <p className="font-display text-[15px] text-ink-dim mt-3">{label}</p>}
      {detail && <p className="font-mono text-[11px] text-faint mt-1">{detail}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Chips, dots, avatars                                                 */
/* ------------------------------------------------------------------ */

export const StatusDot: React.FC<{ color?: string; pulse?: boolean; size?: number }> = ({
  color = '#7FB069',
  pulse = false,
  size = 7,
}) => (
  <span
    className={cn('rounded-full shrink-0', pulse && 'pulse-dot')}
    style={{ width: size, height: size, background: color, boxShadow: pulse ? `0 0 8px ${color}` : undefined }}
  />
)

export const Avatar: React.FC<{ initials: string; tone?: 'default' | 'terra'; size?: string }> = ({
  initials,
  tone = 'default',
  size = 'w-11 h-11',
}) => (
  <span
    className={cn(
      'recessed-sm rounded-[16px] flex items-center justify-center shrink-0 font-mono text-[12px] font-semibold',
      tone === 'terra' ? 'text-terra-ink' : 'text-ink-dim',
      size
    )}
  >
    {initials}
  </span>
)

export const ScoreChip: React.FC<{ score: number | null; className?: string }> = ({ score, className }) => {
  // null = no evidence recorded — displayed honestly as "—", never fabricated.
  const label = score == null ? '—' : score.toFixed(2)
  const tone = score == null ? 'text-faint' : score < 0.8 ? 'text-terra-ink' : 'text-amber-ink'
  return (
    <span className={cn('font-mono text-[11px] font-medium px-2.5 py-1 rounded-full recessed-sm shrink-0', tone, className)}>
      {label}
    </span>
  )
}

export const Badge: React.FC<{
  children: React.ReactNode
  tone?: 'amber' | 'sage' | 'blue' | 'terra' | 'neutral'
  className?: string
}> = ({ children, tone = 'neutral', className }) => {
  const tones: Record<string, string> = {
    amber: 'text-amber-ink',
    sage: 'text-sage-ink',
    blue: 'text-blue',
    terra: 'text-terra-ink',
    neutral: 'text-ink-dim',
  }
  return <span className={cn('font-mono text-[10px] px-2 py-[3px] rounded-full recessed-sm uppercase tracking-[0.1em] shrink-0', tones[tone], className)}>{children}</span>
}

/* ------------------------------------------------------------------ */
/* Mode toggle (canvas Live / Paused / Dry run pills)                  */
/* ------------------------------------------------------------------ */

export type ConsoleMode = 'live' | 'paused' | 'dryrun'

export const ModeToggle: React.FC<{
  mode: ConsoleMode
  onChange: (m: ConsoleMode) => void
  variant?: 'header' | 'banner'
  className?: string
}> = ({ mode, onChange, variant = 'header', className }) => {
  const root = cn(className)
  const items: { key: ConsoleMode; label: string; icon: React.ReactNode }[] = [
    { key: 'live', label: 'Live', icon: <CirclePlay className="h-[13px] w-[13px]" /> },
    { key: 'paused', label: 'Paused', icon: <Pause className="h-[13px] w-[13px]" /> },
    { key: 'dryrun', label: 'Dry run', icon: <FlaskConical className="h-[13px] w-[13px]" /> },
  ]
  if (variant === 'header') {
    return (
      <div className={cn('flex items-center gap-2', root)}>
        {items.map(it => {
          const active = mode === it.key
          return (
            <Pressable
              key={it.key}
              onClick={() => onChange(it.key)}
              className={cn(
                'press rounded-[16px] px-6 py-3 font-semibold text-[14px] flex items-center gap-2 transition-shadow duration-200',
                active ? 'recessed text-amber' : 'raised text-ink-dim'
              )}
            >
              {it.icon}
              {it.label}
            </Pressable>
          )
        })}
      </div>
    )
  }
  return (
    <div className={cn('glass rounded-[999px] p-1.5 flex items-center gap-1', root)}>
      {items.map(it => {
        const active = mode === it.key
        return (
          <Pressable
            key={it.key}
            onClick={() => onChange(it.key)}
            className={cn(
              'press rounded-[999px] px-5 py-2 text-[12px] font-semibold transition-colors duration-200',
              active ? 'bg-white text-[#14202a]' : 'text-white/70'
            )}
          >
            {it.label}
          </Pressable>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Progress track with growing bar                                     */
/* ------------------------------------------------------------------ */

export const ProgressTrack: React.FC<{
  width: number
  color?: string
  height?: string
  delay?: number
  inset?: boolean
  className?: string
}> = ({ width, color = '#E8A552', height = 'h-2.5', delay = 300, inset = true, className }) => (
  <div className={cn('rounded-full p-[3px]', height, inset ? 'recessed-sm' : '', className)}>
    <GrowingBar width={width} color={color} delay={delay} />
  </div>
)

/* ------------------------------------------------------------------ */
/* States                                                               */
/* ------------------------------------------------------------------ */

export const EmptyState: React.FC<{ title: string; hint?: string }> = ({ title, hint }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
    <p className="font-display text-[18px] text-ink-dim">{title}</p>
    {hint && <p className="font-mono text-[11px] text-faint max-w-[36ch]">{hint}</p>}
  </div>
)

export const LoadingState: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => (
  <div className="space-y-4 py-4">
    <p className="font-mono text-[11px] text-faint uppercase tracking-[0.14em]">{label}</p>
    <div className="space-y-3">
      <div className="skeleton h-4 w-2/3 rounded-full" />
      <div className="skeleton h-24 w-full rounded-[16px]" />
      <div className="skeleton h-24 w-full rounded-[16px]" />
      <div className="skeleton h-24 w-full rounded-[16px]" />
    </div>
  </div>
)

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="card-n rounded-[20px] p-8 flex flex-col items-center gap-4 text-center">
    <p className="font-display text-[18px] text-terra-ink">Something went wrong</p>
    <p className="font-mono text-[11px] text-faint max-w-[50ch]">{message}</p>
    {onRetry && (
      <Pressable onClick={onRetry} className="press raised-sm rounded-full px-5 py-2 text-[13px] font-semibold text-ink-dim">
        Retry
      </Pressable>
    )}
  </div>
)

/* ------------------------------------------------------------------ */
/* Page header (greeting used on dashboard)                            */
/* ------------------------------------------------------------------ */

export const PageHead: React.FC<{ title: string; subtitle?: string; meta?: string }> = ({ title, subtitle, meta }) => (
  <header className="flex items-start justify-between pt-2 px-1">
    <div>
      {meta && <MonoLabel className="text-[12px] tracking-wide">{meta}</MonoLabel>}
      <h1 className="font-display font-light text-[36px] text-ink leading-[1.1] mt-1.5">{title}</h1>
      {subtitle && <p className="text-[15px] text-ink-dim mt-1.5">{subtitle}</p>}
    </div>
  </header>
)

/* initials helper */
export const initialsOf = (name: string | null | undefined): string => {
  if (!name) return '··'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('')
}
