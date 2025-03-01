import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RemoteUserCursor from '../components/RemoteUserCursor';
import NodeSelectionHighlight from '../components/NodeSelectionHighlight';

function WorkflowEditorPage() {
  const { apiClient, currentUser } = useAuth();
  const { 
    connected, 
    cursors, 
    selectedNodes, 
    updateCursorPosition, 
    updateSelectedNodes, 
    broadcastWorkflowChange 
  } = useSocket();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  const editorRef = useRef(null);
  const comfyUIFrameRef = useRef(null);
  
  // Initialize ComfyUI iframe
  useEffect(() => {
    setLoading(true);
    
    // In a real implementation, we would initialize ComfyUI here
    // For now, we'll simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Track mouse movement for cursor position
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!editorRef.current) return;
      
      const rect = editorRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // Only update if the cursor is within the editor
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        updateCursorPosition(x, y);
      }
    };
    
    const editorElement = editorRef.current;
    if (editorElement) {
      editorElement.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => {
      if (editorElement) {
        editorElement.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [updateCursorPosition]);
  
  // Handle ComfyUI iframe messages
  useEffect(() => {
    const handleMessage = (event) => {
      // In a real implementation, we would handle messages from ComfyUI here
      // For example, node selection events
      
      // Simulated node selection
      if (event.data && event.data.type === 'nodeSelected') {
        updateSelectedNodes(event.data.nodeIds);
      }
      
      // Simulated workflow change
      if (event.data && event.data.type === 'workflowChanged') {
        broadcastWorkflowChange(event.data.workflow);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [updateSelectedNodes, broadcastWorkflowChange]);
  
  // Handle save workflow
  const handleSaveWorkflow = async () => {
    setSaving(true);
    
    try {
      // In a real implementation, we would get the workflow from ComfyUI
      const workflowJson = { /* Simulated workflow data */ };
      
      await apiClient.post('/api/workflows', {
        name: workflowName,
        description: workflowDescription,
        workflow_json: workflowJson,
      });
      
      setSaveDialogOpen(false);
      setSnackbar({
        open: true,
        message: 'Workflow saved successfully',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to save workflow',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle run workflow
  const handleRunWorkflow = async () => {
    setRunning(true);
    
    try {
      // In a real implementation, we would get the workflow from ComfyUI
      const prompt = { /* Simulated prompt data */ };
      
      await apiClient.post('/api/comfyui/prompt', {
        prompt,
      });
      
      setSnackbar({
        open: true,
        message: 'Workflow queued for execution',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to run workflow',
        severity: 'error',
      });
    } finally {
      setRunning(false);
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    
    setSnackbar({ ...snackbar, open: false });
  };
  
  return (
    <Box sx={{ height: 'calc(100vh - 88px)' }}>
      {/* Editor toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Workflow Editor</Typography>
        
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={() => setSaveDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Save
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PlayArrowIcon />}
            onClick={handleRunWorkflow}
            disabled={running}
          >
            {running ? <CircularProgress size={24} /> : 'Run'}
          </Button>
        </Box>
      </Box>
      
      {/* Connection status */}
      {!connected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Not connected to collaboration server. Some features may be unavailable.
        </Alert>
      )}
      
      {/* Editor area */}
      <Paper
        ref={editorRef}
        sx={{
          height: 'calc(100% - 48px)',
          position: 'relative',
          overflow: 'hidden',
          bgcolor: 'background.default',
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Loading ComfyUI...
            </Typography>
          </Box>
        ) : error ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography variant="h6" color="error">
              Error loading ComfyUI
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              {error}
            </Typography>
          </Box>
        ) : (
          <>
            {/* ComfyUI iframe would go here in a real implementation */}
            <iframe
              ref={comfyUIFrameRef}
              title="ComfyUI"
              src="about:blank"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
            
            {/* Remote user cursors */}
            {Object.entries(cursors).map(([userId, cursor]) => {
              // Don't show the current user's cursor
              if (currentUser && userId === currentUser.id.toString()) {
                return null;
              }
              
              return (
                <RemoteUserCursor
                  key={userId}
                  username={cursor.username}
                  color={cursor.color}
                  x={cursor.x}
                  y={cursor.y}
                />
              );
            })}
            
            {/* Node selection highlights */}
            {Object.entries(selectedNodes).map(([userId, selection]) => {
              // Don't show the current user's selection
              if (currentUser && userId === currentUser.id.toString()) {
                return null;
              }
              
              return (
                <NodeSelectionHighlight
                  key={userId}
                  username={selection.username}
                  color={selection.color}
                  nodeIds={selection.nodeIds}
                />
              );
            })}
          </>
        )}
      </Paper>
      
      {/* Save workflow dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Workflow</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a name and description for your workflow.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Workflow Name"
            type="text"
            fullWidth
            variant="outlined"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            disabled={saving}
          />
          <TextField
            margin="dense"
            id="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            disabled={saving}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveWorkflow}
            variant="contained"
            disabled={saving || !workflowName}
          >
            {saving ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default WorkflowEditorPage;
