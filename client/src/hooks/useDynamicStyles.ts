import { useEffect, useRef } from 'react';

/**
 * Hook to set CSS custom properties dynamically without using inline styles
 * Creates a style element that's injected into the document head
 */
export function useDynamicStyles(
  elementId: string,
  properties: Record<string, string | number>
) {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // Create or get style element
    let styleElement = document.getElementById(
      `dynamic-styles-${elementId}`
    ) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = `dynamic-styles-${elementId}`;
      document.head.appendChild(styleElement);
      styleRef.current = styleElement;
    }

    // Build CSS rules
    const cssRules: string[] = [];
    Object.entries(properties).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      cssRules.push(`${cssVar}: ${value};`);
    });

    // Update style element content
    styleElement.textContent = `:root { ${cssRules.join(' ')} }`;

    return () => {
      // Cleanup: remove style element when component unmounts
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [elementId, properties]);

  return styleRef.current;
}

/**
 * Hook to set CSS custom properties for a specific element by ID
 */
export function useElementStyles(
  elementId: string,
  properties: Record<string, string | number>
) {
  useEffect(() => {
    const element = document.getElementById(elementId);
    if (!element) return;

    // Create or get style element for this specific element
    let styleElement = document.getElementById(
      `element-styles-${elementId}`
    ) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = `element-styles-${elementId}`;
      document.head.appendChild(styleElement);
    }

    // Build CSS rules targeting the element
    const cssRules: string[] = [];
    Object.entries(properties).forEach(([key, value]) => {
      const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      cssRules.push(`${cssVar}: ${value};`);
    });

    // Update style element content
    styleElement.textContent = `#${elementId} { ${cssRules.join(' ')} }`;

    return () => {
      // Cleanup
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [elementId, properties]);
}

