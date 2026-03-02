import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GooeySearchTabs } from '../components/GooeySearchTabs'

// Mock framer-motion to avoid layout animation issues in jsdom
vi.mock('framer-motion', () => {
  const React = require('react')

  const motion = new Proxy(
    {},
    {
      get: (_target, prop: string) => {
        return React.forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
          const {
            layout: _layout,
            layoutId: _layoutId,
            transition: _transition,
            initial: _initial,
            animate: _animate,
            exit: _exit,
            whileHover: _whileHover,
            whileTap: _whileTap,
            ...rest
          } = props
          return React.createElement(prop, { ...rest, ref })
        })
      },
    }
  )

  const animate = () => ({ stop: () => {} })

  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    LayoutGroup: ({ children }: { children: React.ReactNode }) => children,
    animate,
  }
})

const sampleTabs = [
  { label: 'Popular', value: 'popular', icon: <span data-testid="fire-icon">F</span> },
  { label: 'Favorites', value: 'favorites', icon: <span data-testid="heart-icon">H</span> },
]

describe('GooeySearchTabs', () => {
  // --- Rendering ---
  it('renders in collapsed state with tabs', () => {
    render(<GooeySearchTabs tabs={sampleTabs} />)
    expect(screen.getByRole('tab', { name: /Popular/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Favorites/i })).toBeInTheDocument()
  })

  it('renders the search icon button', () => {
    render(<GooeySearchTabs tabs={sampleTabs} />)
    expect(screen.getByLabelText('Open search')).toBeInTheDocument()
  })

  it('renders tab icons when provided', () => {
    render(<GooeySearchTabs tabs={sampleTabs} />)
    expect(screen.getByTestId('fire-icon')).toBeInTheDocument()
    expect(screen.getByTestId('heart-icon')).toBeInTheDocument()
  })

  it('marks the first tab as active by default', () => {
    render(<GooeySearchTabs tabs={sampleTabs} />)
    const popularTab = screen.getByRole('tab', { name: /Popular/i })
    expect(popularTab.getAttribute('aria-selected')).toBe('true')
  })

  it('respects defaultActiveTab prop', () => {
    render(<GooeySearchTabs tabs={sampleTabs} defaultActiveTab="favorites" />)
    const favTab = screen.getByRole('tab', { name: /Favorites/i })
    expect(favTab.getAttribute('aria-selected')).toBe('true')
  })

  // --- Tab interaction ---
  it('calls onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn()
    render(<GooeySearchTabs tabs={sampleTabs} onTabChange={onTabChange} />)
    fireEvent.click(screen.getByRole('tab', { name: /Favorites/i }))
    expect(onTabChange).toHaveBeenCalledWith('favorites')
  })

  it('updates active tab in uncontrolled mode', () => {
    render(<GooeySearchTabs tabs={sampleTabs} />)
    fireEvent.click(screen.getByRole('tab', { name: /Favorites/i }))
    expect(screen.getByRole('tab', { name: /Favorites/i }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: /Popular/i }).getAttribute('aria-selected')).toBe('false')
  })

  // --- Expand/collapse ---
  it('expands when search icon is clicked', () => {
    render(<GooeySearchTabs tabs={sampleTabs} />)
    fireEvent.click(screen.getByLabelText('Open search'))
    expect(screen.getByLabelText('Search input')).toBeInTheDocument()
    expect(screen.getByLabelText('Close search')).toBeInTheDocument()
  })

  it('collapses when close button is clicked', () => {
    render(<GooeySearchTabs tabs={sampleTabs} defaultExpanded />)
    fireEvent.click(screen.getByLabelText('Close search'))
    expect(screen.queryByLabelText('Search input')).not.toBeInTheDocument()
  })

  it('calls onExpandedChange when toggling', () => {
    const onExpandedChange = vi.fn()
    render(<GooeySearchTabs tabs={sampleTabs} onExpandedChange={onExpandedChange} />)
    fireEvent.click(screen.getByLabelText('Open search'))
    expect(onExpandedChange).toHaveBeenCalledWith(true)
  })

  it('renders with defaultExpanded=true', () => {
    render(<GooeySearchTabs tabs={sampleTabs} defaultExpanded />)
    expect(screen.getByLabelText('Search input')).toBeInTheDocument()
  })

  // --- Search input ---
  it('calls onChange when typing in the search input', () => {
    const onChange = vi.fn()
    render(<GooeySearchTabs tabs={sampleTabs} defaultExpanded onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Search input'), { target: { value: 'test' } })
    expect(onChange).toHaveBeenCalledWith('test')
  })

  it('calls onSearch when Enter is pressed', () => {
    const onSearch = vi.fn()
    render(<GooeySearchTabs tabs={sampleTabs} defaultExpanded onSearch={onSearch} value="query" />)
    const input = screen.getByLabelText('Search input')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onSearch).toHaveBeenCalledWith('query')
  })

  it('collapses when Escape is pressed', () => {
    render(<GooeySearchTabs tabs={sampleTabs} defaultExpanded />)
    fireEvent.keyDown(screen.getByLabelText('Search input'), { key: 'Escape' })
    expect(screen.queryByLabelText('Search input')).not.toBeInTheDocument()
  })

  it('uses custom placeholder text', () => {
    render(<GooeySearchTabs tabs={sampleTabs} defaultExpanded placeholder="Find something..." />)
    expect(screen.getByPlaceholderText('Find something...')).toBeInTheDocument()
  })

  // --- Controlled mode ---
  it('renders controlled value', () => {
    render(<GooeySearchTabs tabs={sampleTabs} defaultExpanded value="controlled" />)
    expect(screen.getByDisplayValue('controlled')).toBeInTheDocument()
  })

  // --- Accessibility ---
  it('has role="search" on the wrapper', () => {
    render(<GooeySearchTabs tabs={sampleTabs} />)
    expect(screen.getByRole('search')).toBeInTheDocument()
  })

  it('has role="tablist" on the tabs container', () => {
    render(<GooeySearchTabs tabs={sampleTabs} />)
    expect(screen.getByRole('tablist')).toBeInTheDocument()
  })

  // --- Custom classNames ---
  it('applies custom className to wrapper', () => {
    render(<GooeySearchTabs tabs={sampleTabs} className="my-custom" />)
    expect(screen.getByRole('search')).toHaveClass('my-custom')
  })

  // --- Without tabs ---
  it('renders without tabs', () => {
    render(<GooeySearchTabs />)
    expect(screen.getByLabelText('Open search')).toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })
})
