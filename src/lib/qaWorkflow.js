/**
 * QA Workflow Automation
 * Handles workflow triggers for Testing status with auto-assignment
 */

/**
 * Get QA team members from users based on department
 * @param {Array} users - All users
 * @param {Array} departments - All departments
 * @returns {Array} - QA team users
 */
export function getQATeamMembers(users, departments) {
    if (!users || !departments) return []

    // Find QA department
    const qaDept = departments.find(d =>
        d.name.toLowerCase().includes('qa') ||
        d.name.toLowerCase().includes('test') ||
        d.name.toLowerCase().includes('quality')
    )

    if (qaDept) {
        // Return users in QA department
        return users.filter(u => u.departmentId === qaDept.id)
    }

    // Fallback: return all users if no QA department found
    return users
}

/**
 * Calculate workload for a user (issues assigned in testing status)
 * @param {Object} user - The user
 * @param {Array} issues - All issues
 * @returns {number} - Count of issues in Testing status
 */
export function calculateQAWorkload(user, issues) {
    if (!user || !issues) return 0
    return issues.filter(i =>
        i.assigneeId === user.id &&
        i.status === 'testing' &&
        !i.isDeleted
    ).length
}

/**
 * Find the least busy QA team member
 * @param {Array} qaUsers - QA team members
 * @param {Array} issues - All issues
 * @returns {Object|null} - The least busy QA user, or null
 */
export function findLeastBusyQAMember(qaUsers, issues) {
    if (!qaUsers || qaUsers.length === 0) return null

    const userWorkloads = qaUsers.map(user => ({
        user,
        workload: calculateQAWorkload(user, issues)
    }))

    // Sort by workload ascending (least busy first)
    userWorkloads.sort((a, b) => a.workload - b.workload)

    return userWorkloads[0]?.user || null
}

/**
 * Check if issue has a linked test case
 * @param {Object} issue - The issue
 * @param {Array} testCases - All test cases
 * @returns {boolean}
 */
export function hasLinkedTestCase(issue, testCases) {
    if (!issue || !testCases) return false

    // Check if issue has linkedTestCaseId directly
    if (issue.linkedTestCaseId) return true

    // Check if any test case links to this issue
    return testCases.some(tc => tc.issueId === issue.id)
}

/**
 * Validate workflow transition to Testing status
 * @param {Object} issue - The issue being transitioned
 * @param {Array} testCases - All test cases
 * @returns {Object} - { valid: boolean, reason: string }
 */
export function validateTestingTransition(issue, testCases) {
    if (!hasLinkedTestCase(issue, testCases)) {
        return {
            valid: false,
            reason: 'Test case gerekli',
            message: 'Bu issue Testing durumuna geçmeden önce bir test case bağlanmalı.'
        }
    }

    return { valid: true }
}

/**
 * Process workflow for Testing status transition
 * Returns the updates to apply to the issue
 * @param {Object} issue - The issue
 * @param {Array} qaUsers - QA team members
 * @param {Array} issues - All issues
 * @returns {Object} - Additional updates to apply
 */
export function processTestingWorkflow(issue, qaUsers, allIssues) {
    const leastBusyQA = findLeastBusyQAMember(qaUsers, allIssues)

    if (!leastBusyQA) {
        console.warn('No QA team members available for auto-assignment')
        return {}
    }

    return {
        assigneeId: leastBusyQA.id,
        _qaAssignment: {
            assignedTo: leastBusyQA.name,
            reason: 'Auto-assigned based on workload'
        }
    }
}

export default {
    getQATeamMembers,
    calculateQAWorkload,
    findLeastBusyQAMember,
    hasLinkedTestCase,
    validateTestingTransition,
    processTestingWorkflow
}
