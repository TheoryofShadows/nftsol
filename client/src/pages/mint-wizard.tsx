import React from 'react';
import { NFTMintingWizard } from '@/components/nft-minting-wizard';

export default function MintWizardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-green-900">
      <div className="container mx-auto py-8">
        <NFTMintingWizard />
      </div>
    </div>
  );
}