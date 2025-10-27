import React, { useMemo, useState } from 'react';
import { proxify } from '../lib/imgProxy';

export default function ProxyCheck() {
  const [srcRaw, setSrcRaw] = useState("http://localhost:3003/ipfs-img?u=http://127.0.0.1:8088/image.png");
  const src = useMemo(() => proxify(srcRaw), [srcRaw]);

  return (
    <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 16 }}>
      <h4>Proxy Image Test</h4>
      <div style={{ display: 'flex', gap: 16 }}>
        <img src={src} alt="proxy test" style={{ maxWidth: 220, border: '1px solid #eee', borderRadius: 8 }} />
        <div style={{ wordBreak: 'break-all' }}>
          <div>Image URL: <code>{src}</code></div>
          <input
            value={srcRaw}
            onChange={e => setSrcRaw(e.target.value)}
            placeholder="https://... or ipfs://..."
            style={{ width: 520, marginTop: 8 }}
          />
        </div>
      </div>
    </div>
  );
}
