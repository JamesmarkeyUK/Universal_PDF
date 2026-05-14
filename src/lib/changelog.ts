export interface ChangelogEntry {
  version: string
  date?: string
  items: string[]
}

// Curated, short release notes shown in the version chip popover.
// The first entry is the current version.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.3.0',
    date: 'May 2026',
    items: [
      'Transform text into a PDF — paste Markdown (or plain text) and build a clean, multi-page document',
      'Supports headings, lists, tables, code blocks, blockquotes, horizontal rules and clickable links',
      'Drag a .md or .txt file straight into the transform panel'
    ]
  },
  {
    version: '0.2.0',
    date: 'May 2026',
    items: [
      'Stamp generator — design custom stamps or import an image, then place them like signatures',
      'Single-line toolbar on desktop: editor controls merged into the header',
      'Landing page reordered: Create → Open → Compress',
      'Fixed resize and rotate handles on selected annotations',
      'Version chip rotates colour with every release'
    ]
  },
  {
    version: '0.1.0',
    date: 'May 2026',
    items: [
      'Annotate text, draw, ticks, crosses and rectangles in any colour',
      'Draw, import and verify signatures — drag-link auto-attaches the verified email caption',
      'Fill PDF form fields; export bakes everything in',
      'Compressed-vs-original export modal with Print and Print Preview',
      'Hand tool, click-existing-to-select, Ctrl+Z / Ctrl+C / Ctrl+V',
      'Tinyurl-style PDF slugs in the URL — refresh restores the same doc',
      '100% zoom = actual paper size with crisp high-DPI rendering'
    ]
  }
]
