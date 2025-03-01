import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

function NodeSelectionHighlight({ username, color, nodeIds }) {
  const [nodeElements, setNodeElements] = useState([]);
  
  // In a real implementation, we would find the DOM elements for the selected nodes
  // and highlight them. This is a simplified version that simulates the behavior.
  useEffect(() => {
    // Simulate finding node elements
    // In a real implementation, we would use the ComfyUI API to find the nodes
    const simulatedElements = nodeIds.map((nodeId) => ({
      id: nodeId,
      // Random position for demonstration
      rect: {
        x: Math.random() * 80 + 10, // 10% to 90% of width
        y: Math.random() * 80 + 10, // 10% to 90% of height
        width: 150,
        height: 100,
      },
    }));
    
    setNodeElements(simulatedElements);
  }, [nodeIds]);
  
  return (
    <>
      {nodeElements.map((node) => (
        <Box
          key={node.id}
          sx={{
            position: 'absolute',
            left: `${node.rect.x}%`,
            top: `${node.rect.y}%`,
            width: `${node.rect.width}px`,
            height: `${node.rect.height}px`,
            border: `2px solid ${color || '#3498db'}`,
            borderRadius: '4px',
            pointerEvents: 'none',
            zIndex: 999,
            boxShadow: `0 0 0 2px ${color || '#3498db'}33`,
            animation: 'pulse 2s infinite',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-20px',
              left: 0,
              backgroundColor: color || '#3498db',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              fontSize: '12px',
              content: `"${username}"`,
            },
            '@keyframes pulse': {
              '0%': {
                boxShadow: `0 0 0 0 ${color || '#3498db'}66`,
              },
              '70%': {
                boxShadow: `0 0 0 6px ${color || '#3498db'}00`,
              },
              '100%': {
                boxShadow: `0 0 0 0 ${color || '#3498db'}00`,
              },
            },
          }}
        />
      ))}
    </>
  );
}

export default NodeSelectionHighlight;
