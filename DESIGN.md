# DESIGN.md

Design system extracted from `homepage/HausMaid.html` — a production Thai/EN/Burmese household schedule dashboard.

---

## Stack

- **Tailwind CSS** (CDN) with extended config
- **Google Fonts**: Prompt (display/headings) + Kanit (body/UI)
- JS-driven rendering via `innerHTML` template strings

---

## Color System

### Brand (Orange)

```js
// tailwind.config theme.extend.colors
brand: {
  50:  '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316',  // primary — matches Tailwind orange-500
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
}
```

`brand-500 = #f97316` — used for all primary accents: dots, borders, active states, badges.

### Semantic Palette

| Role | Class |
|------|-------|
| Workday badge | `bg-brand-50 text-brand-700` |
| Weekend badge | `bg-emerald-50 text-emerald-700` |
| Nanny mode (weekday) | `bg-brand-500 text-white` |
| Nanny mode (weekend) | `bg-emerald-500 text-white` |
| Warning/urgent | `bg-red-50 text-red-700`, `border-red-200` |
| Neutral tag | `bg-slate-100 text-slate-600` |
| 1st floor zone | `bg-blue-50 text-blue-700 border-blue-100` |
| 2nd floor zone | `bg-amber-50 text-amber-700 border-amber-100` |
| Deep clean zone | `bg-teal-50 text-teal-700 border-teal-100` |
| Weekend/exterior | `bg-emerald-50 text-emerald-700 border-emerald-100` |

---

## Typography

```html
<link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&family=Kanit:wght@300;400;500;600&display=swap" rel="stylesheet">
```

- **Prompt** — display/heading typeface (300–700). Wordmarks, section titles, hero text. Wider, more characterful.
- **Kanit** — body/UI typeface (300–600). All body copy, labels, metadata, table content. Slightly condensed, high legibility at small sizes.

Both support Thai + Latin. Pair: Prompt for emphasis, Kanit for readability.

---

## Spacing & Radius

| Element | Classes |
|---------|---------|
| Card (small) | `p-4 rounded-2xl` |
| Panel (large) | `p-6 rounded-3xl` |
| Section container | `rounded-xl` |
| Compact (print) | `p-2 rounded-xl` or `p-2.5 rounded-xl` |
| Badge pill | `px-2.5 py-1 rounded-full` or `px-1.5 py-0.5 rounded` |
| Tab button | `px-4 py-2 rounded-xl` |
| Icon button | `p-2 rounded-xl` |

---

## Component Patterns

### Header

```html
<header class="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm h-16">
```

Fixed 64px (h-16), white surface, 1px bottom border slate-100, sticky with z-40.

### Cards

```html
<!-- Standard card -->
<div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">

<!-- Panel (larger) -->
<div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
```

### Morning / Time Block

```html
<!-- Morning (brand) -->
<div class="bg-brand-50/50 p-5 rounded-2xl border border-brand-100/50">

<!-- Afternoon (amber) -->
<div class="bg-amber-50/30 p-5 rounded-2xl border border-amber-100/40">
```

50% opacity on both bg and border — subtle tint, not solid.

### Section Title Accent

```html
<div class="flex items-center gap-2">
  <div class="w-1.5 h-6 bg-brand-500 rounded-full"></div>
  <h2 class="font-semibold text-slate-800">Section Title</h2>
</div>
```

Vertical orange pill left of heading — the primary heading decoration pattern.

### Safety / Priority Card

```html
<div class="border-l-4 border-l-brand-500 bg-white p-4 rounded-r-2xl">
```

Left border accent (4px) for high-priority or safety content.

### Badge

```html
<!-- Pill badge -->
<span class="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full">Label</span>

<!-- Compact badge -->
<span class="px-1.5 py-0.5 text-[10px] font-bold rounded">Label</span>
```

### Tabs

```html
<!-- Active tab -->
<button class="px-4 py-2 text-sm font-bold rounded-xl bg-brand-500 text-white shadow-sm ring-2 ring-brand-300 ring-offset-1">

<!-- Inactive tab -->
<button class="px-4 py-2 text-sm font-medium rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200">
```

Active state: brand-500 fill + ring-2 ring-brand-300 with ring-offset.

### Language Switcher

```html
<!-- Active -->
<button class="px-3 py-1 text-xs font-bold rounded-lg bg-white text-slate-900 shadow-sm">

<!-- Inactive -->
<button class="px-3 py-1 text-xs font-semibold rounded-lg text-slate-500 hover:text-slate-900">
```

### Timeline (Vertical)

```html
<!-- Container: left border line -->
<div class="border-l-2 border-brand-100 space-y-4 pl-4">

  <!-- Regular event -->
  <div class="relative pl-8">
    <!-- Dot -->
    <div class="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 border-brand-500 bg-white"></div>
    <span class="text-sm font-bold text-brand-600">07:00 - 08:00</span>
    <h3 class="text-sm font-semibold text-slate-800 mt-1">Title</h3>
    <ul class="text-xs text-slate-500 mt-2 list-disc pl-4 space-y-1">
      <li>Detail</li>
    </ul>
  </div>

  <!-- Special/highlighted event -->
  <div class="relative pl-8 bg-brand-50/50 border-brand-100/70 p-4 rounded-2xl border transition-all duration-300">
    <div class="absolute -left-[9px] top-5 w-4 h-4 rounded-full border-2 border-brand-500 bg-white"></div>
    <div class="flex justify-between items-center">
      <span class="text-sm font-bold text-brand-600">15:00 - 18:00</span>
      <span class="text-xs font-bold px-2 py-1 bg-brand-500 text-white rounded-md">Nanny Mode</span>
    </div>
    <h3 class="text-sm font-bold text-slate-950 mt-1">Title</h3>
    <ul class="text-xs text-slate-600 mt-2 list-disc pl-4 space-y-1">
      <li>Detail</li>
    </ul>
  </div>

</div>
```

Dot: 16×16px, white fill, 2px brand-500 border, positioned at `-left-[9px]` to center on the vertical line.

### Warning Block (Urgent)

```html
<div class="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-center space-x-3">
  <div class="p-2 bg-red-100 rounded-xl text-red-600">
    <!-- icon -->
  </div>
  <strong class="text-red-700">Warning message</strong>
</div>
```

### List Items (Bullet Points)

```html
<!-- Brand bullet -->
<li class="flex items-start space-x-2">
  <span class="text-brand-500 font-bold mt-0.5">•</span>
  <span>Detail text</span>
</li>

<!-- Amber bullet (afternoon) -->
<li class="flex items-start space-x-2">
  <span class="text-amber-500 font-bold mt-0.5">•</span>
  <span>Detail text</span>
</li>
```

---

## Animation

| Name | Usage |
|------|-------|
| `transition-all duration-300` | Interactive block hover/state change |
| `animate-pulse` | Urgent warnings (Monday trash alert) |
| No explicit keyframe animations | All motion via Tailwind transitions |

---

## Print Layout

A4 portrait, designed for paper output via `@media print`.

```html
<!-- Classes to toggle visibility -->
<div class="no-print">...</div>    <!-- screen only -->
<div class="print-only">...</div>  <!-- print only -->
```

### Print Card

```html
<div class="border border-slate-200 rounded-xl p-2.5 text-[11.5px] bg-slate-50/50 print-card">
  <div class="flex justify-between font-bold border-b border-slate-200 pb-1 mb-1">
    <span class="text-slate-950 font-bold text-[11.5px]">Monday (Zone)</span>
    <span class="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">Badge</span>
  </div>
  <!-- content -->
</div>
```

### Print Timeline Dot

```html
<div class="absolute -left-[4.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-500"></div>
```

Smaller than screen (10px vs 16px), solid fill (no border).

### Print Grid

```html
<div class="grid grid-cols-12 gap-2">
  <div class="col-span-7">Morning details</div>
  <div class="col-span-5 border-l border-slate-200 pl-2">Afternoon details</div>
</div>
```

12-column grid. Morning 7/12, afternoon 5/12 with left divider.

### Print Margins

```css
@media print {
  @page { size: A4 portrait; margin: 6mm; }
}
```

---

## Data-Driven Rendering Pattern

Content built via JS template strings injected into container `innerHTML`. Separate data objects per language (th/en/my), switching on `currentLang`. UI state persisted in `localStorage`.

```js
// Language key pattern
translations[lang]['badge-color-1']  // per-day badge color class string
weeklyData[dayNum][currentLang]      // per-day localized content object

// Example render
let html = '';
items.forEach(item => {
  html += `<div class="${item.badgeClass}">${item.tag[currentLang]}</div>`;
});
container.innerHTML = html;
```

---

## Accessibility Patterns

- `aria-selected` on tab buttons
- Keyboard navigation: `←` `→` arrow keys cycle tabs
- `preventScroll: true` on programmatic `.focus()`
- `data-i18n` attributes for static i18n text nodes

---

## Key Design Decisions

1. **Orange as single accent** — brand-500 (#f97316) used everywhere; no competing accent colors
2. **Translucency for zones** — `bg-brand-50/50` not `bg-brand-50` keeps layers readable
3. **Ring on active tabs** — `ring-2 ring-brand-300 ring-offset-1` creates clear focus without border changes
4. **Consistent dot pattern** — timeline dots always 16px, border-2 brand-500, white fill on screen; 10px solid brand-500 in print
5. **Section accent = pill not line** — `w-1.5 h-6 rounded-full` gives organic feel vs hard rule
6. **Print-first layout** — entire print column grid designed for A4 at 11.5px base, 6mm margins
