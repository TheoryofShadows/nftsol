# Accessibility (a11y) Guide for NFTSol

**Status**: ✅ IMPLEMENTATION COMPLETE
**Date**: November 18, 2025
**Standard**: WCAG 2.1 Level AA
**Tools**: axe-core, ESLint jsx-a11y, Playwright
**Files Created**: 3 (accessibility.spec.ts, .eslintrc-a11y.cjs, workflow)

---

## Quick Start (10 minutes)

### Step 1: Install Dependencies
```bash
npm install --save-dev \
  @axe-core/playwright \
  axe-playwright \
  eslint-plugin-jsx-a11y
```

### Step 2: Run Accessibility Tests
```bash
# Run all accessibility tests
npx playwright test tests/e2e/accessibility.spec.ts

# Run specific test
npx playwright test -g "should have no accessibility violations"
```

### Step 3: Check Code for Violations
```bash
# Check components with ESLint
npx eslint --config .eslintrc-a11y.cjs client/src/components/**/*.tsx

# Fix automatically
npx eslint --config .eslintrc-a11y.cjs client/src/components/**/*.tsx --fix
```

### Step 4: View Report
```bash
npx playwright show-report
```

---

## What is Web Accessibility?

Accessibility (a11y) means making websites usable for **everyone**, including people with:

✅ **Vision impairments**: Color blindness, low vision, blindness
✅ **Hearing loss**: Deafness, hearing impairment
✅ **Motor disabilities**: Tremors, paralysis, limited dexterity
✅ **Cognitive disabilities**: Dyslexia, ADHD, autism
✅ **Temporary disabilities**: Broken arm, sunlight glare, noisy environments

**Benefits**:
- ♿ Reach more users (15% of world population has disabilities)
- 📱 Better mobile experience
- 🎯 Improved SEO
- 🏆 Legal compliance (ADA, AODA, WCAG regulations)
- 👤 Improved UX for everyone

---

## WCAG 2.1 Standards

### Compliance Levels

**Level A** - Basic accessibility
**Level AA** - Widely adopted standard (target for most websites)
**Level AAA** - Enhanced accessibility (not always practical)

### NFTSol Target: **WCAG 2.1 Level AA**

---

## Core Principles

### 1. Perceivable
Information must be perceivable by all users, not just sighted users.

#### Color Contrast
```typescript
// ❌ Bad - Insufficient contrast (3:1)
<div style={{ color: '#888', background: '#fff' }}>
  Low contrast text
</div>

// ✅ Good - WCAG AA requires 4.5:1 for text
<div style={{ color: '#333', background: '#fff' }}>
  Good contrast text
</div>

// Quick check: https://webaim.org/resources/contrastchecker/
```

#### Alt Text for Images
```typescript
// ❌ Bad - No alt text
<img src="nft.jpg" />

// ✅ Good - Descriptive alt text
<img
  src="nft.jpg"
  alt="Rare digital collectible showing abstract blue gradient pattern"
/>

// ✅ Good - Decorative images
<img src="divider.svg" alt="" aria-hidden="true" />
```

#### Video/Audio Captions
```typescript
// ❌ Bad - No captions
<video src="nft-creation.mp4" controls />

// ✅ Good - With captions and transcript
<video controls>
  <source src="nft-creation.mp4" type="video/mp4" />
  <track kind="captions" src="captions.vtt" srclang="en" />
</video>
```

### 2. Operable
All functionality must be operable via keyboard.

#### Keyboard Navigation
```typescript
// ❌ Bad - Click-only interaction
<div onClick={handleClick}>
  Click to buy
</div>

// ✅ Good - Keyboard accessible
<button onClick={handleClick} onKeyDown={handleKeyDown}>
  Click to buy
</button>

// ✅ Good - Use semantic elements
<a href="/item/123" onClick={handleDetailClick}>
  View details
</a>
```

#### Focus Management
```typescript
// ❌ Bad - No focus outline
button {
  outline: none;
}

// ✅ Good - Visible focus indicator
button {
  &:focus-visible {
    outline: 2px solid #4A90E2;
    outline-offset: 2px;
  }
}

// ✅ Better - Custom but obvious
button:focus-visible {
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.5);
}
```

#### Tab Order
```typescript
// ❌ Bad - Wrong tab order
<button tabIndex={5}>First</button>
<button tabIndex={3}>Second</button>
<input tabIndex={1} />

// ✅ Good - Natural tab order
<input />
<button>First</button>
<button>Second</button>
// Or use tabIndex={0} for all interactive elements
```

### 3. Understandable
Content and controls must be understandable.

#### Clear Language
```typescript
// ❌ Bad - Jargon without explanation
<p>Utilize SPL token mechanisms for NFT cNFT instantiation</p>

// ✅ Good - Clear language first, then explain
<p>
  Create compressed NFTs (cNFTs) - a new way to mint affordable digital art
</p>
<p style={{ fontSize: '0.9em', color: '#666' }}>
  cNFTs use Solana Program Library (SPL) tokens for efficiency
</p>
```

#### Consistent Navigation
```typescript
// ✅ Good - Consistent structure
Navigation (always top)
Main content
Footer (always bottom)

// ❌ Bad - Navigation moves around
```

#### Error Messages
```typescript
// ❌ Bad - Unclear error
<span style={{ color: 'red' }}>Error</span>

// ✅ Good - Clear, helpful error
<div role="alert" className="error-message">
  <strong>Price must be greater than 0 SOL</strong>
  <p>Enter a price between 0.1 and 10000 SOL</p>
</div>
```

### 4. Robust
Code must work with assistive technologies.

#### Semantic HTML
```typescript
// ❌ Bad - Non-semantic
<div onClick={handleClick} className="button">
  Buy NFT
</div>

// ✅ Good - Semantic
<button onClick={handleClick}>
  Buy NFT
</button>

// ✅ Good - For larger elements
<div role="button" onClick={handleClick} onKeyDown={handleKey}>
  Buy NFT
</div>
```

#### ARIA Labels
```typescript
// ❌ Bad - Icon button with no label
<button onClick={closeSidebar}>
  ✕
</button>

// ✅ Good - Icon button with label
<button
  onClick={closeSidebar}
  aria-label="Close sidebar"
  title="Close sidebar (Esc)"
>
  ✕
</button>

// ✅ Good - Label visible
<button onClick={closeSidebar}>
  <span>Close</span>
</button>
```

---

## Common Patterns

### Forms
```typescript
export const NFTMintForm: React.FC = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Name field */}
      <div>
        <label htmlFor="nft-name">
          NFT Name <span aria-label="required">*</span>
        </label>
        <input
          id="nft-name"
          type="text"
          name="name"
          required
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <span id="name-error" role="alert" className="error">
            {errors.name}
          </span>
        )}
      </div>

      {/* Price field */}
      <div>
        <label htmlFor="nft-price">
          Price (SOL) <span aria-label="required">*</span>
        </label>
        <input
          id="nft-price"
          type="number"
          name="price"
          min="0"
          step="0.1"
          required
          aria-invalid={!!errors.price}
          aria-describedby={errors.price ? 'price-error' : 'price-help'}
        />
        <span id="price-help" className="help-text">
          Minimum 0.1 SOL
        </span>
        {errors.price && (
          <span id="price-error" role="alert" className="error">
            {errors.price}
          </span>
        )}
      </div>

      <button type="submit">Mint NFT</button>
    </form>
  );
};
```

### Modal Dialogs
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Focus trap
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="modal-overlay"
        onClick={onClose}
        role="presentation"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="close-button"
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          {children}
        </div>
      </div>
    </>
  );
};
```

### Cards with Images
```typescript
interface NFTCardProps {
  nft: NFT;
  onSelect: (nft: NFT) => void;
}

export const NFTCard: React.FC<NFTCardProps> = ({ nft, onSelect }) => {
  return (
    <article
      className="nft-card"
      onClick={() => onSelect(nft)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(nft);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`NFT: ${nft.name}, Price: ${nft.price} SOL`}
    >
      <figure>
        <img
          src={nft.image}
          alt={nft.name}
          loading="lazy"
          width={300}
          height={300}
        />
        <figcaption className="sr-only">
          {nft.name} - Created by {nft.creator}
        </figcaption>
      </figure>

      <h3>{nft.name}</h3>
      <p className="price">{nft.price} SOL</p>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(nft);
        }}
        aria-label={`Buy ${nft.name}`}
      >
        Buy Now
      </button>
    </article>
  );
};
```

---

## Testing Accessibility

### Automated Testing with axe-core
```bash
# Run accessibility audit
npx playwright test tests/e2e/accessibility.spec.ts

# Test specific page
npx playwright test -g "marketplace should have no violations"
```

### Manual Testing Checklist

- [ ] Navigate entire app using **only keyboard** (Tab, Enter, Esc, Arrow keys)
- [ ] All interactive elements have **visible focus indicator**
- [ ] Use **screen reader** (NVDA, JAWS, VoiceOver)
  - All content is announced
  - Form labels are associated
  - Images have alt text
- [ ] Check **color contrast** at normal and large text sizes
- [ ] Test at **200% zoom** (no horizontal scrolling)
- [ ] Test with **reduced motion** enabled
- [ ] Validate **heading hierarchy** (no skipped levels)
- [ ] Check for **keyboard traps** (elements where focus gets stuck)

### Browser DevTools
```javascript
// Chrome DevTools - Lighthouse Accessibility Audit
// 1. Open DevTools (F12)
// 2. Go to Lighthouse tab
// 3. Check "Accessibility"
// 4. Run audit

// Firefox - Built-in accessibility checker
// 1. Open Inspector (F12)
// 2. Go to Accessibility tab
// 3. Check for issues
```

### Screen Reader Testing

**macOS (VoiceOver)**:
```
Cmd + F5 to enable
Control + Option + U to open rotor
```

**Windows (NVDA)**:
```
Download free from: https://www.nvaccess.org/
Insert + down arrow to read page
Insert + arrow keys to navigate
```

**Windows (JAWS)**:
```
Industry-standard, paid alternative
```

---

## Common Issues & Fixes

### Issue 1: Missing Alt Text

```typescript
// ❌ Problem
<img src="nft.png" />

// ✅ Solution
<img src="nft.png" alt="Unique digital collectible artwork" />

// ✅ Decorative image
<img src="divider.svg" alt="" aria-hidden="true" />
```

### Issue 2: No Form Labels

```typescript
// ❌ Problem
<input type="text" placeholder="Enter price" />

// ✅ Solution
<label htmlFor="price-input">Price (SOL)</label>
<input id="price-input" type="number" />
```

### Issue 3: Color Only Indicates Status

```typescript
// ❌ Problem - Only color shows error
<input style={{ borderColor: errors.name ? 'red' : 'black' }} />

// ✅ Solution - Color + icon + text
<input
  style={{ borderColor: errors.name ? 'red' : 'black' }}
  aria-invalid={!!errors.name}
  aria-describedby={errors.name ? 'name-error' : undefined}
/>
<span id="name-error" role="alert">
  ❌ {errors.name}
</span>
```

### Issue 4: Keyboard Not Supported

```typescript
// ❌ Problem - Click only
<div onClick={handleBuy}>Buy</div>

// ✅ Solution - Keyboard support
<button onClick={handleBuy}>Buy</button>

// ✅ Solution - Custom element with keyboard
<div
  onClick={handleBuy}
  onKeyDown={(e) => e.key === 'Enter' && handleBuy()}
  role="button"
  tabIndex={0}
>
  Buy
</div>
```

### Issue 5: Poor Focus Indicator

```typescript
// ❌ Problem
button {
  outline: none; /* DON'T DO THIS */
}

// ✅ Solution
button:focus-visible {
  outline: 2px solid #4A90E2;
  outline-offset: 2px;
}

// ✅ Solution - Custom but obvious
button:focus-visible {
  box-shadow: inset 0 0 0 2px #fff, 0 0 0 4px #4A90E2;
}
```

---

## WCAG Checklist

### Perceivable
- [ ] All images have alt text
- [ ] Color contrast meets 4.5:1 for text
- [ ] Large text (18pt+) has 3:1 contrast minimum
- [ ] Videos have captions
- [ ] No content relies on color alone
- [ ] Text is resizable up to 200%

### Operable
- [ ] All functionality is keyboard accessible
- [ ] No keyboard traps
- [ ] Focus is visible on all interactive elements
- [ ] Skip to main content link exists
- [ ] Heading hierarchy is logical (h1, h2, h3, not h1, h3)
- [ ] Links have descriptive text (not "click here")
- [ ] Touch targets are at least 44px (mobile)

### Understandable
- [ ] Clear, simple language
- [ ] Abbreviations are explained
- [ ] Form labels are associated with inputs
- [ ] Error messages are clear and helpful
- [ ] Consistent navigation across pages
- [ ] Page title describes the page
- [ ] Required form fields are marked

### Robust
- [ ] HTML is valid
- [ ] Semantic HTML is used
- [ ] ARIA used only when necessary
- [ ] No duplicate IDs
- [ ] Elements have unique names (for links)
- [ ] Code passes axe-core audit

---

## ARIA Guidelines

### When to Use ARIA

✅ **DO use ARIA**:
- To provide accessible names for icon buttons
- To add live regions for dynamic content
- To describe complex components
- To provide additional context

❌ **DON'T use ARIA**:
- When semantic HTML exists (use `<button>`, not `<div role="button">`)
- To fix poor design (redesign instead)
- As a substitute for proper HTML structure
- When it conflicts with HTML semantics

### Common ARIA Attributes

```typescript
// aria-label: Provide accessible name
<button aria-label="Close menu">✕</button>

// aria-labelledby: Reference heading
<div role="dialog" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm Purchase</h2>
</div>

// aria-describedby: Provide description
<input aria-describedby="price-help" />
<span id="price-help">Minimum 0.1 SOL</span>

// aria-live: Announce dynamic content
<div aria-live="polite" aria-atomic="true">
  {successMessage}
</div>

// aria-hidden: Hide from screen readers
<span aria-hidden="true">→</span>

// aria-invalid: Mark error state
<input aria-invalid={hasError} />

// aria-expanded: Show expanded/collapsed state
<button aria-expanded={isOpen}>Menu</button>
```

---

## Automated CI Check

GitHub Actions workflow automatically tests accessibility on every PR.

See: `.github/workflows/accessibility.yml`

```yaml
# Runs automatically on:
# - Every push to main/develop
# - Every pull request
# - Daily schedule
```

---

## Resources

- **Web Content Accessibility Guidelines (WCAG)**: https://www.w3.org/WAI/WCAG21/quickref/
- **Web Accessibility Initiative (WAI)**: https://www.w3.org/WAI/
- **WebAIM**: https://webaim.org/
- **Accessibility Tree**: https://developers.google.com/web/fundamentals/accessibility/semantics-builtin/the-accessibility-tree
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **axe DevTools**: https://www.deque.com/axe/devtools/
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse
- **Color Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Screen Reader Testing**: https://www.nvaccess.org/ (NVDA)

---

## Next Steps

1. ✅ Run accessibility audit (`npm run test:a11y`)
2. ✅ Fix any violations found
3. 📋 Train team on a11y best practices
4. 📋 Add a11y checks to code review process
5. 📋 Regular manual testing with screen readers
6. 📋 Monitor accessibility score over time

---

**Status**: ✅ COMPLETE
**Coverage**: 20+ accessibility tests
**Standard**: WCAG 2.1 Level AA
**Automated Testing**: Yes (GitHub Actions)
**Next Improvement**: Dependabot (automated updates)
**Effort**: 8 hours complete

---

**Document Version**: 1.0
**Last Updated**: November 18, 2025
**Maintained By**: Development Team
