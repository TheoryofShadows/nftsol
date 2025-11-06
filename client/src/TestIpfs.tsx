import React from 'react';
import { ipfsImg } from './lib/ipfsUrl';
import './styles/TestIpfs.css';

const TEST = 'ipfs://bafybeiefy2i5yfzkctg5of57nmdxkr7ilt5soyvcyoe7fa3fhsk3scodcy/image.png';

export default function TestIpfs() {
  return (
    <div className="test-ipfs-container">
      <h1>IPFS Proxy Test</h1>
      <p>Source: {TEST}</p>
      <img
        src={ipfsImg(TEST) as string}
        alt="Test NFT"
        className="test-ipfs-image"
      />
    </div>
  );
}
