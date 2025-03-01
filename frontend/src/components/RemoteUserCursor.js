import React from 'react';
import { Box, Typography } from '@mui/material';

function RemoteUserCursor({ username, color, x, y }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        pointerEvents: 'none',
        zIndex: 1000,
        transform: 'translate(-50%, -50%)',
        transition: 'left 0.1s ease, top 0.1s ease',
      }}
    >
      {/* Cursor */}
      <Box
        sx={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: `12px solid ${color || '#3498db'}`,
          transform: 'rotate(-45deg)',
          position: 'relative',
        }}
      />
      
      {/* Username label */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          backgroundColor: color || '#3498db',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
      >
        {username}
      </Typography>
    </Box>
  );
}

export default RemoteUserCursor;
