import {
    buildBootBannerLines,
    createInitialCockpitSession,
    evaluateMotorModalSubmission,
    executeMenuChoice,
    getChoicesForRoute,
    type CockpitSession,
} from './menuRegistry'
import type { ChoiceOption, CorpusSnapshot } from './types'

const MAX_CONSOLE_BUFFER = 1000

function wrapConsoleLine(text: string, maxWidth: number): string[] {
    if (!text) return ['']
    if (maxWidth <= 10) return [text]

    if (/^(?:>>\s*)?[-=_*~]{10,}$/.test(text)) {
        return [text.slice(0, maxWidth)]
    }

    if (text.length <= maxWidth) {
        return [text]
    }

    const prefixMatch = text.match(/^(\s*(?:>>|\*|-)\s*)/)
    const basePrefix = prefixMatch ? prefixMatch[1] : ''
    const contPrefix = basePrefix.trim() === '>>' ? '>>   ' : '   '

    const lines: string[] = []
    let remaining = text
    let isFirst = true

    while (remaining.length > 0) {
        const currentPrefix = isFirst ? '' : contPrefix
        const effectiveMax = Math.max(10, maxWidth - currentPrefix.length)

        if (remaining.length <= effectiveMax) {
            lines.push(currentPrefix + remaining)
            break
        }

        let breakIdx = remaining.lastIndexOf(' ', effectiveMax)
        if (breakIdx <= 0 || breakIdx < effectiveMax * 0.4) {
            breakIdx = effectiveMax
        }

        const chunk = remaining.slice(0, breakIdx).trimEnd()
        lines.push(currentPrefix + chunk)
        remaining = remaining.slice(breakIdx).trimStart()
        isFirst = false
    }

    return lines
}

export function mountTerminalCockpit(): void {
    const rootEl = document.getElementById('lore-terminal-root')
    const dataEl = document.getElementById('lore-corpus-data')
    const topLeftEl = document.getElementById('lore-top-left')
    const navEl = document.getElementById('lore-choice-nav')
    const logScrollEl = document.getElementById('lore-console-scroll')
    const caliperEl = document.getElementById('lore-char-caliper')
    const terminatedEl = document.getElementById('lore-terminated-view')

    if (
        !rootEl ||
        !dataEl ||
        !topLeftEl ||
        !navEl ||
        !logScrollEl ||
        !caliperEl ||
        !terminatedEl
    ) {
        return
    }

    const initialCorpus = JSON.parse(
        dataEl.textContent || '{}',
    ) as CorpusSnapshot

    let session: CockpitSession = createInitialCockpitSession(initialCorpus)
    let rawLines: string[] = buildBootBannerLines(session)
    let focusedIndex = 0
    let isBusy = false
    let isTerminated = false
    let consoleCols = 84
    let lastEscTime = 0
    let pendingTimer: ReturnType<typeof setTimeout> | null = null
    let inputModalState: {
        prompt: string
        entityId: string
        value: string
    } | null = null

    const getChoices = (): ChoiceOption[] => getChoicesForRoute(session)

    const appendConsoleLines = (lines: string[]) => {
        if (lines.length === 0) return
        const combined = [...rawLines, ...lines]
        rawLines =
            combined.length > MAX_CONSOLE_BUFFER
                ? combined.slice(combined.length - MAX_CONSOLE_BUFFER)
                : combined
        renderConsole()
    }

    const renderConsole = () => {
        const maxWidth = Math.max(24, consoleCols - 3)
        const fragment = document.createDocumentFragment()
        for (const raw of rawLines) {
            for (const p of raw.split(/\r?\n/)) {
                for (const wrapped of wrapConsoleLine(p, maxWidth)) {
                    const row = document.createElement('div')
                    row.className =
                        'whitespace-pre font-mono leading-[1.35em] min-h-[1.35em] text-[#00cd00]'
                    row.textContent = wrapped
                    fragment.appendChild(row)
                }
            }
        }
        logScrollEl.replaceChildren(fragment)
        logScrollEl.scrollTop = logScrollEl.scrollHeight
    }

    const applyFocusStyles = (
        buttons: HTMLButtonElement[],
        scrollTarget = true,
    ) => {
        buttons.forEach((btn, idx) => {
            if (idx === focusedIndex) {
                btn.className =
                    'block w-full text-left font-mono whitespace-nowrap overflow-hidden h-[1.35em] leading-[1.35em] pl-[2ch] pr-[1ch] border-0 rounded-none cursor-pointer focus:outline-none bg-[#cd0000] text-white'
                if (scrollTarget) {
                    btn.scrollIntoView({ block: 'nearest' })
                }
            } else {
                btn.className =
                    'block w-full text-left font-mono whitespace-nowrap overflow-hidden h-[1.35em] leading-[1.35em] pl-[2ch] pr-[1ch] border-0 rounded-none cursor-pointer focus:outline-none bg-[#cdcd00] text-black hover:bg-[#cd0000] hover:text-white'
            }
        })
    }

    let renderedButtons: HTMLButtonElement[] = []

    const renderChoices = () => {
        navEl.replaceChildren()
        renderedButtons = []
        if (isBusy) return

        const list = getChoices()
        if (focusedIndex >= list.length) focusedIndex = 0

        const container = document.createElement('div')
        container.className = 'flex flex-col gap-0 w-full'

        list.forEach((choice, idx) => {
            const btn = document.createElement('button')
            btn.type = 'button'
            btn.textContent = choice.label
            btn.addEventListener('mouseenter', () => {
                if (focusedIndex !== idx) {
                    focusedIndex = idx
                    applyFocusStyles(renderedButtons, false)
                    if (choice.tooltip) {
                        appendConsoleLines([`:: ${choice.tooltip}`])
                    }
                }
            })
            btn.addEventListener('click', (ev) => {
                ev.preventDefault()
                focusedIndex = idx
                applyFocusStyles(renderedButtons, false)
                void activateChoice(choice)
            })
            renderedButtons.push(btn)
            container.appendChild(btn)
        })

        navEl.appendChild(container)
        applyFocusStyles(renderedButtons, true)
    }

    const renderInputModal = () => {
        topLeftEl.replaceChildren()
        if (!inputModalState) return

        const form = document.createElement('form')
        form.className =
            'relative m-[1ch] mt-[1.5em] border border-[#e5e5e5] bg-black p-[0.5em]'

        const titleBadge = document.createElement('div')
        titleBadge.className =
            'absolute -top-[0.75em] left-[1ch] bg-black px-[0.5ch] text-[#e5e5e5] whitespace-nowrap max-w-[90%] overflow-hidden'
        titleBadge.textContent = inputModalState.prompt

        const input = document.createElement('input')
        input.type = 'text'
        input.setAttribute('aria-label', inputModalState.prompt)
        input.placeholder = 'e.g. BIMANUAL_LIFT'
        input.value = inputModalState.value
        input.className =
            'w-full h-[2.2em] px-[1ch] font-mono bg-[#cd0000] text-white placeholder:text-white/60 focus:outline-none border-0'
        input.addEventListener('input', () => {
            if (inputModalState) {
                inputModalState.value = input.value
            }
        })

        const hint = document.createElement('div')
        hint.className = 'mt-[0.4em] text-[#e5e5e5] text-[11px]'
        hint.textContent = '[ENTER] Submit | [ESC] Cancel'

        form.addEventListener('submit', (e) => {
            e.preventDefault()
            if (!inputModalState) return
            const lines = evaluateMotorModalSubmission(
                inputModalState.entityId,
                inputModalState.value,
            )
            appendConsoleLines(lines)
            inputModalState = null
            renderInputModal()
            isBusy = true
            renderChoices()
            pendingTimer = setTimeout(() => {
                isBusy = false
                renderChoices()
            }, 1500)
        })

        form.appendChild(titleBadge)
        form.appendChild(input)
        form.appendChild(hint)
        topLeftEl.appendChild(form)
        input.focus()
    }

    const setTerminatedView = (terminated: boolean) => {
        isTerminated = terminated
        if (terminated) {
            rootEl.classList.add('hidden')
            terminatedEl.classList.remove('hidden')
        } else {
            terminatedEl.classList.add('hidden')
            rootEl.classList.remove('hidden')
            rootEl.focus()
        }
    }

    const rebootTerminal = () => {
        if (pendingTimer) {
            clearTimeout(pendingTimer)
            pendingTimer = null
        }
        session = createInitialCockpitSession(initialCorpus)
        rawLines = buildBootBannerLines(session)
        focusedIndex = 0
        isBusy = false
        inputModalState = null
        setTerminatedView(false)
        renderInputModal()
        renderConsole()
        renderChoices()
    }

    const moveFocus = (nextIndex: number) => {
        const list = getChoices()
        if (list.length === 0) return
        const wrapped = ((nextIndex % list.length) + list.length) % list.length
        if (wrapped !== focusedIndex) {
            focusedIndex = wrapped
            applyFocusStyles(renderedButtons, true)
            const target = list[wrapped]
            if (target?.tooltip) {
                appendConsoleLines([`:: ${target.tooltip}`])
            }
        }
    }

    const activateChoice = async (choice: ChoiceOption | undefined) => {
        if (!choice || isBusy || inputModalState || isTerminated) return
        isBusy = true
        renderChoices()

        const outcome = await executeMenuChoice(session, choice)
        if (outcome.logs.length > 0) {
            appendConsoleLines(outcome.logs)
        }

        if (outcome.openInputModal) {
            inputModalState = {
                prompt: outcome.openInputModal.prompt,
                entityId: outcome.openInputModal.entityId,
                value: '',
            }
            isBusy = false
            renderInputModal()
            renderChoices()
            return
        }

        if (outcome.nextRoute) {
            session.route = outcome.nextRoute
            focusedIndex = 0
            isBusy = false
            renderChoices()
            return
        }

        const dwellMs = outcome.dwellMs ?? 333
        pendingTimer = setTimeout(() => {
            isBusy = false
            renderChoices()
        }, dwellMs)
    }

    const measureCols = () => {
        const w = logScrollEl.clientWidth
        const ch = caliperEl.getBoundingClientRect().width
        if (w > 0 && ch > 0) {
            consoleCols = Math.max(32, Math.floor(w / ch))
            renderConsole()
        }
    }

    const resizeObserver = new ResizeObserver(measureCols)
    resizeObserver.observe(logScrollEl)

    terminatedEl.addEventListener('click', rebootTerminal)
    rootEl.addEventListener('pointerdown', () => {
        if (!inputModalState && !isTerminated) {
            rootEl.focus({ preventScroll: true })
        }
    })

    window.addEventListener(
        'keydown',
        (e: KeyboardEvent) => {
            if (isTerminated) {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    rebootTerminal()
                }
                return
            }

            if (e.ctrlKey && e.key.toLowerCase() === 'c') {
                e.preventDefault()
                setTerminatedView(true)
                return
            }

            if (inputModalState) {
                if (e.key === 'Escape') {
                    e.preventDefault()
                    inputModalState = null
                    renderInputModal()
                    appendConsoleLines([':: [INPUT:CANCELLED]'])
                    rootEl.focus({ preventScroll: true })
                }
                return
            }

            if (e.key === 'q') {
                e.preventDefault()
                setTerminatedView(true)
                return
            }

            if (e.key === 'Escape') {
                const now = Date.now()
                if (now - lastEscTime <= 2500) {
                    e.preventDefault()
                    setTerminatedView(true)
                    return
                }
                lastEscTime = now
                appendConsoleLines([
                    ':: [SYS] Press ESCAPE again within 2.5s (or Q / Ctrl+C) to exit terminal.',
                ])
                return
            }

            if (e.key === 'PageUp') {
                e.preventDefault()
                logScrollEl.scrollTop = Math.max(
                    0,
                    logScrollEl.scrollTop - logScrollEl.clientHeight * 0.7,
                )
                return
            }

            if (e.key === 'PageDown') {
                e.preventDefault()
                logScrollEl.scrollTop += logScrollEl.clientHeight * 0.7
                return
            }

            if (isBusy) return

            if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') {
                e.preventDefault()
                moveFocus(focusedIndex - 1)
                return
            }

            if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') {
                e.preventDefault()
                moveFocus(focusedIndex + 1)
                return
            }

            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                const list = getChoices()
                void activateChoice(list[focusedIndex])
            }
        },
        { capture: true },
    )

    // Initial mount
    measureCols()
    renderConsole()
    renderChoices()
    rootEl.focus({ preventScroll: true })
}
