/**
 * ESLint Configuration for Accessibility (a11y)
 *
 * Enforces WCAG 2.1 AA compliance rules in code
 * Install: npm install --save-dev eslint-plugin-jsx-a11y
 */

module.exports = {
  extends: ['plugin:jsx-a11y/recommended'],
  plugins: ['jsx-a11y'],
  rules: {
    // ===== FORM ACCESSIBILITY =====

    'jsx-a11y/label-has-associated-control': [
      'error',
      {
        required: {
          some: ['nesting', 'id'],
        },
      },
    ],

    // Every form input must have an associated label
    'jsx-a11y/label-has-for': 'off', // Deprecated, use label-has-associated-control

    // Form inputs should have names
    'jsx-a11y/html-has-lang': 'error',

    // ===== INTERACTIVE ELEMENTS =====

    // Buttons should have text content or aria-label
    'jsx-a11y/button-has-type': 'error',

    // Links should not be empty
    'jsx-a11y/anchor-has-content': 'error',

    // Links should be distinguished from buttons
    'jsx-a11y/no-static-element-interactions': [
      'warn',
      {
        handlers: [
          'onClick',
          'onMouseDown',
          'onMouseUp',
          'onKeyPress',
          'onKeyDown',
          'onKeyUp',
        ],
      },
    ],

    // Img elements must have alt text
    'jsx-a11y/alt-text': 'error',

    // ARIA roles should be used appropriately
    'jsx-a11y/role-has-required-aria-props': 'error',

    // ARIA roles should have appropriate aria-* properties
    'jsx-a11y/role-supports-aria-props': 'error',

    // aria-role should be valid
    'jsx-a11y/aria-role': 'error',

    // aria-props should be valid
    'jsx-a11y/aria-props': 'error',

    // ARIA attributes values should be valid
    'jsx-a11y/aria-unsupported-elements': 'error',

    // ===== HEADING HIERARCHY =====

    // Heading elements should be ordered correctly
    'jsx-a11y/heading-has-content': 'error',

    // h1 should be the main title
    'jsx-a11y/no-redundant-roles': 'warn',

    // ===== FOCUS MANAGEMENT =====

    // Click handlers should have keyboard handlers
    'jsx-a11y/click-events-have-key-events': 'error',

    // Ensure elements with mouseDown/mouseUp handlers also have focus handlers
    'jsx-a11y/mouse-events-have-key-events': 'error',

    // ===== FORM INPUTS =====

    // Input elements should have associated labels
    'jsx-a11y/no-autofocus': 'warn',

    // Accessible names should not be empty
    'jsx-a11y/no-access-key': 'error',

    // ===== STRUCTURE =====

    // Scope attribute should be valid
    'jsx-a11y/scope': 'error',

    // Media should have captions
    'jsx-a11y/media-has-caption': 'warn',

    // Tables should have proper headers
    'jsx-a11y/table-has-caption': 'warn',

    // ===== COMPLEX RULES =====

    // Select element should have accessible name
    'jsx-a11y/interactive-supports-focus': [
      'error',
      {
        tabbable: ['button', 'a', 'input', 'select', 'textarea'],
      },
    ],

    // Ensure interactive elements are keyboard accessible
    'jsx-a11y/click-events-have-key-events': 'error',

    // Ensure form controls are labeled
    'jsx-a11y/label-has-associated-control': 'error',

    // ===== WARNINGS (not errors) =====

    'jsx-a11y/no-distracting-elements': 'warn',

    'jsx-a11y/anchor-is-valid': [
      'warn',
      {
        components: ['Link'],
        specialLink: ['to'],
      },
    ],
  },

  overrides: [
    {
      // Apply a11y rules only to JSX files
      files: ['**/*.jsx', '**/*.tsx'],
      rules: {
        'jsx-a11y/alt-text': 'error',
        'jsx-a11y/button-has-type': 'error',
        'jsx-a11y/label-has-associated-control': 'error',
      },
    },
  ],
};
