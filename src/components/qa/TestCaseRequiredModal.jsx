import { useState, useEffect } from 'react'
import { useProjectStore } from '../../stores/projectStore'
import { X, TestTube2, AlertTriangle, Plus, Link2, Check } from 'lucide-react'

/**
 * Modal shown when user tries to move issue to Testing without a test case
 */
export default function TestCaseRequiredModal({
    isOpen,
    onClose,
    issue,
    onTestCaseLinked,
    onProceedWithoutTest
}) {
    const { testCases, testSuites, addTestCase } = useProjectStore()
    const [mode, setMode] = useState('select') // 'select' | 'create'
    const [selectedTestCaseId, setSelectedTestCaseId] = useState('')
    const [newTestCase, setNewTestCase] = useState({
        title: '',
        steps: '',
        expected: ''
    })

    // Available test cases (not already linked to another issue)
    const availableTestCases = testCases.filter(tc => !tc.issueId || tc.issueId === issue?.id)

    if (!isOpen || !issue) return null

    const handleLinkExisting = () => {
        if (selectedTestCaseId) {
            onTestCaseLinked(selectedTestCaseId)
        }
    }

    const handleCreateNew = async () => {
        if (!newTestCase.title.trim()) return

        // Create new test case
        const testCase = await addTestCase({
            title: newTestCase.title.trim(),
            steps: newTestCase.steps.trim(),
            expectedResult: newTestCase.expected.trim(),
            issueId: issue.id,
            suiteId: testSuites[0]?.id || null, // Use first suite or null
            status: 'pending'
        })

        if (testCase?.id) {
            onTestCaseLinked(testCase.id)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal test-case-required-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={20} className="text-warning" />
                        <h3>Test Case Gerekli</h3>
                    </div>
                    <button className="btn btn-icon btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <p className="warning-text">
                        <strong>{issue.key}</strong> issue'su Testing durumuna geçmeden önce
                        bir test case bağlanmalıdır.
                    </p>

                    {/* Mode Tabs */}
                    <div className="mode-tabs">
                        <button
                            className={`mode-tab ${mode === 'select' ? 'active' : ''}`}
                            onClick={() => setMode('select')}
                        >
                            <Link2 size={16} />
                            Mevcut Bağla
                        </button>
                        <button
                            className={`mode-tab ${mode === 'create' ? 'active' : ''}`}
                            onClick={() => setMode('create')}
                        >
                            <Plus size={16} />
                            Yeni Oluştur
                        </button>
                    </div>

                    {mode === 'select' && (
                        <div className="select-mode">
                            {availableTestCases.length > 0 ? (
                                <>
                                    <div className="input-group">
                                        <label className="input-label">Test Case Seç</label>
                                        <select
                                            className="input select"
                                            value={selectedTestCaseId}
                                            onChange={(e) => setSelectedTestCaseId(e.target.value)}
                                        >
                                            <option value="">Seç...</option>
                                            {availableTestCases.map(tc => (
                                                <option key={tc.id} value={tc.id}>
                                                    {tc.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleLinkExisting}
                                        disabled={!selectedTestCaseId}
                                    >
                                        <Check size={16} />
                                        Bağla ve Devam Et
                                    </button>
                                </>
                            ) : (
                                <div className="empty-state">
                                    <TestTube2 size={32} className="text-tertiary" />
                                    <p>Mevcut test case yok. Yeni bir tane oluşturun.</p>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setMode('create')}
                                    >
                                        <Plus size={16} />
                                        Yeni Oluştur
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'create' && (
                        <div className="create-mode">
                            <div className="input-group">
                                <label className="input-label">Test Case Adı *</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Örn: Login işlemi doğru çalışmalı"
                                    value={newTestCase.title}
                                    onChange={(e) => setNewTestCase({ ...newTestCase, title: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Test Adımları</label>
                                <textarea
                                    className="input"
                                    rows={3}
                                    placeholder="1. Sayfayı aç&#10;2. Butona tıkla&#10;3. Sonucu kontrol et"
                                    value={newTestCase.steps}
                                    onChange={(e) => setNewTestCase({ ...newTestCase, steps: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label">Beklenen Sonuç</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Örn: Kullanıcı başarıyla giriş yapmış olmalı"
                                    value={newTestCase.expected}
                                    onChange={(e) => setNewTestCase({ ...newTestCase, expected: e.target.value })}
                                />
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={handleCreateNew}
                                disabled={!newTestCase.title.trim()}
                            >
                                <TestTube2 size={16} />
                                Oluştur ve Devam Et
                            </button>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>
                        İptal
                    </button>
                    {onProceedWithoutTest && (
                        <button
                            className="btn btn-secondary"
                            onClick={onProceedWithoutTest}
                        >
                            Test Olmadan Devam
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
