import React, { useState, useEffect } from 'react';
import { MobileLayout, MobileFairLaunch, MobileDeepLink } from '../components/MobileComponents';

interface FairLaunchData {
  fairLaunch: string;
  authority: string;
  tokenMint: string;
  treasury: string;
  config: {
    totalSupply: number;
    minAllocation: number;
    maxAllocation: number;
    delaySeconds: number;
    durationSeconds: number;
    whitelistRoot: string;
  };
  status: 'Active' | 'Finalized' | 'Cancelled';
  totalParticipants: number;
  totalAllocated: number;
  createdAt: number;
  startTime: number;
  endTime: number;
  finalizedAt?: number;
}

const MobileGenesisProtocol: React.FC = () => {
  const [fairLaunches, setFairLaunches] = useState<FairLaunchData[]>([]);
  const [selectedFairLaunch, setSelectedFairLaunch] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFairLaunches();
  }, []);

  const fetchFairLaunches = async () => {
    try {
      setIsLoading(true);
      // In a real app, you'd fetch from your API
      // For now, we'll use mock data
      const mockFairLaunches: FairLaunchData[] = [
        {
          fairLaunch: 'mock-fair-launch-1',
          authority: 'mock-authority',
          tokenMint: 'mock-token-mint',
          treasury: 'mock-treasury',
          config: {
            totalSupply: 1000000,
            minAllocation: 100,
            maxAllocation: 10000,
            delaySeconds: 3600,
            durationSeconds: 86400,
            whitelistRoot: 'mock-root'
          },
          status: 'Active',
          totalParticipants: 150,
          totalAllocated: 750000,
          createdAt: Date.now() - 86400000,
          startTime: Date.now() - 3600000,
          endTime: Date.now() + 82800000
        }
      ];
      
      setFairLaunches(mockFairLaunches);
    } catch (err) {
      setError('Failed to fetch fair launches');
      console.error('Error fetching fair launches:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParticipate = async (amount: number) => {
    if (!selectedFairLaunch) return;

    try {
      // Mock participation - in real app, call your API
      console.log(`Participating in fair launch ${selectedFairLaunch} with amount ${amount}`);
      
      // Show success message
      alert(`Successfully participated with ${amount} tokens!`);
    } catch (err) {
      console.error('Error participating in fair launch:', err);
      alert('Failed to participate in fair launch');
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeRemaining = (endTime: number) => {
    const now = Date.now();
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Ended';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#4caf50';
      case 'Finalized': return '#2196f3';
      case 'Cancelled': return '#f44336';
      default: return '#666';
    }
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading fair launches...</p>
        </div>
      </MobileLayout>
    );
  }

  if (error) {
    return (
      <MobileLayout>
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchFairLaunches} className="retry-btn">
            Retry
          </button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="mobile-genesis-protocol">
        <div className="page-header">
          <h1>🎲 Genesis Protocol</h1>
          <p>Fair token launches on Solana</p>
        </div>

        {fairLaunches.length === 0 ? (
          <div className="no-fair-launches">
            <h3>No Active Fair Launches</h3>
            <p>Check back later for new fair launch opportunities.</p>
          </div>
        ) : (
          <div className="fair-launches-list">
            {fairLaunches.map((fairLaunch) => (
              <div key={fairLaunch.fairLaunch} className="fair-launch-card">
                <div className="card-header">
                  <h3>Fair Launch #{fairLaunch.fairLaunch.slice(-8)}</h3>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(fairLaunch.status) }}
                  >
                    {fairLaunch.status}
                  </div>
                </div>

                <div className="card-content">
                  <div className="launch-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Supply:</span>
                      <span className="stat-value">
                        {fairLaunch.config.totalSupply.toLocaleString()}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Participants:</span>
                      <span className="stat-value">
                        {fairLaunch.totalParticipants}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Allocated:</span>
                      <span className="stat-value">
                        {fairLaunch.totalAllocated.toLocaleString()}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Time Remaining:</span>
                      <span className="stat-value">
                        {getTimeRemaining(fairLaunch.endTime)}
                      </span>
                    </div>
                  </div>

                  <div className="allocation-range">
                    <p>
                      <strong>Allocation Range:</strong> {fairLaunch.config.minAllocation.toLocaleString()} - {fairLaunch.config.maxAllocation.toLocaleString()}
                    </p>
                  </div>

                  <div className="card-actions">
                    <button
                      onClick={() => setSelectedFairLaunch(fairLaunch.fairLaunch)}
                      className="view-details-btn"
                    >
                      View Details
                    </button>
                    
                    {fairLaunch.status === 'Active' && (
                      <button
                        onClick={() => setSelectedFairLaunch(fairLaunch.fairLaunch)}
                        className="participate-btn"
                      >
                        Participate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedFairLaunch && (
          <div className="fair-launch-modal">
            <div className="modal-overlay" onClick={() => setSelectedFairLaunch(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Fair Launch Details</h2>
                  <button 
                    className="close-btn"
                    onClick={() => setSelectedFairLaunch(null)}
                  >
                    ×
                  </button>
                </div>
                
                <div className="modal-body">
                  {(() => {
                    const fairLaunch = fairLaunches.find(fl => fl.fairLaunch === selectedFairLaunch);
                    if (!fairLaunch) return null;

                    return (
                      <>
                        <MobileFairLaunch
                          fairLaunch={fairLaunch.fairLaunch}
                          onParticipate={handleParticipate}
                        />
                        
                        <div className="deep-link-section">
                          <h3>Mobile Deep Link</h3>
                          <MobileDeepLink
                            type="fair-launch"
                            data={{
                              fairLaunch: fairLaunch.fairLaunch,
                              returnUrl: window.location.href
                            }}
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="info-section">
          <h3>How It Works</h3>
          <div className="info-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Connect Wallet</h4>
                <p>Connect your mobile wallet to participate</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Choose Allocation</h4>
                <p>Select your desired token allocation amount</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Participate</h4>
                <p>Submit your participation in the fair launch</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Claim Tokens</h4>
                <p>Claim your tokens after the launch finalizes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .mobile-genesis-protocol {
          max-width: 100%;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          margin-bottom: 32px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px;
        }

        .page-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
        }

        .page-header p {
          margin: 0;
          font-size: 16px;
          opacity: 0.9;
        }

        .loading-container, .error-container {
          text-align: center;
          padding: 40px 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #2196f3;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .retry-btn {
          padding: 12px 24px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
        }

        .no-fair-launches {
          text-align: center;
          padding: 40px 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .fair-launches-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .fair-launch-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .card-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: white;
        }

        .card-content {
          padding: 20px;
        }

        .launch-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          font-weight: 600;
        }

        .stat-value {
          font-size: 16px;
          color: #333;
          font-weight: 700;
        }

        .allocation-range {
          margin-bottom: 20px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .allocation-range p {
          margin: 0;
          font-size: 14px;
          color: #333;
        }

        .card-actions {
          display: flex;
          gap: 12px;
        }

        .view-details-btn, .participate-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-details-btn {
          background: #6c757d;
          color: white;
        }

        .view-details-btn:hover {
          background: #5a6268;
        }

        .participate-btn {
          background: #28a745;
          color: white;
        }

        .participate-btn:hover {
          background: #218838;
        }

        .fair-launch-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
        }

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          max-width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e9ecef;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #333;
        }

        .modal-body {
          padding: 20px;
        }

        .deep-link-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e9ecef;
        }

        .deep-link-section h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #333;
        }

        .info-section {
          margin-top: 40px;
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .info-section h3 {
          margin: 0 0 24px 0;
          font-size: 20px;
          color: #333;
          text-align: center;
        }

        .info-steps {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .step-number {
          width: 32px;
          height: 32px;
          background: #2196f3;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }

        .step-content h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          color: #333;
        }

        .step-content p {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        @media (max-width: 768px) {
          .launch-stats {
            grid-template-columns: 1fr;
          }
          
          .card-actions {
            flex-direction: column;
          }
          
          .modal-overlay {
            padding: 10px;
          }
        }
      `}</style>
    </MobileLayout>
  );
};

export default MobileGenesisProtocol;
