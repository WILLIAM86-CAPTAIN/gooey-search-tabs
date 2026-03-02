import { useState, useRef, useCallback, useEffect, useId } from 'react'
import { motion, AnimatePresence, LayoutGroup, animate } from 'framer-motion'
import type { GooeySearchTabsProps } from '../types'
import { animationPresets } from '../presets'
import { SearchIcon } from './SearchIcon'
import { CloseIcon } from './CloseIcon'

const CLOSE_SIZE = 44
const BAR_COLLAPSED = 44 // icon bar width when collapsed (padding + trigger)
const DEFAULT_INPUT_WIDTH = 220
const GAP = 8
const FADE_DUR = 0.1 // opacity fade duration for morph sequencing

export const GooeySearchTabs = ({
  tabs = [],
  activeTab: controlledActiveTab,
  defaultActiveTab,
  onTabChange,
  onSearch,
  onChange,
  placeholder = 'Search',
  value: controlledValue,
  defaultValue = '',
  defaultExpanded = false,
  onExpandedChange,
  spring: springProp,
  bounce: bounceProp,
  preset,
  gooey = false,
  gooeyIntensity = 0.5,
  className,
  style,
  classNames = {},
}: GooeySearchTabsProps) => {
  const instanceId = useId()
  const filterId = `gooey-goo-${instanceId.replace(/:/g, '')}`
  const resolved = preset ? animationPresets[preset] : undefined
  const useSpring = springProp ?? resolved?.spring ?? true
  const bounce = bounceProp ?? resolved?.bounce ?? 0.1

  const [expanded, setExpanded] = useState(defaultExpanded)
  const [internalValue, setInternalValue] = useState(defaultValue)
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultActiveTab ?? tabs[0]?.value ?? ''
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [lockedWidth, setLockedWidth] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const rightSlotRef = useRef<HTMLDivElement>(null)
  const wasExpandedRef = useRef(defaultExpanded)
  const bridgeRef = useRef<HTMLDivElement>(null)
  const bridgeWasExpandedRef = useRef(defaultExpanded)

  const searchValue = controlledValue ?? internalValue
  const currentActiveTab = controlledActiveTab ?? internalActiveTab
  const hasTabs = tabs.length > 0

  const transition = useSpring
    ? { type: 'spring' as const, bounce, duration: 0.5 }
    : { type: 'tween' as const, duration: 0.3, ease: 'easeInOut' as const }

  // Bridge height: linear scale gives more visible hourglass curves at medium intensity
  const bridgeHeight = Math.max(4, Math.round(gooeyIntensity * 44))

  // Bridge overlap: at high intensity, the bridge extends behind the pills via
  // negative margins. This fills the gap left by the pills' border-radius at the
  // top/bottom corners, eliminating concave notches at the junction.
  // Flex contribution stays constant: (GAP + 2*overlap) - 2*overlap = GAP.
  const bridgeOverlap = Math.round(gooeyIntensity * 15)
  const bridgeWidth = GAP + bridgeOverlap * 2

  // Reset locked width when tabs change so it re-measures
  const tabsKey = tabs.map(t => `${t.label}|${t.value}`).join(',')
  useEffect(() => {
    setLockedWidth(null)
  }, [tabsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Measure and lock the wrapper width after first paint (only when tabs exist)
  useEffect(() => {
    if (hasTabs && wrapperRef.current && lockedWidth === null) {
      requestAnimationFrame(() => {
        if (wrapperRef.current) {
          // Measure tabs content directly so grid min-width:0 doesn't affect the result
          const tabsEl = wrapperRef.current.querySelector('.gooey-search-tabs-tabs-content') as HTMLElement
          if (tabsEl) {
            setLockedWidth(BAR_COLLAPSED + GAP + tabsEl.scrollWidth)
          }
        }
      })
    }
  }, [lockedWidth, tabs, hasTabs])

  // Calculate input width to keep total width constant
  const inputExpandedWidth = hasTabs && lockedWidth
    ? lockedWidth - BAR_COLLAPSED - GAP - CLOSE_SIZE
    : DEFAULT_INPUT_WIDTH

  // Approximate time for the width morph to perceptually settle (for sequencing the final fade)
  const morphSettleTime = useSpring ? 0.35 : 0.25

  const handleExpand = useCallback(() => {
    setExpanded(true)
    onExpandedChange?.(true)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [onExpandedChange])

  const handleCollapse = useCallback(() => {
    setExpanded(false)
    onExpandedChange?.(false)
    if (controlledValue === undefined) {
      setInternalValue('')
    }
  }, [onExpandedChange, controlledValue])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (controlledValue === undefined) {
        setInternalValue(val)
      }
      onChange?.(val)
    },
    [controlledValue, onChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSearch?.(searchValue)
      }
      if (e.key === 'Escape') {
        handleCollapse()
      }
    },
    [onSearch, searchValue, handleCollapse]
  )

  const handleTabClick = useCallback(
    (value: string) => {
      if (controlledActiveTab === undefined) {
        setInternalActiveTab(value)
      }
      onTabChange?.(value)
    },
    [controlledActiveTab, onTabChange]
  )

  useEffect(() => {
    if (defaultExpanded) {
      inputRef.current?.focus()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Collapse squish — mirrors the expand overshoot. During expand the input
  // spring naturally overshoots, compressing the right-slot via flex layout.
  // During collapse the input clips at 0, so no natural undershoot exists.
  // We fix this by swapping flex roles at the start of the collapse: the
  // right-slot gets an explicit width animated by a spring from 44→tabsWidth.
  // The bar becomes flex-shrink:1 so the spring's overshoot compresses it —
  // real layout compression, identical to what happens on expand.
  // Starting from 44px gives 184px of travel, matching the expand's 0→184px.
  useEffect(() => {
    const wasExpanded = wasExpandedRef.current
    wasExpandedRef.current = expanded

    if (!expanded && wasExpanded && hasTabs && lockedWidth) {
      const barEl = barRef.current
      const rsEl = rightSlotRef.current
      if (!barEl || !rsEl) return

      const targetRsWidth = lockedWidth - BAR_COLLAPSED - GAP
      // Start after the close-button fades out, synchronized with input exit
      const delay = FADE_DUR * 1000
      let playback: { stop: () => void } | null = null

      const timer = setTimeout(() => {
        const currentRsWidth = rsEl.getBoundingClientRect().width

        // Lock right-slot at current width — no visual jump
        rsEl.style.width = currentRsWidth + 'px'
        rsEl.style.flexShrink = '0'

        // Make bar compressible so spring overshoot squishes it
        barEl.style.flexShrink = '1'
        barEl.style.overflow = 'hidden'
        barEl.style.minWidth = '0px'

        // Animate right-slot to target with the same spring as expand.
        // Full travel distance (44→228 = 184px) matches expand (0→184px),
        // producing identical overshoot and therefore identical squish.
        playback = animate(currentRsWidth, targetRsWidth, {
          type: 'spring',
          bounce,
          duration: 0.5,
          onUpdate: (v) => {
            rsEl.style.width = v + 'px'
          },
          onComplete: () => {
            rsEl.style.width = ''
            rsEl.style.flexShrink = ''
            barEl.style.flexShrink = ''
            barEl.style.overflow = ''
            barEl.style.minWidth = ''
          },
        })
      }, delay)

      return () => {
        clearTimeout(timer)
        if (playback) playback.stop()
        if (barEl) {
          barEl.style.flexShrink = ''
          barEl.style.overflow = ''
          barEl.style.minWidth = ''
        }
        if (rsEl) {
          rsEl.style.width = ''
          rsEl.style.flexShrink = ''
        }
      }
    }
  }, [expanded, hasTabs, lockedWidth, bounce])

  // Bridge squeeze animation — when expanding/collapsing, the bridge
  // squeezes thin then springs back, creating a stretchy effect.
  useEffect(() => {
    const wasExp = bridgeWasExpandedRef.current
    bridgeWasExpandedRef.current = expanded

    const bridge = bridgeRef.current
    if (!bridge || !gooey || expanded === wasExp) return

    // Quick squeeze to 30% height
    bridge.style.transition = 'height 0.06s ease-in'
    bridge.style.height = Math.max(2, Math.round(bridgeHeight * 0.3)) + 'px'

    const timer = setTimeout(() => {
      // Spring back to full height with overshoot
      bridge.style.transition = 'height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
      bridge.style.height = bridgeHeight + 'px'
    }, 60)

    return () => {
      clearTimeout(timer)
      if (bridge) {
        bridge.style.transition = ''
        bridge.style.height = bridgeHeight + 'px'
      }
    }
  }, [expanded, gooey, bridgeHeight])

  // Input transition delayed by FADE_DUR so tabs/close fades first
  const inputTransition = {
    ...transition,
    delay: hasTabs ? FADE_DUR : 0,
    opacity: { duration: 0.08, delay: hasTabs ? FADE_DUR : 0 },
  }
  const inputExitTransition = {
    ...transition,
    delay: hasTabs ? FADE_DUR : 0,
    opacity: { duration: 0.08 },
  }

  return (
    <LayoutGroup id={instanceId}>
      {gooey && (
        <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
          <defs>
            <filter id={filterId} x="-10%" y="-60%" width="120%" height="220%">
              {/* Blur smooths the junction where bridge meets pill */}
              {/* Blur scales with intensity: thicker bridge → curvier junctions.
                  Bridge overlap fills corners so higher blur doesn't create notches. */}
              <feGaussianBlur in="SourceGraphic" stdDeviation={`${2 + gooeyIntensity * 8} ${2 + gooeyIntensity * 16}`} result="blur" />
              {/* Force pure white + binary threshold → crisp organic outline */}
              <feColorMatrix in="blur" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 100 -50" result="goo" />
              {/* Organic goo behind, original content on top */}
              <feMerge>
                <feMergeNode in="goo" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      )}
      <div
        ref={wrapperRef}
        className={`gooey-search-tabs-wrapper ${className ?? ''} ${classNames.container ?? ''}`.trim()}
        style={{
          ...style,
          ...(hasTabs && lockedWidth ? { width: lockedWidth } : undefined),
          ...(gooey ? { gap: 0, filter: `url(#${filterId}) drop-shadow(0 2px 4px rgba(0,0,0,0.08)) drop-shadow(0 1px 2px rgba(0,0,0,0.04))` } : undefined),
        }}
        role="search"
        aria-label="Search"
        data-expanded={expanded}
        data-gooey={gooey || undefined}
      >
        {/* Left side: bar grows as input springs in, pushing right-slot.
            The input spring creates the bounce — bar overshoots on expand,
            and on collapse the bounce-back compresses the right-slot from the left. */}
        <div ref={barRef} className="gooey-search-tabs-bar">
          <button
            className={`gooey-search-tabs-trigger ${classNames.searchButton ?? ''}`.trim()}
            onClick={expanded ? undefined : handleExpand}
            aria-label={expanded ? 'Search' : 'Open search'}
            type="button"
            tabIndex={expanded ? -1 : 0}
          >
            <SearchIcon size={18} />
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="input-area"
                className="gooey-search-tabs-input-wrapper"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: inputExpandedWidth, opacity: 1, transition: inputTransition }}
                exit={{ width: 0, opacity: 0, transition: inputExitTransition }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  className={`gooey-search-tabs-input ${classNames.input ?? ''}`.trim()}
                  placeholder={placeholder}
                  value={searchValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  aria-label="Search input"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Goey bridge — solid white connector between bar and right-slot */}
        {gooey && hasTabs && (
          <div
            ref={bridgeRef}
            className="gooey-search-tabs-bridge"
            style={{
              width: bridgeWidth,
              height: bridgeHeight,
              marginLeft: -bridgeOverlap,
              marginRight: -bridgeOverlap,
            }}
          />
        )}

        {/* Right side: pill that morphs from tabs to close.
            Width is flex-driven (passively follows the bar's spring).
            Tabs and close are always rendered, opacity sequenced. */}
        {hasTabs && (
          <div ref={rightSlotRef} className="gooey-search-tabs-right-slot">
            {/* Tabs — fade out immediately on expand, fade in early during collapse bounce */}
            <motion.div
              className={`gooey-search-tabs-tabs-content ${classNames.tabList ?? ''}`.trim()}
              role="tablist"
              initial={false}
              animate={{ opacity: expanded ? 0 : 1 }}
              transition={{
                duration: expanded ? FADE_DUR : 0.2,
                delay: expanded ? 0 : FADE_DUR + morphSettleTime * 0.3,
              }}
              style={{ pointerEvents: expanded ? 'none' : 'auto' }}
            >
              {tabs.map((tab) => {
                const isActive = tab.value === currentActiveTab
                return (
                  <button
                    key={tab.value}
                    role="tab"
                    aria-selected={isActive}
                    className={[
                      'gooey-search-tabs-tab',
                      classNames.tab ?? '',
                      isActive ? (classNames.activeTab ?? '') : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleTabClick(tab.value)}
                    type="button"
                  >
                    {isActive && (
                      <motion.span
                        layoutId="gooey-search-tabs-active-indicator"
                        className="gooey-search-tabs-tab-indicator"
                        transition={transition}
                      />
                    )}
                    <span className="gooey-search-tabs-tab-content">
                      {tab.icon && (
                        <span className="gooey-search-tabs-tab-icon">{tab.icon}</span>
                      )}
                      {tab.label}
                    </span>
                  </button>
                )
              })}
            </motion.div>

            {/* Close — fade in early during expand bounce, fade out immediately on collapse */}
            <motion.button
              className={`gooey-search-tabs-close-content ${classNames.closeButton ?? ''}`.trim()}
              initial={false}
              animate={{ opacity: expanded ? 1 : 0 }}
              transition={{
                duration: expanded ? 0.2 : FADE_DUR,
                delay: expanded ? FADE_DUR + morphSettleTime * 0.3 : 0,
              }}
              onClick={handleCollapse}
              aria-label="Close search"
              type="button"
              style={{ pointerEvents: expanded ? 'auto' : 'none' }}
            >
              <CloseIcon size={18} />
            </motion.button>
          </div>
        )}

        {/* Right side: simple close button (no-tabs case) */}
        {!hasTabs && (
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                key="close-slot"
                className="gooey-search-tabs-right-slot"
                style={{ width: CLOSE_SIZE }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.1 } }}
              >
                <button
                  className={`gooey-search-tabs-close-content ${classNames.closeButton ?? ''}`.trim()}
                  onClick={handleCollapse}
                  aria-label="Close search"
                  type="button"
                >
                  <CloseIcon size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </LayoutGroup>
  )
}
