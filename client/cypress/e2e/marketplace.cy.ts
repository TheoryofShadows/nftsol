describe('NFT Marketplace E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('[data-testid="marketplace-tab"]').click();
  });

  it('should load marketplace page', () => {
    cy.url().should('include', '/marketplace');
    cy.get('[data-testid="marketplace-title"]').should('be.visible');
  });

  it('should display NFT grid', () => {
    cy.get('[data-testid="nft-grid"]').should('be.visible');
    cy.get('[data-testid="nft-card"]').should('have.length.at.least', 1);
  });

  it('should filter NFTs by status', () => {
    cy.get('[data-testid="status-filter"]').select('listed');
    cy.get('[data-testid="nft-card"]').each(($card) => {
      cy.wrap($card).should('contain', 'For Sale');
    });
  });

  it('should search NFTs', () => {
    cy.get('[data-testid="search-input"]').type('test nft');
    cy.get('[data-testid="nft-card"]').should('contain', 'test nft');
  });

  it('should sort NFTs by price', () => {
    cy.get('[data-testid="sort-select"]').select('price');
    cy.get('[data-testid="nft-card"]').first().should('contain', 'SOL');
  });

  it('should handle infinite scroll', () => {
    cy.get('[data-testid="nft-grid"]').scrollTo('bottom');
    cy.get('[data-testid="loading-spinner"]').should('be.visible');
    cy.get('[data-testid="nft-card"]').should('have.length.at.least', 20);
  });

  it('should show NFT details on hover', () => {
    cy.get('[data-testid="nft-card"]').first().trigger('mouseover');
    cy.get('[data-testid="nft-actions"]').should('be.visible');
  });

  it('should open buy modal when buy button is clicked', () => {
    cy.get('[data-testid="buy-button"]').first().click();
    cy.get('[data-testid="buy-modal"]').should('be.visible');
    cy.get('[data-testid="buy-modal-title"]').should('contain', 'Buy NFT');
  });

  it('should handle wallet connection', () => {
    cy.get('[data-testid="connect-wallet"]').click();
    cy.get('[data-testid="wallet-modal"]').should('be.visible');
    cy.get('[data-testid="phantom-wallet"]').click();
    cy.get('[data-testid="wallet-connected"]').should('be.visible');
  });

  it('should show real-time updates', () => {
    cy.get('[data-testid="activity-feed"]').should('be.visible');
    cy.get('[data-testid="activity-item"]').should('have.length.at.least', 1);
  });

  it('should be responsive on mobile', () => {
    cy.viewport('iphone-x');
    cy.get('[data-testid="mobile-menu"]').should('be.visible');
    cy.get('[data-testid="nft-grid"]').should('be.visible');
  });
});
