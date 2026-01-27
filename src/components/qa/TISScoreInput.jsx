import { useMemo } from 'react'
import { Zap, Gauge, Clock } from 'lucide-react'

/**
 * TIS Score Input Component
 * TIS = Impact × Size / Time
 * 
 * Higher score = Higher priority
 * - Impact: How many users affected? (1=few, 2=some, 3=many)
 * - Size: How big is the fix? (1=small, 2=medium, 3=large)
 * - Time: How urgent? (1=not urgent, 2=normal, 3=urgent → smaller divisor = higher score)
 */
export default function TISScoreInput({
    impact = 1,
    size = 1,
    time = 1,
    onChange,
    readonly = false
}) {
    // Calculate TIS score
    const tisScore = useMemo(() => {
        const i = impact || 1
        const s = size || 1
        const t = time || 1
        return Math.round((i * s / t) * 10) / 10
    }, [impact, size, time])

    // Get score color
    const getScoreColor = (score) => {
        if (score >= 6) return { bg: 'var(--danger)', label: 'Critical' }
        if (score >= 3) return { bg: 'var(--warning)', label: 'Medium' }
        return { bg: 'var(--success)', label: 'Low' }
    }

    const scoreDisplay = getScoreColor(tisScore)

    // Labels for each dimension
    const impactLabels = ['Low', 'Medium', 'High']
    const sizeLabels = ['Small', 'Medium', 'Large']
    const timeLabels = ['Later', 'Normal', 'Urgent']

    const handleChange = (field, value) => {
        if (readonly || !onChange) return
        onChange({
            impact: field === 'impact' ? value : impact,
            size: field === 'size' ? value : size,
            time: field === 'time' ? value : time
        })
    }

    return (
        <div className="tis-score-input">
            {/* Score Display */}
            <div className="tis-score-display">
                <div
                    className="tis-score-badge"
                    style={{ backgroundColor: scoreDisplay.bg }}
                >
                    <span className="tis-score-value">{tisScore}</span>
                    <span className="tis-score-label">{scoreDisplay.label}</span>
                </div>
                <span className="tis-formula">TIS = Impact × Size ÷ Time</span>
            </div>

            {/* Dimension Sliders */}
            <div className="tis-dimensions">
                {/* Impact */}
                <div className="tis-dimension">
                    <label className="tis-dim-label">
                        <Zap size={14} />
                        Impact
                    </label>
                    <div className="tis-options">
                        {[1, 2, 3].map(val => (
                            <button
                                key={val}
                                className={`tis-option ${impact === val ? 'active' : ''}`}
                                onClick={() => handleChange('impact', val)}
                                disabled={readonly}
                                title={impactLabels[val - 1]}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                    <span className="tis-dim-value">{impactLabels[(impact || 1) - 1]}</span>
                </div>

                {/* Size */}
                <div className="tis-dimension">
                    <label className="tis-dim-label">
                        <Gauge size={14} />
                        Size
                    </label>
                    <div className="tis-options">
                        {[1, 2, 3].map(val => (
                            <button
                                key={val}
                                className={`tis-option ${size === val ? 'active' : ''}`}
                                onClick={() => handleChange('size', val)}
                                disabled={readonly}
                                title={sizeLabels[val - 1]}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                    <span className="tis-dim-value">{sizeLabels[(size || 1) - 1]}</span>
                </div>

                {/* Time */}
                <div className="tis-dimension">
                    <label className="tis-dim-label">
                        <Clock size={14} />
                        Urgency
                    </label>
                    <div className="tis-options">
                        {[1, 2, 3].map(val => (
                            <button
                                key={val}
                                className={`tis-option ${time === val ? 'active' : ''}`}
                                onClick={() => handleChange('time', val)}
                                disabled={readonly}
                                title={timeLabels[val - 1]}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                    <span className="tis-dim-value">{timeLabels[(time || 1) - 1]}</span>
                </div>
            </div>
        </div>
    )
}
