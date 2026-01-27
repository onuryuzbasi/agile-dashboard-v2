import { useEffect, useState, useMemo, useCallback } from 'react'
import { useProjectStore } from '../../stores/projectStore'

// Star burst particle
function StarParticle({ style, delay }) {
    return (
        <div
            className="star-particle"
            style={{
                ...style,
                animationDelay: `${delay}ms`
            }}
        >
            ✦
        </div>
    )
}

// Confetti particle component
function ConfettiParticle({ style, delay, shape }) {
    return (
        <div
            className={`confetti-particle ${shape}`}
            style={{
                ...style,
                animationDelay: `${delay}ms`
            }}
        />
    )
}

// Sparkle component
function Sparkle({ style }) {
    return <div className="sparkle" style={style} />
}

export default function Confetti() {
    const { showCelebration, triggerCelebration } = useProjectStore()
    const [visible, setVisible] = useState(false)
    const [phase, setPhase] = useState(0) // 0: initial, 1: peak, 2: fadeout

    // Generate confetti particles with variety
    const particles = useMemo(() => {
        const colors = [
            '#FFD700', // Gold
            '#FF6B6B', // Coral
            '#4ECDC4', // Teal
            '#A855F7', // Purple
            '#F97316', // Orange
            '#22C55E', // Green
            '#00E5FF', // Cyan
            '#FF4081', // Pink
            '#FFEA00', // Banana Yellow
        ]

        const shapes = ['circle', 'square', 'ribbon', 'star']
        const particleCount = 200
        const arr = []

        for (let i = 0; i < particleCount; i++) {
            const size = Math.random() * 12 + 6
            const left = Math.random() * 100
            const delay = Math.random() * 600
            const duration = Math.random() * 2000 + 2500
            const rotation = Math.random() * 720 - 360
            const color = colors[Math.floor(Math.random() * colors.length)]
            const shape = shapes[Math.floor(Math.random() * shapes.length)]
            const drift = (Math.random() - 0.5) * 400
            const spinSpeed = Math.random() * 3 + 1

            arr.push({
                id: i,
                shape,
                style: {
                    width: shape === 'ribbon' ? `${size * 0.3}px` : `${size}px`,
                    height: shape === 'ribbon' ? `${size * 2}px` : `${size}px`,
                    left: `${left}%`,
                    backgroundColor: color,
                    boxShadow: `0 0 ${size / 2}px ${color}`,
                    transform: `rotate(${rotation}deg)`,
                    '--fall-duration': `${duration}ms`,
                    '--horizontal-drift': `${drift}px`,
                    '--spin-speed': `${spinSpeed}s`,
                    '--start-rotation': `${rotation}deg`,
                },
                delay
            })
        }
        return arr
    }, [visible])

    // Generate sparkles
    const sparkles = useMemo(() => {
        const arr = []
        for (let i = 0; i < 30; i++) {
            arr.push({
                id: i,
                style: {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    transform: `scale(${Math.random() * 0.5 + 0.5})`,
                }
            })
        }
        return arr
    }, [visible])

    // Generate star bursts
    const stars = useMemo(() => {
        const arr = []
        for (let i = 0; i < 25; i++) {
            arr.push({
                id: i,
                style: {
                    left: `${Math.random() * 100}%`,
                    top: `${-20}%`,
                    fontSize: `${Math.random() * 24 + 16}px`,
                    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7'][Math.floor(Math.random() * 4)],
                    '--fall-duration': `${Math.random() * 2000 + 2000}ms`,
                    '--horizontal-drift': `${(Math.random() - 0.5) * 300}px`,
                },
                delay: Math.random() * 500
            })
        }
        return arr
    }, [visible])

    // Play train horn celebration sound
    const playCelebrationSound = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)()

            // Train horn effect - layered oscillators for rich sound
            const playHorn = (baseFreq, startTime, duration, volume = 0.15) => {
                const frequencies = [baseFreq, baseFreq * 1.5, baseFreq * 2, baseFreq * 2.5]

                frequencies.forEach((freq, i) => {
                    const oscillator = audioContext.createOscillator()
                    const gainNode = audioContext.createGain()
                    const filterNode = audioContext.createBiquadFilter()

                    filterNode.type = 'lowpass'
                    filterNode.frequency.setValueAtTime(2000, audioContext.currentTime)

                    oscillator.connect(filterNode)
                    filterNode.connect(gainNode)
                    gainNode.connect(audioContext.destination)

                    oscillator.type = i === 0 ? 'sawtooth' : 'triangle'
                    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + startTime)

                    // Slight frequency wobble for realism
                    oscillator.frequency.linearRampToValueAtTime(freq * 1.02, audioContext.currentTime + startTime + 0.1)
                    oscillator.frequency.linearRampToValueAtTime(freq, audioContext.currentTime + startTime + duration)

                    const vol = volume / (i + 1)
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime)
                    gainNode.gain.linearRampToValueAtTime(vol, audioContext.currentTime + startTime + 0.05)
                    gainNode.gain.setValueAtTime(vol, audioContext.currentTime + startTime + duration - 0.1)
                    gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + startTime + duration)

                    oscillator.start(audioContext.currentTime + startTime)
                    oscillator.stop(audioContext.currentTime + startTime + duration)
                })
            }

            // Two-tone train horn pattern (typical steam train)
            playHorn(220, 0, 0.4, 0.12)      // Low A - first blast
            playHorn(277, 0.5, 0.6, 0.12)   // Higher - second blast (longer)

        } catch (e) {
            console.log('Could not play celebration sound:', e)
        }
    }, [])

    useEffect(() => {
        if (showCelebration) {
            setVisible(true)
            setPhase(1)
            playCelebrationSound()

            // Peak phase
            const peakTimer = setTimeout(() => setPhase(2), 1500)

            // Auto-hide after animation
            const hideTimer = setTimeout(() => {
                setVisible(false)
                setPhase(0)
                triggerCelebration(false)
            }, 3500)

            return () => {
                clearTimeout(peakTimer)
                clearTimeout(hideTimer)
            }
        }
    }, [showCelebration, triggerCelebration, playCelebrationSound])

    if (!visible) return null

    return (
        <div className={`confetti-container phase-${phase}`}>
            {/* Background flash */}
            <div className="celebration-flash" />

            {/* Sparkles */}
            {sparkles.map(s => (
                <Sparkle key={`sparkle-${s.id}`} style={s.style} />
            ))}

            {/* Star bursts */}
            {stars.map(s => (
                <StarParticle key={`star-${s.id}`} style={s.style} delay={s.delay} />
            ))}

            {/* Confetti particles */}
            {particles.map(p => (
                <ConfettiParticle key={p.id} style={p.style} delay={p.delay} shape={p.shape} />
            ))}

            {/* Main celebration text */}
            <div className="celebration-text">
                <span className="celebration-emoji left">🚂</span>
                <div className="celebration-word-wrapper">
                    <span className="celebration-word">DONE!</span>
                    <span className="celebration-subtitle">Great work! 🎯</span>
                </div>
                <span className="celebration-emoji right">🎉</span>
            </div>
        </div>
    )
}
