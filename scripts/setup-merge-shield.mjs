import { execSync } from 'node:child_process'

console.log('>> [INIT] Configuring Git merge shield and hooks...')

// 1. Arm ours merge driver
try {
    execSync('git config merge.ours.driver true', { stdio: 'pipe' })
    console.log(
        '>> [OK] Git ours merge driver armed (merge.ours.driver = true).',
    )
} catch (err) {
    console.error(
        ':: [FAIL] Failed to configure merge.ours.driver:',
        err.message,
    )
    process.exit(1)
}

// 2. Arm Git Hooks (.husky/_)
try {
    execSync('git config core.hooksPath .husky/_', { stdio: 'pipe' })
    console.log(
        '>> [OK] Git hooks path armed locally (core.hooksPath = .husky/_).',
    )
} catch (err) {
    console.error(':: [FAIL] Failed to configure core.hooksPath:', err.message)
    process.exit(1)
}
