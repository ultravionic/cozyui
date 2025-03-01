import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as ViewIcon,
  PlayArrow as RunIcon,
} from '@mui/icons-material';

function WorkflowsPage() {
  const { apiClient } = useAuth();
  const navigate = useNavigate();
  
  const [workflows, setWorkflows] = useState([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Fetch workflows
  useEffect(() => {
    const fetchWorkflows = async () => {
      setLoading(true);
      
      try {
        const response = await apiClient.get('/api/workflows');
        setWorkflows(response.data);
        setFilteredWorkflows(response.data);
      } catch (err) {
        setError('Failed to fetch workflows');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkflows();
  }, [apiClient]);
  
  // Filter workflows based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredWorkflows(workflows);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = workflows.filter(
      (workflow) =>
        workflow.name.toLowerCase().includes(query) ||
        (workflow.description && workflow.description.toLowerCase().includes(query))
    );
    
    setFilteredWorkflows(filtered);
  }, [searchQuery, workflows]);
  
  // Handle delete workflow
  const handleDeleteWorkflow = async () => {
    if (!workflowToDelete) return;
    
    setDeleting(true);
    
    try {
      await apiClient.delete(`/api/workflows/${workflowToDelete.id}`);
      
      setWorkflows((prevWorkflows) =>
        prevWorkflows.filter((workflow) => workflow.id !== workflowToDelete.id)
      );
      
      setSnackbar({
        open: true,
        message: 'Workflow deleted successfully',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete workflow',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };
  
  // Handle open workflow in editor
  const handleOpenWorkflow = (workflow) => {
    // In a real implementation, we would store the workflow ID in state or URL
    // and load it in the editor page
    navigate('/editor', { state: { workflowId: workflow.id } });
  };
  
  // Handle duplicate workflow
  const handleDuplicateWorkflow = async (workflow) => {
    try {
      const response = await apiClient.post('/api/workflows', {
        name: `${workflow.name} (Copy)`,
        description: workflow.description,
        workflow_json: workflow.workflow_json,
      });
      
      setWorkflows((prevWorkflows) => [...prevWorkflows, response.data]);
      
      setSnackbar({
        open: true,
        message: 'Workflow duplicated successfully',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to duplicate workflow',
        severity: 'error',
      });
    }
  };
  
  // Handle run workflow
  const handleRunWorkflow = async (workflow) => {
    try {
      await apiClient.post('/api/comfyui/prompt', {
        prompt: workflow.workflow_json,
        workflow_id: workflow.id,
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
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Saved Workflows</Typography>
        
        <TextField
          placeholder="Search workflows..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : filteredWorkflows.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            {searchQuery
              ? 'No workflows match your search query.'
              : 'No workflows found. Create one in the Workflow Editor.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredWorkflows.map((workflow) => (
            <Grid item xs={12} sm={6} md={4} key={workflow.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {workflow.name}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Chip
                      size="small"
                      label={`Created: ${formatDate(workflow.created_at)}`}
                      sx={{ mr: 1, mb: 1 }}
                    />
                    {workflow.updated_at && (
                      <Chip
                        size="small"
                        label={`Updated: ${formatDate(workflow.updated_at)}`}
                        sx={{ mb: 1 }}
                      />
                    )}
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {workflow.description || 'No description provided.'}
                  </Typography>
                </CardContent>
                
                <CardActions>
                  <Tooltip title="Open in Editor">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenWorkflow(workflow)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Run Workflow">
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => handleRunWorkflow(workflow)}
                    >
                      <RunIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Duplicate">
                    <IconButton
                      size="small"
                      onClick={() => handleDuplicateWorkflow(workflow)}
                    >
                      <CopyIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="View Details">
                    <IconButton size="small">
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Box sx={{ flexGrow: 1 }} />
                  
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setWorkflowToDelete(workflow);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Delete workflow dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Workflow</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the workflow "{workflowToDelete?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteWorkflow}
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={24} /> : 'Delete'}
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

export default WorkflowsPage;
