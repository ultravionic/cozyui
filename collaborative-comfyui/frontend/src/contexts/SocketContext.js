import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function useSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState({});
  const [cursors, setCursors] = useState({});
  const [selectedNodes, setSelectedNodes] = useState({});
  const { isAuthenticated, currentUser } = useAuth();

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create socket connection
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000', {
      auth: {
        token: localStorage.getItem('token'),
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('users', (data) => {
      setUsers(data);
    });

    newSocket.on('cursor_update', (data) => {
      setCursors((prevCursors) => ({
        ...prevCursors,
        [data.userId]: {
          x: data.x,
          y: data.y,
          username: data.username,
          color: data.color,
          timestamp: Date.now(),
        },
      }));
    });

    newSocket.on('node_update', (data) => {
      setSelectedNodes((prevNodes) => ({
        ...prevNodes,
        [data.userId]: {
          nodeIds: data.nodeIds,
          username: data.username,
          color: data.color,
          timestamp: Date.now(),
        },
      }));
    });

    newSocket.on('workflow_change', (data) => {
      // Handle workflow changes from other users
      console.log('Workflow changed by', data.username);
      // You would update your workflow state here
    });

    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, currentUser]);

  // Clean up stale cursor and node selections
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Remove cursors that haven't been updated in 5 seconds
      setCursors((prevCursors) => {
        const newCursors = { ...prevCursors };
        Object.keys(newCursors).forEach((userId) => {
          if (now - newCursors[userId].timestamp > 5000) {
            delete newCursors[userId];
          }
        });
        return newCursors;
      });
      
      // Remove node selections that haven't been updated in 30 seconds
      setSelectedNodes((prevNodes) => {
        const newNodes = { ...prevNodes };
        Object.keys(newNodes).forEach((userId) => {
          if (now - newNodes[userId].timestamp > 30000) {
            delete newNodes[userId];
          }
        });
        return newNodes;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Function to update cursor position
  const updateCursorPosition = (x, y) => {
    if (socket && connected && currentUser) {
      socket.emit('cursor_move', {
        userId: currentUser.id,
        username: currentUser.username,
        color: currentUser.color,
        x,
        y,
      });
    }
  };

  // Function to update selected nodes
  const updateSelectedNodes = (nodeIds) => {
    if (socket && connected && currentUser) {
      socket.emit('node_select', {
        userId: currentUser.id,
        username: currentUser.username,
        color: currentUser.color,
        nodeIds,
      });
    }
  };

  // Function to broadcast workflow changes
  const broadcastWorkflowChange = (workflowData) => {
    if (socket && connected && currentUser) {
      socket.emit('workflow_update', {
        userId: currentUser.id,
        username: currentUser.username,
        workflowData,
      });
    }
  };

  const value = {
    socket,
    connected,
    users,
    cursors,
    selectedNodes,
    updateCursorPosition,
    updateSelectedNodes,
    broadcastWorkflowChange,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}
