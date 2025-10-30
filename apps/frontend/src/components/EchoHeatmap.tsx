/**
 * Echo Heatmap Visualization
 * Displays CLOUT flow and contributor relationships
 * 
 * Status: Mock data ready, will enhance with real Orb API
 */

import React from 'react';
import { motion } from 'framer-motion';
import './EchoHeatmap.css';

interface HeatmapNode {
  id: string;
  label: string;
  value: number;
  type: 'contributor' | 'echo' | 'clout';
}

interface HeatmapEdge {
  from: string;
  to: string;
  weight: number;
  label: string;
}

interface HeatmapData {
  nodes: HeatmapNode[];
  edges: HeatmapEdge[];
}

interface EchoHeatmapProps {
  data: HeatmapData;
  ledgerId: string;
}

export const EchoHeatmap: React.FC<EchoHeatmapProps> = ({ data, ledgerId }) => {
  if (!data || !data.nodes.length) {
    return (
      <div className="heatmap-empty">
        <div className="empty-icon">🗺️</div>
        <p>No heatmap data yet. Add echoes to see contributor flow!</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="echo-heatmap"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="heatmap-header">
        <h3>🗺️ CLOUT Flow Heatmap</h3>
        <div className="heatmap-legend">
          <span className="legend-item contributor">👤 Contributor</span>
          <span className="legend-item echo">🎬 Echo</span>
          <span className="legend-item clout">⚡ CLOUT</span>
        </div>
      </div>

      <div className="heatmap-canvas">
        {/* Nodes */}
        {data.nodes.map((node, index) => (
          <motion.div
            key={node.id}
            className={`heatmap-node ${node.type}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
            style={{
              // Simple circular layout (replace with real graph layout)
              left: `${50 + 40 * Math.cos((index / data.nodes.length) * 2 * Math.PI)}%`,
              top: `${50 + 40 * Math.sin((index / data.nodes.length) * 2 * Math.PI)}%`,
            }}
            title={`${node.label}: ${node.value} CLOUT`}
          >
            <div className="node-icon">
              {node.type === 'contributor' && '👤'}
              {node.type === 'echo' && '🎬'}
              {node.type === 'clout' && '⚡'}
            </div>
            <div className="node-label">{node.label}</div>
            <div className="node-value">{node.value}</div>
          </motion.div>
        ))}

        {/* Edges (connections) */}
        <svg className="heatmap-edges" viewBox="0 0 100 100" preserveAspectRatio="none">
          {data.edges.map((edge, index) => {
            // Find node positions
            const fromIndex = data.nodes.findIndex(n => n.id === edge.from);
            const toIndex = data.nodes.findIndex(n => n.id === edge.to);
            
            const x1 = 50 + 40 * Math.cos((fromIndex / data.nodes.length) * 2 * Math.PI);
            const y1 = 50 + 40 * Math.sin((fromIndex / data.nodes.length) * 2 * Math.PI);
            const x2 = 50 + 40 * Math.cos((toIndex / data.nodes.length) * 2 * Math.PI);
            const y2 = 50 + 40 * Math.sin((toIndex / data.nodes.length) * 2 * Math.PI);

            return (
              <motion.line
                key={`${edge.from}-${edge.to}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(102, 126, 234, 0.5)"
                strokeWidth={Math.max(0.2, edge.weight / 100)}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <title>{edge.label}: {edge.weight}</title>
              </motion.line>
            );
          })}
        </svg>
      </div>

      <div className="heatmap-stats">
        <div className="stat">
          <span className="stat-label">Total Flow:</span>
          <span className="stat-value">
            {data.edges.reduce((sum, e) => sum + e.weight, 0)} CLOUT
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Contributors:</span>
          <span className="stat-value">
            {data.nodes.filter(n => n.type === 'contributor').length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Connections:</span>
          <span className="stat-value">{data.edges.length}</span>
        </div>
      </div>

      <div className="heatmap-footer">
        <small>
          🤖 Powered by Helius Orb (Mock Data) • Will show real-time analysis when Orb API is live
        </small>
      </div>
    </motion.div>
  );
};

export default EchoHeatmap;
