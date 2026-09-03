import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Delete,
  RotateCcw,
  Timer,
  Trophy,
  Copy,
  Share2,
  Keyboard,
  Zap,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Terminal,
  Bot,
  User,
  Shield,
  Bomb,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Gauge,
  Flame,
  Skull,
  Crosshair,
  TrendingUp,
  Volume2,
  VolumeX,
  MessageSquareQuote,
  Sparkles,
} from 'lucide-react'
import confetti from 'canvas-confetti'

/* ────────────────────────────────────────────────────────────
   AUDIO SYNTHESIS ENGINE (Web Audio API - No external assets required)
   ──────────────────────────────────────────────────────────── */
class SoundEngine {
  constructor() {
    this.ctx = null
    this.muted = false
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  playKeypress() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(450, now)
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.04)

      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now)
      osc.stop(now + 0.04)
    } catch (e) {
      // Audio error ignored
    }
  }

  playBackspace() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      // Dramatic "DUN DUN" low punch sound
      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc1.type = 'sawtooth'
      osc2.type = 'sine'

      osc1.frequency.setValueAtTime(110, now) // A2
      osc1.frequency.exponentialRampToValueAtTime(40, now + 0.25)

      osc2.frequency.setValueAtTime(55, now) // A1 sub-bass
      osc2.frequency.exponentialRampToValueAtTime(30, now + 0.25)

      gain.gain.setValueAtTime(0.35, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(this.ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.25)
      osc2.stop(now + 0.25)
    } catch (e) {
      // Audio error ignored
    }
  }

  playRapidCombo() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return

    try {
      const now = this.ctx.currentTime
      // Aggressive paper crumpling / record scratch noise synthesis
      const bufferSize = this.ctx.sampleRate * 0.3
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3))
      }

      const noise = this.ctx.createBufferSource()
      noise.buffer = buffer

      const filter = this.ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1200, now)
      filter.Q.setValueAtTime(3, now)

      const gain = this.ctx.createGain()
      gain.gain.setValueAtTime(0.4, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3)

      noise.connect(filter)
      filter.connect(gain)
      gain.connect(this.ctx.destination)

      noise.start(now)
    } catch (e) {
      // Audio error ignored
    }
  }
}

const audioEngine = new SoundEngine()

/* ────────────────────────────────────────────────────────────
   CONFESSIONAL MESSAGES GENERATOR
   ──────────────────────────────────────────────────────────── */
const CONFESSIONAL_TEMPLATES = [
  (char) => `RIP letter '${char}' (2026–2026). You didn't deserve to be erased.`,
  (char) => `You hesitated on that '${char}' for far too long.`,
  (char) => `Deleting '${char}' won't delete your past mistakes.`,
  (char) => `Letter '${char}' has entered the digital void forever.`,
  (char) => `Your backspace key is your toxic emotional crutch. '${char}' deserved better.`,
  (char) => `Self-doubt detected: Goodbye '${char}'.`,
  (char) => `Erased '${char}' with extreme prejudice.`,
]

/* ────────────────────────────────────────────────────────────
   TARGET PARAGRAPHS — Tricky 30-word sentences with extra commas & dots
   ──────────────────────────────────────────────────────────── */
const PARAGRAPHS = [
  `Quick, deliberate, yet completely, utterly, terribly hesitant... Every single, tiny, rogue comma, and unexpected, misplaced dot... will inevitably, painfully, trigger your ultimate... inescapable, tragic, backspace... spiral, forever, and ever.`,

  `Wait, pause, reconsider, rethink... Did you, really, intend, to type, that, ridiculous, rogue, misplaced comma... or that, dramatic, unexpected, extra dot... before your, frantic, panicked, backspace... completely destroyed it?`,

  `Stop, look, listen, hesitate... Type, type, type, then... smash, hit, hammer, erase... Every, single, unnecessary, extra, misplaced, rogue, period... and comma, will, cost, you, precious, seconds, forever.`,
]

const TIMER_OPTIONS = [
  { label: '30 sec', value: 30 },
  { label: '1 min', value: 60 },
  { label: '2 min', value: 120 },
]

/* ────────────────────────────────────────────────────────────
   DARK HUMOR ANIMAL CLASSIFICATIONS (The More You Type & Backspace, The DUMBER You Become!)
   ──────────────────────────────────────────────────────────── */
function getAnimalClassification(wpm, backspaces, totalErrors) {
  // Chaos index combines typing volume and frantic backspace smashing
  const chaosScore = backspaces * 2 + totalErrors * 1.5 + (wpm > 60 ? (wpm - 60) * 0.5 : 0)

  if (chaosScore < 10) {
    return {
      title: 'Wise Philosopher Owl',
      animal: '🦉',
      tagline: 'Calm, minimal keypresses, maximum intellect',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/30',
      roast: 'You typed very little and barely touched backspace. You retained your sanity and dignity.',
    }
  }
  if (chaosScore < 25) {
    return {
      title: 'Distracted Golden Retriever',
      animal: '🐕',
      tagline: 'Eager, friendly, starting to lose focus',
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/30',
      roast: 'You typed with enthusiasm, but your backspacing reveals your brain is slowly chasing squirrels.',
    }
  }
  if (chaosScore < 45) {
    return {
      title: 'Confused Pigeon',
      animal: '🐦',
      tagline: 'Pecking aggressively, zero long-term planning',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/30',
      roast: 'The more characters you churn out, the dumber your choices get. You peck at keys like breadcrumbs on a sidewalk.',
    }
  }
  if (chaosScore < 70) {
    return {
      title: 'Brain-Empty Goldfish',
      animal: '🐠',
      tagline: '3-second memory span, erasing every sentence twice',
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
      border: 'border-orange-400/30',
      roast: 'Your typing volume is high, but your brain capacity has completely evaporated. You delete words before your 3-second memory even registers them.',
    }
  }
  if (chaosScore < 100) {
    return {
      title: 'Headless Chicken on Sugar High',
      animal: '🐓',
      tagline: 'Frantic button mashing, complete cognitive collapse',
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-400/30',
      roast: 'Absolute brainrot typing! You hit backspace so violently that your IQ dropped by 40 points in 30 seconds.',
    }
  }
  return {
    title: 'Lobotomized Single-Celled Amoeba',
    animal: '🦠',
    tagline: 'Zero brain cells remaining, purely primitive backspace reflex',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/30',
    roast: 'CONGRATULATIONS! You typed and backspaced so excessively that you officially devolved into a primordial blob with single-digit IQ.',
  }
}

/* ────────────────────────────────────────────────────────────
   ROAST BADGES GENERATOR
   ──────────────────────────────────────────────────────────── */
function getDarkRoastBadge(backspaces, commaErrors, commaErased, dotErrors, dotErased, wrongCount) {
  if (commaErrors + commaErased > 4) {
    return {
      title: 'Comma Serial Killer',
      icon: '🔪',
      text: 'You treat commas like optional garnishes in a dumpster fire.',
    }
  }
  if (dotErrors + dotErased > 4) {
    return {
      title: 'Period Phobic',
      icon: '🛑',
      text: 'You have a deep psychological fear of ending sentences.',
    }
  }
  if (backspaces > 40) {
    return {
      title: 'Backspace Addict',
      icon: '💊',
      text: 'You hit backspace more times than a guilty politician deletes emails.',
    }
  }
  if (wrongCount > 15) {
    return {
      title: 'Fat-Finger Maestro',
      icon: '🌭',
      text: 'Your fingers hit 3 keys at once. Consider taking boxing gloves off.',
    }
  }
  return {
    title: 'Suspiciously Normal',
    icon: '👁️',
    text: 'Not enough chaos. You are hiding dark secrets behind that calm typing.',
  }
}

/* ────────────────────────────────────────────────────────────
   MAIN APP COMPONENT
   ──────────────────────────────────────────────────────────── */
export default function App() {
  // ── Mode & Timer selection ──
  const [selectedDuration, setSelectedDuration] = useState(30)
  const [timeLeft, setTimeLeft] = useState(30)

  // ── State ──
  const [paragraphIndex, setParagraphIndex] = useState(
    () => Math.floor(Math.random() * PARAGRAPHS.length)
  )
  const [typed, setTyped] = useState('')
  const [backspaceCount, setBackspaceCount] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [isFinished, setIsFinished] = useState(false)
  const [bpm, setBpm] = useState(0)
  const [wpm, setWpm] = useState(0)
  const [backspaceAnimKey, setBackspaceAnimKey] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Regret Timeline Data Points: [{ time: 0, count: 0 }, ...]
  const [regretHistory, setRegretHistory] = useState([{ time: 0, count: 0 }])
  const backspaceTimestampsRef = useRef([])

  // Backspace Confessional Modal / Notification
  const [confessionalMsg, setConfessionalMsg] = useState(null)
  const confessionalTimerRef = useRef(null)

  // Detailed error metrics
  const [wrongCharCount, setWrongCharCount] = useState(0)
  const [correctCharCount, setCorrectCharCount] = useState(0)
  const [commaErrors, setCommaErrors] = useState(0)
  const [dotErrors, setDotErrors] = useState(0)
  const [commaErasedCount, setCommaErasedCount] = useState(0)
  const [dotErasedCount, setDotErasedCount] = useState(0)

  const inputRef = useRef(null)
  const timerRef = useRef(null)
  const target = PARAGRAPHS[paragraphIndex]

  // Toggle Mute Audio
  const toggleMute = (e) => {
    e.stopPropagation()
    audioEngine.muted = !isMuted
    setIsMuted(!isMuted)
  }

  // Update duration selection before start
  const handleDurationSelect = (duration) => {
    if (startTime) return
    setSelectedDuration(duration)
    setTimeLeft(duration)
  }

  // ── Countdown Timer tick ──
  useEffect(() => {
    if (startTime && !isFinished) {
      timerRef.current = setInterval(() => {
        const now = Date.now()
        const secs = (now - startTime) / 1000
        setElapsed(secs)

        const remaining = Math.max(0, selectedDuration - secs)
        setTimeLeft(remaining)

        // Continuous record for Regret Timeline
        setRegretHistory((prev) => {
          const roundedSec = Math.floor(secs)
          const lastPoint = prev[prev.length - 1]
          if (!lastPoint || lastPoint.time !== roundedSec) {
            return [...prev, { time: roundedSec, count: backspaceCount }].slice(-30)
          } else {
            return [...prev.slice(0, -1), { time: roundedSec, count: backspaceCount }]
          }
        })

        // Calculate metrics continuously
        if (secs > 0) {
          setBpm((backspaceCount / secs) * 60)
          const calcWpm = ((correctCharCount / 5) / (secs / 60))
          setWpm(calcWpm > 0 ? calcWpm : 0)
        }

        // Stop test when countdown hits 0
        if (remaining <= 0) {
          clearInterval(timerRef.current)
          setIsFinished(true)
          setElapsed(selectedDuration)
          setBpm((backspaceCount / selectedDuration) * 60)
          const finalWpm = ((correctCharCount / 5) / (selectedDuration / 60))
          setWpm(finalWpm > 0 ? finalWpm : 0)
          setTimeout(() => {
            setShowResults(true)
            fireConfetti()
          }, 300)
        }
      }, 100)
    }
    return () => clearInterval(timerRef.current)
  }, [startTime, isFinished, backspaceCount, correctCharCount, selectedDuration])

  // ── Finish detection when text ends early ──
  useEffect(() => {
    if (typed.length === target.length && typed.length > 0 && !isFinished) {
      setIsFinished(true)
      clearInterval(timerRef.current)
      const secs = Math.min(selectedDuration, (Date.now() - startTime) / 1000)
      setElapsed(secs)
      setBpm(secs > 0 ? (backspaceCount / secs) * 60 : 0)
      const finalWpm = secs > 0 ? ((correctCharCount / 5) / (secs / 60)) : 0
      setWpm(finalWpm)
      setTimeout(() => {
        setShowResults(true)
        fireConfetti()
      }, 400)
    }
  }, [typed, target, startTime, backspaceCount, correctCharCount, selectedDuration, isFinished])

  // ── Auto-focus ──
  useEffect(() => {
    inputRef.current?.focus()
  }, [paragraphIndex, selectedDuration])

  // ── Confetti ──
  const fireConfetti = useCallback(() => {
    const count = 200
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 }
    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        particleCount: Math.floor(count * particleRatio),
        origin: { x: Math.random(), y: Math.random() * 0.4 },
        colors: ['#34d399', '#6ee7b7', '#22d3ee', '#a78bfa', '#fbbf24'],
        ...opts,
      })
    }
    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
  }, [])

  // Trigger Backspace Confessional Toast
  const triggerConfessional = (erasedChar) => {
    const displayChar = erasedChar === ' ' ? 'SPACE' : erasedChar
    const templateIndex = Math.floor(Math.random() * CONFESSIONAL_TEMPLATES.length)
    const msg = CONFESSIONAL_TEMPLATES[templateIndex](displayChar)
    setConfessionalMsg(msg)

    if (confessionalTimerRef.current) clearTimeout(confessionalTimerRef.current)
    confessionalTimerRef.current = setTimeout(() => {
      setConfessionalMsg(null)
    }, 2400)
  }

  // ── Key handler ──
  const handleKeyDown = useCallback(
    (e) => {
      if (isFinished || timeLeft <= 0) return

      const now = Date.now()
      if (!startTime && (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete')) {
        setStartTime(now)
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        setBackspaceCount((c) => c + 1)
        setBackspaceAnimKey((k) => k + 1)

        // Rapid backspacing check (>5 times in 2 seconds)
        const recentTimestamps = backspaceTimestampsRef.current.filter(
          (t) => now - t <= 2000
        )
        recentTimestamps.push(now)
        backspaceTimestampsRef.current = recentTimestamps

        if (recentTimestamps.length >= 5) {
          audioEngine.playRapidCombo()
        } else {
          audioEngine.playBackspace()
        }

        if (typed.length > 0) {
          const lastChar = typed[typed.length - 1]
          const expectedLast = target[typed.length - 1]

          if (lastChar === expectedLast) {
            setCorrectCharCount((c) => Math.max(0, c - 1))
          }

          if (lastChar === ',') setCommaErasedCount((c) => c + 1)
          if (lastChar === '.') setDotErasedCount((c) => c + 1)
          setTyped((prev) => prev.slice(0, -1))

          // Trigger Confessional Toast
          triggerConfessional(lastChar)
        }
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        return
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        audioEngine.playKeypress()

        if (typed.length < target.length) {
          const expectedChar = target[typed.length]
          const isWrong = e.key !== expectedChar

          if (isWrong) {
            setWrongCharCount((w) => w + 1)
            if (expectedChar === ',' || e.key === ',') setCommaErrors((ce) => ce + 1)
            if (expectedChar === '.' || e.key === '.') setDotErrors((de) => de + 1)
          } else {
            setCorrectCharCount((c) => c + 1)
          }

          setTyped((prev) => prev + e.key)
        }
      }
    },
    [isFinished, timeLeft, startTime, typed, target]
  )

  // ── Reset ──
  const handleReset = useCallback(() => {
    setTyped('')
    setBackspaceCount(0)
    setWrongCharCount(0)
    setCorrectCharCount(0)
    setCommaErrors(0)
    setDotErrors(0)
    setCommaErasedCount(0)
    setDotErasedCount(0)
    setStartTime(null)
    setElapsed(0)
    setTimeLeft(selectedDuration)
    setIsFinished(false)
    setBpm(0)
    setWpm(0)
    setShowResults(false)
    setCopied(false)
    setRegretHistory([{ time: 0, count: 0 }])
    backspaceTimestampsRef.current = []
    setConfessionalMsg(null)
    setParagraphIndex((i) => (i + 1) % PARAGRAPHS.length)
    clearInterval(timerRef.current)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [selectedDuration])

  // ── Try Again ──
  const handleTryAgain = useCallback(() => {
    setTyped('')
    setBackspaceCount(0)
    setWrongCharCount(0)
    setCorrectCharCount(0)
    setCommaErrors(0)
    setDotErrors(0)
    setCommaErasedCount(0)
    setDotErasedCount(0)
    setStartTime(null)
    setElapsed(0)
    setTimeLeft(selectedDuration)
    setIsFinished(false)
    setBpm(0)
    setWpm(0)
    setShowResults(false)
    setCopied(false)
    setRegretHistory([{ time: 0, count: 0 }])
    backspaceTimestampsRef.current = []
    setConfessionalMsg(null)
    clearInterval(timerRef.current)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [selectedDuration])

  // ── Copy certificate ──
  const handleCopy = useCallback(() => {
    const animal = getAnimalClassification(wpm, backspaceCount, wrongCharCount)
    const badge = getDarkRoastBadge(backspaceCount, commaErrors, commaErasedCount, dotErrors, dotErasedCount, wrongCharCount)
    const cert = [
      '═════════════════════════════════════════',
      ' 💀 BACKSPACE PER MINUTE & WPM ROAST REPORT',
      '═════════════════════════════════════════',
      '',
      `  Animal Spirit:     ${animal.animal} ${animal.title}`,
      `  Typing Speed:      ${wpm.toFixed(1)} WPM`,
      `  Backspace Speed:   ${bpm.toFixed(1)} BPM`,
      `  Total Backspaces:  ${backspaceCount}`,
      `  Wrong Keys Hit:    ${wrongCharCount}`,
      `  Comma Mistakes:    ${commaErrors} wrong, ${commaErasedCount} erased`,
      `  Dot Mistakes:      ${dotErrors} wrong, ${dotErasedCount} erased`,
      `  Badge:             ${badge.icon} ${badge.title}`,
      '',
      `  Roast: "${animal.roast}"`,
      '═════════════════════════════════════════',
    ].join('\n')
    navigator.clipboard.writeText(cert).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }, [wpm, bpm, backspaceCount, wrongCharCount, commaErrors, commaErasedCount, dotErrors, dotErasedCount])

  // ── Share ──
  const handleShare = useCallback(() => {
    const animal = getAnimalClassification(wpm, backspaceCount, wrongCharCount)
    const text = `💀 My Typing Animal: ${animal.animal} ${animal.title}\n⚡ Speed: ${wpm.toFixed(1)} WPM | 🔙 BPM: ${bpm.toFixed(1)}\n🔥 Backspaces: ${backspaceCount} | Wrong Chars: ${wrongCharCount}\n\nRoast: "${animal.roast}"`
    if (navigator.share) {
      navigator.share({ title: 'My Typing Spirit Animal', text })
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      })
    }
  }, [wpm, bpm, backspaceCount, wrongCharCount])

  function formatTime(secs) {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const renderTarget = () => {
    return target.split('').map((char, i) => {
      let className = 'font-mono text-base sm:text-lg leading-relaxed transition-colors duration-75 '
      if (i < typed.length) {
        if (typed[i] === char) {
          className += 'text-slate-600'
        } else {
          className += 'text-red-400 bg-red-400/20 rounded-sm font-bold'
        }
      } else if (i === typed.length) {
        className += 'text-emerald-300 border-l-2 border-emerald-400 animate-blink pl-px'
      } else {
        className += 'text-slate-300'
      }
      return (
        <span key={i} className={className}>
          {char}
        </span>
      )
    })
  }

  const progress = target.length > 0 ? (typed.length / target.length) * 100 : 0

  // Sparkline generator helper
  const renderSparklinePath = () => {
    if (regretHistory.length < 2) return ''
    const width = 600
    const height = 50
    const maxVal = Math.max(...regretHistory.map((d) => d.count), 5)
    const points = regretHistory.map((d, index) => {
      const x = (index / (regretHistory.length - 1)) * width
      const y = height - (d.count / maxVal) * (height - 10) - 5
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    return points.join(' L ')
  }

  // ═══════════════════════════════════════════════════
  //   RESULTS SCREEN WITH DARK HUMOR & ANIMAL CLASSIFICATION
  // ═══════════════════════════════════════════════════
  if (showResults) {
    const animal = getAnimalClassification(wpm, backspaceCount, wrongCharCount)
    const badge = getDarkRoastBadge(backspaceCount, commaErrors, commaErasedCount, dotErrors, dotErasedCount, wrongCharCount)

    return (
      <div className="min-h-screen bg-[var(--color-terminal-bg)] relative overflow-hidden">
        <div className="scanline-overlay" />

        {/* Ambient background glows */}
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center gap-6">
          {/* Header */}
          <div className="animate-fade-in text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Skull className="w-5 h-5 text-red-400" />
              <span className="text-xs font-mono uppercase tracking-[0.3em] text-red-400/90 font-bold">
                {selectedDuration}s Test — Brutal Analysis
              </span>
              <Skull className="w-5 h-5 text-red-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold shimmer-text font-mono">
              TYPING SPIRIT ANIMAL REPORT
            </h1>
          </div>

          {/* ANIMAL CLASSIFICATION CARD */}
          <div
            className={`animate-slide-up glass-card rounded-2xl p-6 sm:p-8 w-full border ${animal.border} relative overflow-hidden`}
            style={{ animationDelay: '0.1s' }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className={`text-5xl sm:text-6xl p-3 rounded-2xl ${animal.bg} border ${animal.border}`}>
                  {animal.animal}
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500 mb-1">
                    Your Animal Spirit
                  </div>
                  <h2 className={`text-2xl sm:text-3xl font-extrabold font-mono ${animal.color}`}>
                    {animal.title}
                  </h2>
                  <p className="text-xs font-mono text-slate-400 mt-1">
                    "{animal.tagline}"
                  </p>
                </div>
              </div>

              {/* Dark Roast Badge */}
              <div className="hidden sm:flex flex-col items-end bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <span>{badge.icon}</span> {badge.title}
                </span>
              </div>
            </div>

            {/* Dark Humor Roast Box */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 mt-3 relative">
              <div className="flex items-center gap-2 text-red-400 text-xs font-mono font-bold uppercase mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>The Brutal Verdict</span>
              </div>
              <p className="text-sm font-mono text-slate-300 leading-relaxed italic">
                "{animal.roast}"
              </p>
            </div>
          </div>

          {/* SPEED METRICS DUAL DISPLAY (WPM + BPM) */}
          <div
            className="animate-slide-up grid grid-cols-1 sm:grid-cols-2 gap-4 w-full"
            style={{ animationDelay: '0.2s' }}
          >
            {/* WPM Speed */}
            <div className="glass-card rounded-2xl p-6 text-center border border-emerald-500/20 box-glow-green">
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span>Typing Speed (WPM)</span>
              </div>
              <div className="text-5xl sm:text-6xl font-extrabold font-mono text-emerald-400 text-glow-green">
                {wpm.toFixed(1)}
              </div>
              <p className="text-xs font-mono text-slate-500 mt-2">Words Per Minute</p>
            </div>

            {/* BPM Backspace Speed */}
            <div className="glass-card rounded-2xl p-6 text-center border border-red-500/20">
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-red-400 uppercase tracking-widest mb-2">
                <Delete className="w-4 h-4 text-red-400" />
                <span>Backspace Speed (BPM)</span>
              </div>
              <div className="text-5xl sm:text-6xl font-extrabold font-mono text-red-400 text-glow-red">
                {bpm.toFixed(1)}
              </div>
              <p className="text-xs font-mono text-slate-500 mt-2">Backspaces Per Minute</p>
            </div>
          </div>

          {/* DETAILED ERROR & PUNCTUATION BREAKDOWN */}
          <div
            className="animate-slide-up glass-card rounded-2xl p-6 w-full border border-slate-800"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-mono font-bold text-cyan-400 uppercase tracking-wider">
                  Detailed Error & Punctuation Crime Sheet
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Duration: {selectedDuration}s
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Backspace Count */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-red-500/20">
                <div className="text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
                  <span>Backspaces</span>
                  <Delete className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-red-400">{backspaceCount}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">Total erasures</div>
              </div>

              {/* Wrong Characters */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-amber-500/20">
                <div className="text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
                  <span>Mistyped</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-amber-400">{wrongCharCount}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">Key press errors</div>
              </div>

              {/* Comma Report */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-cyan-500/20">
                <div className="text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
                  <span>Comma ( , )</span>
                  <span className="text-cyan-400 font-bold text-base">,</span>
                </div>
                <div className="text-2xl font-bold font-mono text-cyan-400">
                  {commaErrors + commaErasedCount}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  {commaErrors} wrong, {commaErasedCount} erased
                </div>
              </div>

              {/* Dot Report */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-purple-500/20">
                <div className="text-[11px] font-mono uppercase text-slate-400 mb-1 flex items-center justify-between">
                  <span>Dot ( . )</span>
                  <span className="text-purple-400 font-bold text-base">.</span>
                </div>
                <div className="text-2xl font-bold font-mono text-purple-400">
                  {dotErrors + dotErasedCount}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">
                  {dotErrors} wrong, {dotErasedCount} erased
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="animate-slide-up flex flex-col sm:flex-row gap-3 w-full"
            style={{ animationDelay: '0.4s' }}
          >
            <button
              id="try-again-btn"
              onClick={handleTryAgain}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-400 font-mono font-semibold rounded-xl transition-all duration-200 cursor-pointer text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            <button
              id="copy-cert-btn"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-400 font-mono font-semibold rounded-xl transition-all duration-200 cursor-pointer text-sm"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Copied Roast!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Animal Roast
                </>
              )}
            </button>
            <button
              id="share-score-btn"
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 hover:border-purple-400/50 text-purple-400 font-mono font-semibold rounded-xl transition-all duration-200 cursor-pointer text-sm"
            >
              <Share2 className="w-4 h-4" />
              Share Spirit Animal
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════
  //   TYPING SCREEN
  // ═══════════════════════════════════════════════════
  return (
    <div
      className="min-h-screen bg-[var(--color-terminal-bg)] relative overflow-hidden flex flex-col justify-between"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="scanline-overlay" />

      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── BACKSPACE CONFESSIONAL FLOATING TOAST ── */}
      {confessionalMsg && (
        <div className="fixed top-5 right-5 z-50 animate-bounce bg-slate-900/95 border border-red-500/40 text-red-300 font-mono text-xs px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 max-w-xs sm:max-w-sm">
          <MessageSquareQuote className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{confessionalMsg}</span>
        </div>
      )}

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 sm:py-8 flex flex-col gap-5 w-full">
        {/* ── HEADER ── */}
        <header className="text-center animate-float-up">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Terminal className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl sm:text-2xl font-extrabold font-mono tracking-tight text-emerald-400 text-glow-green">
              BACKSPACE PER MINUTE
            </h1>
            <Terminal className="w-6 h-6 text-emerald-400" />
          </div>

          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-mono text-emerald-400/80 tracking-[0.15em] uppercase">
                Speed & Erasure Roast Test
              </span>
            </div>

            {/* Live Current Animal Intelligence Badge */}
            {(() => {
              const liveAnimal = getAnimalClassification(wpm, backspaceCount, wrongCharCount)
              return (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${liveAnimal.bg} border ${liveAnimal.border} text-xs font-mono ${liveAnimal.color}`}>
                  <span>{liveAnimal.animal}</span>
                  <span className="font-bold">{liveAnimal.title}</span>
                </div>
              )
            })()}

            {/* Mute Audio Toggle */}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
              title={isMuted ? 'Unmute Sound Effects Engine' : 'Mute Sound Effects Engine'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>

          {/* ── COUNTDOWN TIMER SELECTOR ── */}
          <div className="flex items-center justify-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 mr-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Select Test Time:</span>
            </div>
            {TIMER_OPTIONS.map((option) => {
              const isSelected = selectedDuration === option.value
              return (
                <button
                  key={option.value}
                  disabled={!!startTime}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDurationSelect(option.value)
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-200 cursor-pointer border ${isSelected
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 box-glow-green'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    } ${startTime ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </header>

        {/* ── LIVE COUNTERS ── */}
        <div
          className="animate-float-up grid grid-cols-2 gap-3 sm:gap-4"
          style={{ animationDelay: '0.1s' }}
        >
          {/* Backspace Counter */}
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-red-400/10 flex items-center justify-center flex-shrink-0">
              <Delete className="w-5 h-5 text-red-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500 mb-0.5 truncate">
                Backspaces Hit
              </div>
              <div
                key={backspaceAnimKey}
                className="text-2xl sm:text-3xl font-extrabold font-mono text-red-400 animate-count-pop"
              >
                {backspaceCount}
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-cyan-400/10 flex items-center justify-center flex-shrink-0">
              <Timer className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500 mb-0.5 truncate">
                Time Remaining
              </div>
              <div
                className={`text-2xl sm:text-3xl font-extrabold font-mono ${timeLeft <= 5 && startTime ? 'text-red-400 animate-pulse' : 'text-cyan-400'
                  }`}
              >
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>

        {/* ── LIVE WPM & BPM READOUT ── */}
        <div
          className="animate-float-up glass-card rounded-xl p-3.5 px-5 flex items-center justify-between"
          style={{ animationDelay: '0.15s' }}
        >
          <div className="flex items-center gap-6 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-emerald-400" />
              <span>Speed:</span>
              <span className="text-base font-bold text-emerald-400 text-glow-green">
                {wpm.toFixed(1)} WPM
              </span>
            </div>

            <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
              <Delete className="w-4 h-4 text-red-400" />
              <span>Erasures:</span>
              <span className="text-base font-bold text-red-400 text-glow-red">
                {bpm.toFixed(1)} BPM
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-500">
            <span>Errors: <strong className="text-amber-400">{wrongCharCount}</strong></span>
            <span>Commas: <strong className="text-cyan-400">{commaErrors + commaErasedCount}</strong></span>
            <span>Dots: <strong className="text-purple-400">{dotErrors + dotErasedCount}</strong></span>
          </div>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div
          className="animate-float-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1.5">
            <span>Progress</span>
            <span>{typed.length} / {target.length}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-amber-400 rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── TYPING AREA ── */}
        <div
          className="animate-float-up typing-area glass-card rounded-2xl p-5 sm:p-7 border border-slate-700/50 transition-all duration-300 relative cursor-text min-h-[160px]"
          style={{ animationDelay: '0.25s' }}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Hidden input for key capture */}
          <textarea
            ref={inputRef}
            id="typing-input"
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
            onKeyDown={handleKeyDown}
            autoFocus
            aria-label="Typing input area"
          />

          {/* Rendered text */}
          <div className="select-none leading-[2]" id="text-display">
            {renderTarget()}
          </div>

          {/* Focus hint */}
          {!startTime && typed.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm rounded-2xl transition-opacity duration-300">
              <div className="text-center">
                <Keyboard className="w-8 h-8 text-emerald-400/60 mx-auto mb-2 animate-bounce" />
                <p className="text-sm font-mono text-emerald-400/80">
                  Select time ({selectedDuration}s) & start typing...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── RESTART BUTTON ── */}
        <div
          className="animate-float-up flex justify-center"
          style={{ animationDelay: '0.35s' }}
        >
          <button
            id="restart-btn"
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 font-mono font-medium rounded-xl transition-all duration-200 cursor-pointer text-sm group"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-[-180deg] transition-transform duration-500" />
            Reset / Next Paragraph
            <ChevronRight className="w-4 h-4 opacity-50" />
          </button>
        </div>
      </div>

      {/* ── 1. REGRET TIMELINE (Visual Graph Sparkline at Bottom) ── */}
      <footer className="w-full bg-slate-950/80 border-t border-red-500/20 backdrop-blur-md px-4 py-3 mt-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-red-400 font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-red-400" />
              <span>Regret Timeline (Existential Crisis Sparkline)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 italic">
              "Our algorithm tracks your exact moments of existential crisis in real-time."
            </span>
          </div>

          {/* Sparkline Chart */}
          <div className="w-full h-12 bg-slate-900/90 rounded-lg border border-slate-800 relative overflow-hidden flex items-center px-2">
            {regretHistory.length >= 2 ? (
              <svg className="w-full h-full overflow-visible" viewBox="0 0 600 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="regretGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f87171" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d={`M 0,50 L ${renderSparklinePath()} L 600,50 Z`}
                  fill="url(#regretGradient)"
                />
                <path
                  d={`M ${renderSparklinePath()}`}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <div className="w-full text-center text-xs font-mono text-slate-600">
                Start typing & backspacing to generate self-doubt graph...
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
