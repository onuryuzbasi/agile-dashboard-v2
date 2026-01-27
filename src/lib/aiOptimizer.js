/**
 * AI Optimizer Service
 * Uses Google Gemini API for QA optimization
 * 
 * Features:
 * - Generate test cases from issue descriptions
 * - Suggest bug priorities based on context
 * - Recommend test coverage improvements
 * - Smart bug assignment suggestions
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

/**
 * Call Gemini API with a prompt
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string>} - The generated response text
 */
async function callGemini(prompt) {
    if (!GEMINI_API_KEY) {
        console.warn('VITE_GEMINI_API_KEY not set. AI features disabled.')
        return null
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                }
            })
        })

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`)
        }

        const data = await response.json()
        return data.candidates?.[0]?.content?.parts?.[0]?.text || null
    } catch (error) {
        console.error('Gemini API call failed:', error)
        return null
    }
}

/**
 * Generate test cases for an issue
 * @param {Object} issue - The issue to generate test cases for
 * @returns {Promise<Array>} - Array of suggested test cases
 */
export async function generateTestCasesForIssue(issue) {
    const prompt = `You are a QA engineer. Given the following software issue, generate 3-5 test cases.

Issue:
- Key: ${issue.key}
- Type: ${issue.type}
- Summary: ${issue.summary}
- Description: ${issue.description || 'No description provided'}

For each test case, provide:
1. Title (brief, action-oriented)
2. Steps (numbered list of actions)
3. Expected Result

Format your response as JSON array:
[
  {
    "title": "Test case title",
    "steps": ["Step 1", "Step 2", "Step 3"],
    "expected": "Expected result"
  }
]

Only output valid JSON, no markdown or explanation.`

    const response = await callGemini(prompt)
    if (!response) return []

    try {
        // Try to parse JSON from response
        const jsonMatch = response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
        return []
    } catch (error) {
        console.error('Failed to parse test cases:', error)
        return []
    }
}

/**
 * Suggest TIS scores for a bug based on its description
 * @param {Object} bug - The bug issue
 * @returns {Promise<Object>} - Suggested TIS values
 */
export async function suggestBugPriority(bug) {
    const prompt = `You are a QA expert. Analyze this bug and suggest priority scores.

Bug:
- Summary: ${bug.summary}
- Description: ${bug.description || 'No description'}
- Found in Build: ${bug.found_in_build || 'Unknown'}

Rate each on a scale of 1-3:
- Impact: How many users affected? (1=few, 2=some, 3=many)
- Size: How complex is the fix? (1=small, 2=medium, 3=large)
- Urgency: How urgent? (1=can wait, 2=normal, 3=urgent)

Respond with ONLY a JSON object:
{
  "impact": 1-3,
  "size": 1-3,
  "urgency": 1-3,
  "reasoning": "Brief explanation"
}

Only output valid JSON.`

    const response = await callGemini(prompt)
    if (!response) return null

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
        return null
    } catch (error) {
        console.error('Failed to parse priority suggestion:', error)
        return null
    }
}

/**
 * Suggest best assignee for a bug based on expertise
 * @param {Object} bug - The bug issue
 * @param {Array} users - Available team members
 * @param {Array} recentIssues - Recent issues for context
 * @returns {Promise<Object>} - Suggested assignee info
 */
export async function suggestBugAssignee(bug, users, recentIssues = []) {
    // Build context about team expertise
    const userStats = users.map(user => {
        const userIssues = recentIssues.filter(i => i.assigneeId === user.id)
        const bugCount = userIssues.filter(i => i.type === 'bug').length
        const doneCount = userIssues.filter(i => i.status === 'done').length
        return {
            id: user.id,
            name: user.name,
            bugsFixed: bugCount,
            completionRate: userIssues.length > 0 ? Math.round((doneCount / userIssues.length) * 100) : 0
        }
    })

    const prompt = `You are a project manager. Suggest the best assignee for this bug.

Bug:
- Summary: ${bug.summary}
- Description: ${bug.description || 'No description'}
- Priority: ${bug.priority}

Team Members:
${userStats.map(u => `- ${u.name}: ${u.bugsFixed} bugs fixed, ${u.completionRate}% completion rate`).join('\n')}

Consider:
1. Past bug-fixing experience
2. Workload balance
3. Expertise match

Respond with ONLY a JSON object:
{
  "suggestedName": "Team member name",
  "confidence": "high/medium/low",
  "reason": "Brief explanation"
}

Only output valid JSON.`

    const response = await callGemini(prompt)
    if (!response) return null

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            const suggestion = JSON.parse(jsonMatch[0])
            // Find the actual user ID
            const suggestedUser = users.find(u =>
                u.name.toLowerCase().includes(suggestion.suggestedName?.toLowerCase())
            )
            return {
                ...suggestion,
                suggestedId: suggestedUser?.id || null
            }
        }
        return null
    } catch (error) {
        console.error('Failed to parse assignee suggestion:', error)
        return null
    }
}

/**
 * Analyze test coverage and suggest improvements
 * @param {Array} testSuites - Existing test suites
 * @param {Array} issues - All issues
 * @returns {Promise<Object>} - Coverage analysis and suggestions
 */
export async function analyzeTestCoverage(testSuites, issues) {
    const testedIssues = issues.filter(i => i.linked_test_case_id)
    const untestedBugs = issues.filter(i => i.type === 'bug' && !i.linked_test_case_id)

    const prompt = `You are a QA lead. Analyze this test coverage and suggest improvements.

Current State:
- Total Issues: ${issues.length}
- Issues with Test Cases: ${testedIssues.length}
- Untested Bugs: ${untestedBugs.length}
- Test Suites: ${testSuites.length}

High Priority Untested Bugs:
${untestedBugs.slice(0, 5).map(b => `- ${b.key}: ${b.summary}`).join('\n')}

Provide 3-5 specific recommendations to improve test coverage.

Respond with ONLY a JSON object:
{
  "coverageScore": 0-100,
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "priorityAreas": ["Area 1", "Area 2"]
}

Only output valid JSON.`

    const response = await callGemini(prompt)
    if (!response) return null

    try {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
        return null
    } catch (error) {
        console.error('Failed to parse coverage analysis:', error)
        return null
    }
}

/**
 * Check if AI features are available
 * @returns {boolean}
 */
export function isAIEnabled() {
    return !!GEMINI_API_KEY
}

export default {
    generateTestCasesForIssue,
    suggestBugPriority,
    suggestBugAssignee,
    analyzeTestCoverage,
    isAIEnabled
}
