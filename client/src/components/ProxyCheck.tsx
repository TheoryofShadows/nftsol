import React, { useMemo, useState } from 'react';
import { proxify } from '../lib/imgProxy';
import '../styles/ProxyCheck.css';

export default function ProxyCheck() {
  const [srcRaw, setSrcRaw] = useState(
    `${import.meta.env.VITE_IMG_PROXY_BASE || import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/ipfs-img?u=http://127.0.0.1:8088/image.png`
  );
  const src = useMemo(() => proxify(srcRaw), [srcRaw]);

  return (
    <div className="proxy-check-container">
      <h4>Proxy Image Test</h4>
      <div className="proxy-check-content">
        <img
          src={src}
          alt="proxy test"
          className="proxy-check-image"
        />
        <div className="proxy-check-text">
          <div>
            Image URL: <code>{src}</code>
          </div>
          <input
            value={srcRaw}
            onChange={(e) => setSrcRaw(e.target.value)}
            placeholder="https://... or ipfs://..."
            className="proxy-check-input"
          />
        </div>
      </div>
    </div>
  );
}
