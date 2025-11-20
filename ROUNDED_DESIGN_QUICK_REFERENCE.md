# 🎨 Rounded Design System - Quick Reference
## NFTSol 2025-2026 Implementation

### 📏 Radius Sizes (CSS Variables)
```css
--radius-xs:   4px    /* Icons, dividers, tiny elements */
--radius-sm:   8px    /* Badges, small buttons, indicators */
--radius-md:  16px    /* ⭐ BASE - Buttons, cards, inputs (MOST USED) */
--radius-lg:  24px    /* Modals, overlays, hero sections */
--radius-xl:  32px    /* Large containers, major sections */
--radius-full: ∞      /* Pills, circles, badges */
```

---

## 💻 Quick Usage

### Import the System (if not auto-imported)
```typescript
import './styles/rounded-design-2026.css';
import './styles/design-system.css';
```

### Global Rounded Utility (Primary Class)
```jsx
<div className="rounded-app">Element</div>  /* 16px - base radius */
```

### By Component Type

#### 🔘 Buttons
```jsx
<button className="btn-rounded shadow-soft">Click me</button>
<button className="btn-modern rounded-md">Modern Button</button>
<button className="btn-glass rounded-md">Glass Button</button>
```

#### 📇 Cards
```jsx
<div className="card-rounded p-6">Card content</div>
<div className="soft-card p-6">Soft card with shadow</div>
<div className="glass-card-rounded p-6">Glass card</div>
<div className="gradient-card-rounded p-6">Gradient card</div>
```

#### 📝 Inputs
```jsx
<input className="input-rounded w-full" type="text" />
<input className="input-modern rounded-md" type="email" />
```

#### 🏷️ Badges
```jsx
<span className="badge-rounded bg-purple-500/20">Status</span>
<div className="rounded-badge">Pill badge</div>
```

#### 📦 Modals
```jsx
<div className="modal-rounded bg-dark-surface">Modal content</div>
```

---

## 🎯 Size-Based Selection Chart

| Element Type | Radius | Class | Example |
|---|---|---|---|
| **Icons** | 4-8px | `.rounded-xs`, `.rounded-icon` | Avatar, icon button |
| **Badges** | Full | `.rounded-badge`, `.rounded-full` | Status badge, tag |
| **Buttons** | 16px | `.btn-rounded`, `.rounded-md` | Primary, secondary buttons |
| **Cards** | 16px | `.card-rounded`, `.rounded-card` | NFT card, info card |
| **Inputs** | 16px | `.input-rounded`, `.rounded-md` | Text field, search box |
| **Modals** | 24px | `.modal-rounded`, `.rounded-lg` | Dialog, confirm modal |
| **Overlays** | 24px | `.rounded-lg` | Popover, tooltip container |
| **Heroes** | 24px | `.hero-rounded`, `.rounded-lg` | Landing section, feature block |
| **Containers** | 24-32px | `.rounded-lg`, `.rounded-xl` | Section container, large card |

---

## 🚀 Most Used Patterns

### Pattern 1: Soft Card (Most Common)
```jsx
<div className="soft-card p-6 hover:shadow-soft-lg">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

### Pattern 2: Interactive Button
```jsx
<button className="btn-rounded bg-gradient-to-r from-purple-600 to-cyan-500 text-white">
  Create NFT
</button>
```

### Pattern 3: Glass Container
```jsx
<div className="glass-card-rounded p-8 backdrop-blur-xl">
  <h2>Premium Section</h2>
</div>
```

### Pattern 4: Badge/Status
```jsx
<span className="badge-rounded bg-green-500/20 text-green-200">
  ✓ Verified
</span>
```

### Pattern 5: Input Group
```jsx
<input
  className="input-rounded w-full px-4 py-2 bg-dark-surface"
  placeholder="Enter text..."
/>
```

---

## 🎨 Tailwind Class Extensions

### Radius Utilities
```jsx
className="rounded-app"      /* 16px - BASE */
className="rounded-app-sm"   /* 8px */
className="rounded-app-md"   /* 16px (same as app) */
className="rounded-app-lg"   /* 24px */
className="rounded-app-xl"   /* 32px */
```

### Shadow Utilities
```jsx
className="shadow-soft"      /* 0 4px 12px rgba(...) */
className="shadow-soft-lg"   /* 0 12px 32px rgba(...) */
```

---

## 📱 Mobile Responsive (Automatic)

**No action needed!** Radii automatically scale on mobile:

```css
/* Desktop */
--radius-md: 16px
--radius-lg: 24px

/* Mobile (< 768px) */
--radius-md: 12px  /* automatically scaled */
--radius-lg: 20px  /* automatically scaled */
```

---

## ♿ Accessibility (Automatic)

### Reduced Motion
```css
/* Automatically disables animations for users with prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  /* transforms disabled, shadows kept */
}
```

### High Contrast
```css
/* Automatically enhanced for users with prefers-contrast: more */
@media (prefers-contrast: more) {
  /* borders thicker, shadows stronger */
}
```

---

## 🔧 Common Customizations

### Change All Button Radius
```css
/* In your component or global CSS */
.btn-rounded {
  border-radius: 20px; /* Override default 16px */
}
```

### Change Mobile Radius
```css
@media (max-width: 640px) {
  :root {
    --radius-md: 14px; /* Tighter on mobile */
  }
}
```

### Add Custom Glow Effect
```jsx
<div className="rounded-glow">
  Glowing element
</div>
```

---

## 🎯 Do's and Don'ts

### ✅ Do This
```jsx
/* Use semantic classes */
<button className="btn-rounded">Good</button>

/* Use CSS variables */
<div style={{ borderRadius: 'var(--radius-md)' }}>Good</div>

/* Use provided utilities */
<div className="soft-card">Good</div>
```

### ❌ Don't Do This
```jsx
/* Hard-code values */
<button style={{ borderRadius: '16px' }}>Bad</button>

/* Mix inconsistent radii */
<button className="rounded-lg">Bad</button>

/* Forget about mobile */
<div className="rounded-xl">Bad (too rounded on mobile)</div>
```

---

## 🎨 Component Library Examples

### NFT Card
```jsx
<div className="soft-card p-4">
  <img className="w-full rounded-card object-cover" src="nft.jpg" alt="NFT" />
  <h3 className="mt-4 font-bold">NFT Name</h3>
  <button className="btn-rounded mt-4 w-full">Buy Now</button>
</div>
```

### Search Bar
```jsx
<div className="glass-card-rounded p-2 flex gap-2">
  <input className="input-rounded flex-1" placeholder="Search..." />
  <button className="btn-rounded">Search</button>
</div>
```

### Modal Dialog
```jsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="modal-rounded bg-dark-surface max-w-md p-8">
    <h2 className="text-2xl font-bold">Confirm Action</h2>
    <p className="mt-4 text-gray-400">Are you sure?</p>
    <div className="mt-8 flex gap-4">
      <button className="btn-rounded flex-1 bg-gray-600">Cancel</button>
      <button className="btn-rounded flex-1 bg-purple-600">Confirm</button>
    </div>
  </div>
</div>
```

### Status Badge
```jsx
<span className="badge-rounded bg-green-500/20 text-green-200 text-xs font-semibold">
  ✓ Verified
</span>
```

---

## 🔍 Debug Checklist

Element not showing rounded corners?
- [ ] Is the CSS imported? Check `main.tsx` or root style import
- [ ] Is overflow hidden? Remove or add `rounded-app`
- [ ] Is it a custom component? Apply class directly to DOM element
- [ ] Browser cache? Clear and reload

Shadow not visible?
- [ ] Parent has `overflow: hidden`? Change to `overflow: visible`
- [ ] z-index issue? Adjust stacking context
- [ ] Too dark background? Shadow might be invisible on dark bg

Mobile looks wrong?
- [ ] Check viewport meta tag in HTML
- [ ] Clear browser cache
- [ ] Radius too large? Auto-scales but check breakpoint

---

## 📊 Reference Table: From → To

| Context | From | To | Reason |
|---|---|---|---|
| Buttons | Various | `btn-rounded` | Consistency |
| Cards | Various | `card-rounded` | Consistency |
| Inputs | `rounded-2xl` | `input-rounded` | Semantic naming |
| Modals | `rounded-2xl` | `modal-rounded` | Larger radius (24px) |
| Badges | `rounded-full` | `badge-rounded` | Semantic naming |

---

## 🎓 Learning Path

**Beginner**: Use `.rounded-app` for everything
```jsx
<div className="rounded-app">Most elements</div>
```

**Intermediate**: Use semantic classes
```jsx
<button className="btn-rounded">Button</button>
<div className="card-rounded">Card</div>
```

**Advanced**: Use CSS variables directly
```jsx
<div style={{ borderRadius: 'var(--radius-lg)' }}>Custom</div>
```

---

## 📞 Quick Help

**Q: What's the base radius?**
A: 16px (`--radius-md` or `.rounded-app`)

**Q: How do I make it fully rounded (pill)?**
A: Use `.rounded-badge` or `.rounded-full`

**Q: Does it work on mobile?**
A: Yes, automatically scales down

**Q: Do I need to do anything for accessibility?**
A: No, it's built-in (reduced-motion, high-contrast)

**Q: Can I customize it?**
A: Yes, edit CSS variables in `design-system.css`

---

## 🎉 You're Ready!

You now have everything needed to implement soft, rounded design throughout your application.

**Key Files:**
- 📄 `design-system.css` - CSS variables
- 🎨 `rounded-design-2026.css` - All utilities
- 📋 `ROUNDED_DESIGN_IMPLEMENTATION.md` - Full guide
- ⚡ `tailwind.config.js` - Tailwind extensions

**Happy designing! 🚀**
