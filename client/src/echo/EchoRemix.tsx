import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useNotification } from '../components/NotificationSystem';
import TruthBadge from '../components/TruthBadge';

interface VideoLayer {
  id: string;
  videoUri: string;
  startTime: number; // seconds
  endTime: number; // seconds
  opacity: number; // 0-1
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  scale: number; // 0.5 - 2.0
  textOverlay?: {
    text: string;
    position: 'top' | 'bottom' | 'center';
    fontSize: number;
    color: string;
  };
}

interface EchoRemixProps {
  parentLedgerId: string;
  parentVideoUri: string;
  onRemixComplete?: (ledgerId: string) => void;
}

const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export default function EchoRemix({
  parentLedgerId,
  parentVideoUri,
  onRemixComplete,
}: EchoRemixProps) {
  const { publicKey } = useWallet();
  const { addNotification } = useNotification();

  const [layers, setLayers] = useState<VideoLayer[]>([
    {
      id: 'base',
      videoUri: parentVideoUri,
      startTime: 0,
      endTime: 30, // Default 30 seconds
      opacity: 1,
      position: 'center',
      scale: 1,
    },
  ]);

  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newTextOverlay, setNewTextOverlay] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [minting, setMinting] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load video duration on mount
  useEffect(() => {
    if (videoRef.current && layers[0]) {
      videoRef.current.addEventListener('loadedmetadata', () => {
        if (videoRef.current) {
          const duration = videoRef.current.duration;
          setLayers((prev) =>
            prev.map((layer) =>
              layer.id === 'base' ? { ...layer, endTime: duration || 30 } : layer
            )
          );
        }
      });
    }
  }, [layers[0]?.videoUri]);

  const addVideoLayer = () => {
    if (!newVideoUrl.trim()) {
      addNotification({
        type: 'error',
        title: 'Video URL Required',
        message: 'Please enter a valid video URL (Pinata IPFS link)',
        duration: 3000,
      });
      return;
    }

    const newLayer: VideoLayer = {
      id: `layer-${Date.now()}`,
      videoUri: newVideoUrl,
      startTime: 0,
      endTime: 10, // Default 10 seconds for overlay
      opacity: 0.8,
      position: 'bottom',
      scale: 0.5,
    };

    setLayers([...layers, newLayer]);
    setNewVideoUrl('');
    setSelectedLayerId(newLayer.id);

    addNotification({
      type: 'success',
      title: 'Layer Added',
      message: 'Video layer added. Adjust position, scale, and opacity below.',
      duration: 3000,
    });
  };

  const addTextOverlay = () => {
    if (!newTextOverlay.trim() || !selectedLayerId) {
      addNotification({
        type: 'error',
        title: 'Text Required',
        message: 'Please select a layer and enter text',
        duration: 3000,
      });
      return;
    }

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === selectedLayerId
          ? {
              ...layer,
              textOverlay: {
                text: newTextOverlay,
                position: 'bottom',
                fontSize: 24,
                color: '#FFFFFF',
              },
            }
          : layer
      )
    );

    setNewTextOverlay('');
    addNotification({
      type: 'success',
      title: 'Text Overlay Added',
      message: 'Text overlay added to selected layer',
      duration: 3000,
    });
  };

  const updateLayer = (layerId: string, updates: Partial<VideoLayer>) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === layerId ? { ...layer, ...updates } : layer))
    );
  };

  const removeLayer = (layerId: string) => {
    if (layerId === 'base') {
      addNotification({
        type: 'error',
        title: 'Cannot Remove Base Layer',
        message: 'The base video layer cannot be removed',
        duration: 3000,
      });
      return;
    }

    setLayers((prev) => prev.filter((layer) => layer.id !== layerId));
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null);
    }
  };

  const renderPreview = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    const { videoWidth, videoHeight } = video;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Draw base layer
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

    // Draw overlay layers
    layers.slice(1).forEach((layer) => {
      const layerVideo = document.createElement('video');
      layerVideo.src = layer.videoUri;
      layerVideo.currentTime = layer.startTime;

      layerVideo.addEventListener('loadeddata', () => {
        const scale = layer.scale;
        const layerWidth = videoWidth * scale;
        const layerHeight = videoHeight * scale;

        let x = 0;
        let y = 0;

        switch (layer.position) {
          case 'top':
            x = (videoWidth - layerWidth) / 2;
            y = 0;
            break;
          case 'bottom':
            x = (videoWidth - layerWidth) / 2;
            y = videoHeight - layerHeight;
            break;
          case 'left':
            x = 0;
            y = (videoHeight - layerHeight) / 2;
            break;
          case 'right':
            x = videoWidth - layerWidth;
            y = (videoHeight - layerHeight) / 2;
            break;
          case 'center':
            x = (videoWidth - layerWidth) / 2;
            y = (videoHeight - layerHeight) / 2;
            break;
        }

        ctx.globalAlpha = layer.opacity;
        ctx.drawImage(layerVideo, x, y, layerWidth, layerHeight);
        ctx.globalAlpha = 1;

        // Draw text overlay
        if (layer.textOverlay) {
          ctx.fillStyle = layer.textOverlay.color;
          ctx.font = `${layer.textOverlay.fontSize}px Arial`;
          ctx.textAlign = 'center';

          let textY = 0;
          switch (layer.textOverlay.position) {
            case 'top':
              textY = layer.textOverlay.fontSize + 20;
              break;
            case 'bottom':
              textY = videoHeight - 20;
              break;
            case 'center':
              textY = videoHeight / 2;
              break;
          }

          ctx.fillText(layer.textOverlay.text, videoWidth / 2, textY);
        }
      });
    });
  };

  const handleMintRemix = async () => {
    if (!publicKey || layers.length < 2) {
      addNotification({
        type: 'error',
        title: 'Requirements Not Met',
        message: 'Please add at least one video layer and connect your wallet',
        duration: 3000,
      });
      return;
    }

    setMinting(true);

    try {
      // Create remix metadata
      const remixMetadata = {
        parentLedgerId,
        layers: layers.map((layer) => ({
          videoUri: layer.videoUri,
          startTime: layer.startTime,
          endTime: layer.endTime,
          opacity: layer.opacity,
          position: layer.position,
          scale: layer.scale,
          textOverlay: layer.textOverlay,
        })),
        createdAt: new Date().toISOString(),
        creator: publicKey.toBase58(),
      };

      // Upload remix metadata to Irys
      const metadataResponse = await fetch(`${API_BASE}/api/echo/remix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentLedgerId,
          remixMetadata,
          creatorWallet: publicKey.toBase58(),
        }),
      });

      if (!metadataResponse.ok) {
        throw new Error('Failed to create remix');
      }

      const { ledgerId } = await metadataResponse.json();

      addNotification({
        type: 'success',
        title: '🎉 Remix Created!',
        message: 'Your layered video remix has been created. Ready to mint!',
        duration: 5000,
      });

      if (onRemixComplete) {
        onRemixComplete(ledgerId);
      }
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Remix Failed',
        message: error.message || 'Failed to create remix. Please try again.',
        duration: 5000,
      });
    } finally {
      setMinting(false);
    }
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">🎨 Echo Remix</h2>
          <p className="text-gray-400 text-sm">Layer videos and create collaborative remixes</p>
        </div>
        <WalletMultiButton className="btn-glass" />
      </div>

      {/* Preview Section */}
      <div className="glass p-4 rounded-xl mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Preview</h3>
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors text-white text-sm"
          >
            {previewMode ? 'Exit Preview' : 'Enter Preview'}
          </button>
        </div>

        {previewMode ? (
          <canvas
            ref={canvasRef}
            className="w-full rounded-lg bg-black"
            style={{ maxHeight: '400px' }}
          />
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              src={layers[0]?.videoUri}
              controls
              className="w-full rounded-lg"
              onTimeUpdate={renderPreview}
            />
            {/* Overlay indicators */}
            {layers.slice(1).map((layer) => (
              <div
                key={layer.id}
                className="absolute border-2 border-purple-400 border-dashed pointer-events-none"
                style={{
                  width: `${layer.scale * 100}%`,
                  height: `${layer.scale * 100}%`,
                  ...getPositionStyles(layer.position),
                }}
              >
                <div className="absolute -top-6 left-0 text-xs text-purple-400 bg-black/50 px-2 py-1 rounded">
                  Layer {layers.indexOf(layer)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Layer Management */}
      <div className="glass p-4 rounded-xl mb-4">
        <h3 className="text-white font-semibold mb-3">Layers ({layers.length})</h3>

        <div className="space-y-3 mb-4">
          {layers.map((layer, index) => (
            <div
              key={layer.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedLayerId === layer.id
                  ? 'border-purple-400 bg-purple-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
              onClick={() => setSelectedLayerId(layer.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">
                    {index === 0 ? 'Base Video' : `Layer ${index}`}
                  </span>
                  {layer.id === 'base' && (
                    <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                      Base
                    </span>
                  )}
                </div>
                {layer.id !== 'base' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLayer(layer.id);
                    }}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-400 font-mono truncate mb-2">
                {layer.videoUri.slice(0, 50)}...
              </div>

              {selectedLayerId === layer.id && layer.id !== 'base' && (
                <div className="mt-3 space-y-2 pt-3 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={layer.opacity}
                        onChange={(e) =>
                          updateLayer(layer.id, { opacity: parseFloat(e.target.value) })
                        }
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{Math.round(layer.opacity * 100)}%</span>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Scale</label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={layer.scale}
                        onChange={(e) =>
                          updateLayer(layer.id, { scale: parseFloat(e.target.value) })
                        }
                        className="w-full"
                      />
                      <span className="text-xs text-gray-500">{layer.scale}x</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Position</label>
                    <select
                      value={layer.position}
                      onChange={(e) =>
                        updateLayer(layer.id, { position: e.target.value as any })
                      }
                      className="w-full glass px-2 py-1 rounded text-white text-sm bg-transparent"
                    >
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="center">Center</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Start (s)</label>
                      <input
                        type="number"
                        min="0"
                        value={layer.startTime}
                        onChange={(e) =>
                          updateLayer(layer.id, { startTime: parseFloat(e.target.value) })
                        }
                        className="w-full glass px-2 py-1 rounded text-white text-sm bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">End (s)</label>
                      <input
                        type="number"
                        min="0"
                        value={layer.endTime}
                        onChange={(e) =>
                          updateLayer(layer.id, { endTime: parseFloat(e.target.value) })
                        }
                        className="w-full glass px-2 py-1 rounded text-white text-sm bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Video Layer */}
        <div className="space-y-2 pt-3 border-t border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Video URL (Pinata IPFS link)"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              className="flex-1 glass px-3 py-2 rounded text-white placeholder-gray-400 bg-transparent"
            />
            <button
              onClick={addVideoLayer}
              className="px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors text-white font-semibold"
            >
              + Add Layer
            </button>
          </div>
        </div>
      </div>

      {/* Text Overlay Section */}
      {selectedLayer && selectedLayer.id !== 'base' && (
        <div className="glass p-4 rounded-xl mb-4">
          <h3 className="text-white font-semibold mb-3">Text Overlay</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter text overlay"
              value={newTextOverlay}
              onChange={(e) => setNewTextOverlay(e.target.value)}
              className="w-full glass px-3 py-2 rounded text-white placeholder-gray-400 bg-transparent"
            />
            {selectedLayer.textOverlay && (
              <div className="p-2 bg-purple-500/10 rounded text-sm text-gray-300">
                Current: "{selectedLayer.textOverlay.text}"
              </div>
            )}
            <button
              onClick={addTextOverlay}
              className="w-full px-4 py-2 bg-cyan-500 rounded-lg hover:bg-cyan-600 transition-colors text-white font-semibold"
            >
              {selectedLayer.textOverlay ? 'Update Text' : 'Add Text Overlay'}
            </button>
          </div>
        </div>
      )}

      {/* Mint Remix Button */}
      <div className="glass p-4 rounded-xl">
        <button
          onClick={handleMintRemix}
          disabled={!publicKey || layers.length < 2 || minting}
          className="w-full btn-primary py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {minting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="loading-spinner w-5 h-5"></div>
              <span>Creating Remix...</span>
            </span>
          ) : (
            '🚀 Mint Remix NFT'
          )}
        </button>
        {layers.length < 2 && (
          <p className="text-gray-400 text-sm mt-2 text-center">
            Add at least one video layer to create a remix
          </p>
        )}
      </div>
    </div>
  );
}

function getPositionStyles(position: VideoLayer['position']): React.CSSProperties {
  switch (position) {
    case 'top':
      return { top: 0, left: '50%', transform: 'translateX(-50%)' };
    case 'bottom':
      return { bottom: 0, left: '50%', transform: 'translateX(-50%)' };
    case 'left':
      return { top: '50%', left: 0, transform: 'translateY(-50%)' };
    case 'right':
      return { top: '50%', right: 0, transform: 'translateY(-50%)' };
    case 'center':
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    default:
      return {};
  }
}

