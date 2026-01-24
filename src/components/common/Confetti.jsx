import { useEffect, useState, useMemo } from 'react'
import { useProjectStore } from '../../stores/projectStore'

// Confetti particle component
function ConfettiParticle({ style, delay }) {
    return (
        <div
            className="confetti-particle"
            style={{
                ...style,
                animationDelay: `${delay}ms`
            }}
        />
    )
}

export default function Confetti() {
    const { showCelebration, triggerCelebration } = useProjectStore()
    const [visible, setVisible] = useState(false)

    // Generate random particles
    const particles = useMemo(() => {
        const colors = [
            'var(--primary)',
            '#FFD700', // Gold
            '#FF6B6B', // Coral
            '#4ECDC4', // Teal
            '#A855F7', // Purple
            '#F97316', // Orange
            '#22C55E', // Green
        ]

        const particleCount = 150
        const arr = []

        for (let i = 0; i < particleCount; i++) {
            const size = Math.random() * 8 + 4
            const left = Math.random() * 100
            const hue = Math.random() * 360
            const delay = Math.random() * 400
            const duration = Math.random() * 1500 + 2000
            const rotation = Math.random() * 360
            const color = colors[Math.floor(Math.random() * colors.length)]

            arr.push({
                id: i,
                style: {
                    width: `${size}px`,
                    height: `${size}px`,
                    left: `${left}%`,
                    backgroundColor: color,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                    transform: `rotate(${rotation}deg)`,
                    '--fall-duration': `${duration}ms`,
                    '--horizontal-drift': `${(Math.random() - 0.5) * 200}px`,
                },
                delay
            })
        }

        return arr
    }, [visible])

    useEffect(() => {
        if (showCelebration) {
            setVisible(true)
            // Auto-hide after animation completes
            const timer = setTimeout(() => {
                setVisible(false)
                triggerCelebration(false)
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [showCelebration, triggerCelebration])

    if (!visible) return null

    return (
        <div className="confetti-container">
            {particles.map(p => (
                <ConfettiParticle key={p.id} style={p.style} delay={p.delay} />
            ))}
            <div className="celebration-text">
                <span className="celebration-emoji">🎉</span>
                <span className="celebration-word">BRAVO</span>
                <span className="celebration-emoji">🎉</span>
            </div>
        </div>
    )
}
