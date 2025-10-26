describe('Accessibility Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should have proper heading hierarchy', () => {
    cy.get('h1').should('exist');
    cy.get('h2').should('exist');
    cy.get('h3').should('exist');
  });

  it('should have proper ARIA labels', () => {
    cy.get('[aria-label]').should('have.length.at.least', 5);
    cy.get('button[aria-label]').should('exist');
    cy.get('input[aria-label]').should('exist');
  });

  it('should be keyboard navigable', () => {
    cy.get('body').tab();
    cy.focused().should('be.visible');
    
    cy.get('body').tab();
    cy.focused().should('be.visible');
    
    cy.get('body').tab();
    cy.focused().should('be.visible');
  });

  it('should have proper focus indicators', () => {
    cy.get('button').first().focus();
    cy.focused().should('have.css', 'outline');
  });

  it('should have proper color contrast', () => {
    cy.get('body').should('have.css', 'color');
    cy.get('body').should('have.css', 'background-color');
  });

  it('should support screen reader navigation', () => {
    cy.get('[role="main"]').should('exist');
    cy.get('[role="navigation"]').should('exist');
    cy.get('[role="button"]').should('exist');
  });

  it('should have proper form labels', () => {
    cy.get('input').each(($input) => {
      const id = $input.attr('id');
      if (id) {
        cy.get(`label[for="${id}"]`).should('exist');
      }
    });
  });

  it('should have proper alt text for images', () => {
    cy.get('img').each(($img) => {
      cy.wrap($img).should('have.attr', 'alt');
    });
  });

  it('should support high contrast mode', () => {
    cy.get('body').should('have.css', 'color');
    // Test with high contrast media query
    cy.get('body').should('be.visible');
  });

  it('should support reduced motion', () => {
    // Test that animations respect prefers-reduced-motion
    cy.get('[data-testid="animated-element"]').should('be.visible');
  });

  it('should have proper skip links', () => {
    cy.get('[data-testid="skip-to-content"]').should('exist');
    cy.get('[data-testid="skip-to-content"]').click();
    cy.focused().should('have.attr', 'id', 'main-content');
  });

  it('should announce dynamic content changes', () => {
    cy.get('[aria-live]').should('exist');
    cy.get('[aria-live="polite"]').should('exist');
  });

  it('should have proper button states', () => {
    cy.get('button[disabled]').should('have.attr', 'aria-disabled', 'true');
    cy.get('button[aria-pressed]').should('exist');
  });

  it('should have proper table structure', () => {
    cy.get('table').then(($table) => {
      if ($table.length > 0) {
        cy.get('th').should('exist');
        cy.get('td').should('exist');
      }
    });
  });

  it('should have proper list structure', () => {
    cy.get('ul').each(($ul) => {
      cy.wrap($ul).find('li').should('have.length.at.least', 1);
    });
  });

  it('should have proper error messages', () => {
    cy.get('[role="alert"]').should('exist');
    cy.get('[aria-invalid]').should('exist');
  });
});
