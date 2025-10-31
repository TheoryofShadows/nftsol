import React from 'react';
import { ipfsImg } from './lib/ipfsUrl';

const TEST = 'ipfs://bafybeiefy2i5yfzkctg5of57nmdxkr7ilt5soyvcyoe7fa3fhsk3scodcy/image.png';

export default function TestIpfs() {
  return (
    <div style={{ padding: 24 }}>
      <h1>IPFS Proxy Test</h1>
      <p>Source: {TEST}</p>
      <img
        src={ipfsImg(TEST) as string}
        alt="Test NFT"
        style={{ maxWidth: 320, borderRadius: 12 }}
      />
    </div>
  );
}
