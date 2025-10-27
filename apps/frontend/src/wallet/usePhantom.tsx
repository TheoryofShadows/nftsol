import { useCallback, useEffect, useMemo, useState } from 'react';
import { getProvider, PhantomProvider } from './getProvider';

export function usePhantom() {
  const provider = useMemo<PhantomProvider | undefined>(() => getProvider(), []);
  const [pubkey, setPubkey] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const desiredDevnetKey = '3WCkmqcoJZnVbscWSD3xr9tyG1kqnc3MsVPusriKKKad';

  // Eager connect (won't prompt if previously trusted)
  useEffect(() => {
    if (!provider) return;
    provider.connect({ onlyIfTrusted: true })
      .then(({ publicKey }) => {
        setConnected(true);
        setPubkey(publicKey.toBase58?.() ?? String(publicKey));
      })
      .catch(() => {});
  }, [provider]);

  // Event listeners
  useEffect(() => {
    if (!provider) return;
    const onConnect = (pk?: any) => {
      setConnected(true);
      const key = pk?.toBase58?.() ?? provider.publicKey?.toBase58?.() ?? pk?.toString?.() ?? '';
      setPubkey(key);
    };
    const onDisconnect = () => {
      setConnected(false);
      setPubkey(null);
    };
    const onAccountChanged = (pk?: any) => {
      if (pk) {
        setPubkey(pk.toBase58?.() ?? String(pk));
      } else {
        provider.connect().catch(() => {});
      }
    };
    provider.on('connect', onConnect);
    provider.on('disconnect', onDisconnect);
    provider.on('accountChanged', onAccountChanged);
  }, [provider]);

  const connect = useCallback(async () => {
    if (!provider) throw new Error('Phantom provider not found');
    const { publicKey } = await provider.connect();
    const key = publicKey.toBase58?.() ?? String(publicKey);
    setConnected(true);
    setPubkey(key);
    return key;
  }, [provider]);

  const disconnect = useCallback(async () => {
    if (!provider) return;
    await provider.disconnect();
    setConnected(false);
    setPubkey(null);
  }, [provider]);

  const isExpectedWallet = pubkey === desiredDevnetKey;
  return { provider, connected, pubkey, isExpectedWallet, connect, disconnect };
}
