import type { AnimationSettings } from '../types'

export type TimelinePhase = 'enter' | 'hold' | 'exit' | 'delay'

export interface TimelineFrame {
  phase: TimelinePhase
  progress: number
  elapsedInCycle: number
}

export class AnimationTimeline {
  frameAt(elapsedMs: number, settings: AnimationSettings): TimelineFrame {
    const enter = Math.max(100, settings.enterDuration)
    const hold = Math.max(0, settings.holdDuration)
    const exit = Math.max(100, settings.exitDuration)
    const delay = Math.max(0, settings.loopDelay)
    const total = enter + hold + exit + delay
    const time = settings.loop ? elapsedMs % total : Math.min(elapsedMs, total)
    if (time < enter) return { phase: 'enter', progress: time / enter, elapsedInCycle: time }
    if (time < enter + hold) return { phase: 'hold', progress: hold ? (time - enter) / hold : 1, elapsedInCycle: time }
    if (time < enter + hold + exit) return { phase: 'exit', progress: (time - enter - hold) / exit, elapsedInCycle: time }
    return { phase: 'delay', progress: delay ? (time - enter - hold - exit) / delay : 1, elapsedInCycle: time }
  }
}
