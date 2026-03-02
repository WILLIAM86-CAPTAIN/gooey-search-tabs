# gooey-search-tabs

[![gooey-search-tabs](https://gooey-search-tabs.vercel.app/og-image.png)](https://gooey-search-tabs.vercel.app)

**[Live Demo & Docs](https://gooey-search-tabs.vercel.app)**

A morphing search bar component with animated tab navigation for React. Built with Framer Motion.

## Features

- Morphing search bar animation (tabs pill &rarr; input + close button)
- Animated tab navigation with sliding active indicator
- Spring physics with configurable bounce intensity
- Four animation presets: smooth, bouncy, subtle, snappy
- Keyboard shortcuts: Enter to search, Escape to collapse
- Controlled and uncontrolled modes for value and active tab
- Gooey blob effect connecting tabs and search bar with adjustable intensity
- No-tabs variant for a simple expanding search bar
- Dark mode via `theme` prop and CSS custom properties (`--gst-*`) for full color customization
- CSS class overrides via `classNames` prop
- Full accessibility: `role="search"`, `role="tablist"`, `aria-selected`, focus-visible outlines

## Installation

```bash
npm install gooey-search-tabs
```

### Peer Dependencies

gooey-search-tabs requires the following peer dependencies:

```bash
npm install react react-dom framer-motion
```

| Package        | Version    |
| -------------- | ---------- |
| react          | >= 18.0.0  |
| react-dom      | >= 18.0.0  |
| framer-motion  | >= 10.0.0  |

### CSS Import (Required)

You **must** import the gooey-search-tabs stylesheet for the component to render correctly:

```tsx
import 'gooey-search-tabs/styles.css'
```

Add this import once in your app's entry point (e.g., `main.tsx` or `App.tsx`). Without it, the search bar will appear unstyled.

## Quick Start

```tsx
import { GooeySearchTabs } from 'gooey-search-tabs'
import 'gooey-search-tabs/styles.css'

function App() {
  return (
    <GooeySearchTabs
      tabs={[
        { label: 'All', value: 'all' },
        { label: 'Images', value: 'images' },
      ]}
      placeholder="Search..."
      onSearch={(value) => console.log(value)}
    />
  )
}
```

## API Reference

### `GooeySearchTabsProps`

Props for the `<GooeySearchTabs />` component.

| Prop              | Type                          | Default | Description                              |
| ----------------- | ----------------------------- | ------- | ---------------------------------------- |
| `tabs`            | `GooeySearchTab[]`            | —       | Tab items shown in collapsed state       |
| `activeTab`       | `string`                      | —       | Controlled active tab value              |
| `defaultActiveTab`| `string`                      | —       | Default active tab (uncontrolled)        |
| `onTabChange`     | `(value: string) => void`     | —       | Called when a tab is clicked             |
| `onSearch`        | `(value: string) => void`     | —       | Called when user presses Enter           |
| `onChange`        | `(value: string) => void`     | —       | Called on every keystroke                |
| `placeholder`     | `string`                      | —       | Placeholder text for the input           |
| `value`           | `string`                      | —       | Controlled input value                   |
| `defaultValue`    | `string`                      | —       | Default input value (uncontrolled)       |
| `defaultExpanded` | `boolean`                     | `false` | Start in expanded state                  |
| `onExpandedChange`| `(expanded: boolean) => void` | —       | Called when expanded state changes        |
| `spring`          | `boolean`                     | `true`  | Use spring-based animation               |
| `bounce`          | `number`                      | —       | Spring bounce factor (0–1)               |
| `preset`          | `AnimationPresetName`         | —       | Named animation preset                   |
| `gooey`           | `boolean`                     | `false` | Enable gooey blob effect connecting bar and tabs |
| `gooeyIntensity`  | `number`                      | `0.5`   | Gooey connector thickness (0–1)          |
| `theme`           | `'light' \| 'dark'`           | `'light'`| Color theme                              |
| `searchPosition`  | `'left' \| 'right'`           | `'left'` | Position of the search icon              |
| `className`       | `string`                      | —       | CSS class on the outer container         |
| `style`           | `CSSProperties`               | —       | Inline styles on the outer container     |
| `classNames`      | `GooeySearchTabsClassNames`   | —       | Custom class names for sub-elements      |

### `GooeySearchTab`

| Property | Type        | Required | Description                                  |
| -------- | ----------- | -------- | -------------------------------------------- |
| `label`  | `string`    | Yes      | Display label for the tab                    |
| `icon`   | `ReactNode` | No       | Optional icon rendered before the label      |
| `value`  | `string`    | Yes      | Unique value used for identification and callbacks |

### `GooeySearchTabsClassNames`

Override styles for any part of the search bar.

| Key            | Target                  |
| -------------- | ----------------------- |
| `container`    | Outer wrapper           |
| `searchButton` | Search icon button      |
| `tabList`      | Tabs container          |
| `tab`          | Individual tab button   |
| `activeTab`    | Currently active tab    |
| `input`        | Search text input       |
| `closeButton`  | Close/collapse button   |

### Animation Presets

Four built-in presets control spring physics:

| Preset   | Bounce | Description                          |
| -------- | ------ | ------------------------------------ |
| `smooth` | 0.1    | Gentle spring with minimal bounce    |
| `bouncy` | 0.6    | Exaggerated bouncy effect            |
| `subtle` | 0.05   | Very smooth, almost no bounce        |
| `snappy` | 0.4    | Quick response with moderate bounce  |

```tsx
<GooeySearchTabs preset="bouncy" />
```

## Usage Examples

### With Tabs

```tsx
<GooeySearchTabs
  tabs={[
    { label: 'Popular', value: 'popular', icon: '🔥' },
    { label: 'Favorites', value: 'favorites', icon: '❤️' },
    { label: 'Recent', value: 'recent', icon: '🕐' },
  ]}
  placeholder="Search..."
  onSearch={(value) => console.log(value)}
  onTabChange={(tab) => console.log(tab)}
/>
```

### Without Tabs

```tsx
<GooeySearchTabs
  placeholder="Search anything..."
  onSearch={(value) => console.log(value)}
/>
```

### Controlled Mode

```tsx
const [query, setQuery] = useState('')
const [tab, setTab] = useState('all')

<GooeySearchTabs
  tabs={tabs}
  value={query}
  onChange={setQuery}
  activeTab={tab}
  onTabChange={setTab}
  onSearch={(val) => fetchResults(val, tab)}
/>
```

### Animation Presets

```tsx
// Named preset
<GooeySearchTabs preset="bouncy" />

// Or manual spring control
<GooeySearchTabs spring={true} bounce={0.6} />

// Disable spring (smooth easing)
<GooeySearchTabs spring={false} />
```

### Gooey Effect

```tsx
// Enable the gooey blob connector between tabs and search bar
<GooeySearchTabs
  tabs={tabs}
  gooey
  gooeyIntensity={0.4}
  placeholder="Search..."
/>
```

### Custom Styling

```tsx
<GooeySearchTabs
  className="my-search"
  classNames={{
    container: 'my-container',
    searchButton: 'my-search-btn',
    tab: 'my-tab',
    input: 'my-input',
  }}
/>
```

### Dark Mode

```tsx
<GooeySearchTabs theme="dark" />
```

### CSS Custom Properties

All colors use CSS custom properties (`--gst-*`) that you can override:

```tsx
<GooeySearchTabs
  style={{ '--gst-bg': '#1a1a2e', '--gst-text': '#e0e0e0' } as React.CSSProperties}
/>
```

| Token | Light | Dark | Purpose |
| ----- | ----- | ---- | ------- |
| `--gst-bg` | `#ffffff` | `#1e1e1e` | Bar & right-slot background |
| `--gst-text` | `#374151` | `#d1d5db` | Trigger, tab, close button text |
| `--gst-input-text` | `#1f2937` | `#e5e7eb` | Input text color |
| `--gst-placeholder` | `#9ca3af` | `#6b7280` | Input placeholder |
| `--gst-shadow` | — | — | Bar/right-slot shadow |
| `--gst-hover` | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.08)` | Hover background |
| `--gst-focus-ring` | `#6366f1` | `#818cf8` | Focus-visible outline |
| `--gst-tab-indicator-bg` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.1)` | Active tab indicator |
| `--gst-tab-active-text` | `#1f2937` | `#f3f4f6` | Active tab text |
| `--gst-bridge-bg` | `#ffffff` | `#1e1e1e` | Gooey bridge connector |

### Tailwind CSS

Override tokens directly with Tailwind's arbitrary properties:

```tsx
<GooeySearchTabs
  className="[--gst-bg:theme(colors.slate.900)] [--gst-text:theme(colors.slate.200)] [--gst-tab-indicator-bg:theme(colors.slate.700)]"
/>
```

### Start Expanded

```tsx
<GooeySearchTabs
  defaultExpanded
  placeholder="Type to search..."
  onExpandedChange={(expanded) => console.log(expanded)}
/>
```

## Keyboard Shortcuts

| Key    | Action                                |
| ------ | ------------------------------------- |
| Enter  | Submit search (fires `onSearch`)      |
| Escape | Collapse the search bar              |

## Exports

```ts
// Component
export { GooeySearchTabs } from 'gooey-search-tabs'

// Animation presets
export { animationPresets } from 'gooey-search-tabs'

// Types
export type {
  GooeySearchTabsProps,
  GooeySearchTab,
  GooeySearchTabsClassNames,
  AnimationPreset,
  AnimationPresetName,
} from 'gooey-search-tabs'
```

## Browser Support

gooey-search-tabs works in all modern browsers that support:

- CSS Grid and Flexbox
- ResizeObserver
- `framer-motion` (Chrome, Firefox, Safari, Edge)

## See Also

- **[gooey-toast](https://github.com/anl331/goey-toast)** — Morphing toast notifications for React with organic blob animations. [Live Demo](https://goey-toast.vercel.app)

## License

[MIT](./LICENSE)
