/**
 * Archive Item Modal Component
 * Detailed view of archive item with action buttons
 */

import React, { useEffect, useState } from 'react';
import { SearchResult, archiveService } from '../services/archiveService';

interface ArchiveItemModalProps {
  item: SearchResult;
  onClose: () => void;
}

export const ArchiveItemModal: React.FC<ArchiveItemModalProps> = ({ item, onClose }) => {
  const [verifying, setVerifying] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [prepareResult, setPrepareResult] = useState<any | null>(null);

  // Let users dismiss the modal with Escape, matching NftDetailModal.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const handleVerifyWithGrok = async () => {
    setVerifying(true);
    try {
      const result = await archiveService.verifyWithGrok(item.identifier);
      setVerifyResult(result);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setVerifying(false);
    }
  };

  const handlePrepareForMint = async () => {
    setPreparing(true);
    try {
      const result = await archiveService.prepareForMint(item.identifier);
      setPrepareResult(result);
    } catch (error) {
      console.error('Preparation failed:', error);
    } finally {
      setPreparing(false);
    }
  };

  const handleOpenArchive = () => {
    window.open(item.archiveUrl, '_blank');
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
      >
        {/* Header */}
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-white/10 bg-black/50 backdrop-blur">
          <h2 className="text-2xl font-bold text-white">{item.title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Thumbnail */}
          {item.thumbnailUrl && (
            <div className="rounded-xl overflow-hidden">
              <img
                src={item.thumbnailUrl}
                alt={item.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-gray-300 leading-relaxed">
              {item.description || 'No description available'}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            {item.creator && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Creator</p>
                <p className="text-white font-semibold">{item.creator}</p>
              </div>
            )}

            {item.year && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Year</p>
                <p className="text-white font-semibold">{item.year}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-400 mb-1">Media Type</p>
              <p className="text-white font-semibold capitalize">{item.mediaType}</p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">License</p>
              <p className="text-white font-semibold">{item.licenseType}</p>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-1">Downloads</p>
              <p className="text-white font-semibold">{item.downloads.toLocaleString()}</p>
            </div>

            {item.language && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Language</p>
                <p className="text-white font-semibold uppercase">{item.language}</p>
              </div>
            )}

            {item.duration && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Duration</p>
                <p className="text-white font-semibold">{Math.floor(item.duration / 60)} min</p>
              </div>
            )}

            {item.format && (
              <div>
                <p className="text-sm text-gray-400 mb-1">Format</p>
                <p className="text-white font-semibold uppercase">{item.format}</p>
              </div>
            )}
          </div>

          {/* Identifier */}
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Archive Identifier</p>
            <p className="text-white font-mono text-sm break-all">{item.identifier}</p>
          </div>

          {/* Verify Result */}
          {verifyResult && (() => {
            const v = verifyResult.verification ?? verifyResult;
            const verified = v?.verified ?? verifyResult.readyForMinting;
            const score =
              typeof v?.truthScore === 'number'
                ? v.truthScore
                : typeof v?.confidence === 'number'
                  ? v.confidence
                  : undefined;
            const concerns: string[] = Array.isArray(v?.concerns) ? v.concerns : [];
            const palette = verified
              ? { bg: 'bg-green-500/20', border: 'border-green-500/50', head: 'text-green-300', body: 'text-green-200' }
              : { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', head: 'text-yellow-300', body: 'text-yellow-200' };
            return (
              <div className={`p-4 ${palette.bg} border ${palette.border} rounded-lg`}>
                <h4 className={`font-semibold ${palette.head} mb-2`}>
                  {verified ? '✓ Verified by Grok' : '⚠ Needs manual review'}
                  {typeof score === 'number' && (
                    <span className="ml-2 text-xs opacity-80">({score}% confidence)</span>
                  )}
                </h4>
                {v?.summary && (
                  <p className={`text-sm ${palette.body} mb-2`}>{v.summary}</p>
                )}
                {concerns.length > 0 && (
                  <ul className={`text-xs ${palette.body} list-disc list-inside space-y-1`}>
                    {concerns.map((concern, i) => (
                      <li key={i}>{concern}</li>
                    ))}
                  </ul>
                )}
                {!v?.summary && concerns.length === 0 && (
                  <p className={`text-sm ${palette.body}`}>
                    {verified
                      ? 'Grok confirmed the archive metadata for this item.'
                      : 'Grok could not fully verify this item. Review manually before minting.'}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Prepare Result */}
          {prepareResult && (
            <div className="p-4 bg-cyan-500/20 border border-cyan-500/50 rounded-lg">
              <h4 className="font-semibold text-cyan-300 mb-2">
                {prepareResult.readyForMinting
                  ? '✓ Prepared for Minting'
                  : '⚠ Preparation complete — review required'}
              </h4>
              {prepareResult.nextStep && (
                <p className="text-sm text-cyan-200 mb-2">{prepareResult.nextStep}</p>
              )}
              {prepareResult.permanentMetadataUri && (
                <p className="text-xs text-cyan-200/80 break-all">
                  <span className="opacity-70">Metadata URI:</span>{' '}
                  {prepareResult.permanentMetadataUri}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleVerifyWithGrok}
              disabled={verifying}
              className="px-4 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:bg-gray-500 text-white font-semibold transition-all"
            >
              {verifying ? 'Verifying...' : '🤖 Verify with Grok'}
            </button>

            <button
              onClick={handlePrepareForMint}
              disabled={preparing}
              className="px-4 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-500 text-white font-semibold transition-all"
            >
              {preparing ? 'Preparing...' : '🎨 Prepare for Mint'}
            </button>

            <button
              onClick={handleOpenArchive}
              className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all col-span-2"
            >
              📦 View on Archive.org
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveItemModal;
