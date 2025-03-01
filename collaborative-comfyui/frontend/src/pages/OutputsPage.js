import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
} from '@mui/icons-material';

function OutputsPage() {
  const { apiClient } = useAuth();
  
  const [outputs, setOutputs] = useState([]);
  const [filteredOutputs, setFilteredOutputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [workflows, setWorkflows] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [outputToDelete, setOutputToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Fetch outputs and workflows
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch outputs
        const outputsResponse = await apiClient.get('/api/outputs');
        setOutputs(outputsResponse.data);
        setFilteredOutputs(outputsResponse.data);
        
        // Fetch workflows for filtering
        const workflowsResponse = await apiClient.get('/api/workflows');
        setWorkflows(workflowsResponse.data);
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [apiClient]);
  
  // Filter and sort outputs
  useEffect(() => {
    let filtered = [...outputs];
    
    // Filter by workflow
    if (selectedWorkflow !== 'all') {
      filtered = filtered.filter(
        (output) => output.workflow_id === parseInt(selectedWorkflow)
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (output) =>
          output.filename.toLowerCase().includes(query) ||
          (output.metadata &&
            output.metadata.description &&
            output.metadata.description.toLowerCase().includes(query))
      );
    }
    
    // Filter by tab (file type)
    if (tabValue === 1) {
      filtered = filtered.filter((output) => output.file_type === 'image');
    } else if (tabValue === 2) {
      filtered = filtered.filter((output) => output.file_type === 'video');
    }
    
    // Sort outputs
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.filename.localeCompare(b.filename));
    }
    
    setFilteredOutputs(filtered);
  }, [outputs, searchQuery, selectedWorkflow, sortBy, tabValue]);
  
  // Handle delete output
  const handleDeleteOutput = async () => {
    if (!outputToDelete) return;
    
    setDeleting(true);
    
    try {
      await apiClient.delete(`/api/outputs/${outputToDelete.id}`);
      
      setOutputs((prevOutputs) =>
        prevOutputs.filter((output) => output.id !== outputToDelete.id)
      );
      
      setSnackbar({
        open: true,
        message: 'Output deleted successfully',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete output',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setOutputToDelete(null);
    }
  };
  
  // Handle download output
  const handleDownloadOutput = (output) => {
    // In a real implementation, we would create a download link
    // For now, we'll just show a success message
    setSnackbar({
      open: true,
      message: `Downloading ${output.filename}`,
      severity: 'info',
    });
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
  
  // Get workflow name by ID
  const getWorkflowName = (workflowId) => {
    const workflow = workflows.find((w) => w.id === workflowId);
    return workflow ? workflow.name : 'Unknown Workflow';
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Outputs Gallery</Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search outputs..."
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
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="workflow-filter-label">Workflow</InputLabel>
            <Select
              labelId="workflow-filter-label"
              id="workflow-filter"
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
              label="Workflow"
            >
              <MenuItem value="all">All Workflows</MenuItem>
              {workflows.map((workflow) => (
                <MenuItem key={workflow.id} value={workflow.id.toString()}>
                  {workflow.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="sort-label">Sort By</InputLabel>
            <Select
              labelId="sort-label"
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
              <MenuItem value="name">Name</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="All Files" />
          <Tab label="Images" />
          <Tab label="Videos" />
        </Tabs>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : filteredOutputs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            {searchQuery || selectedWorkflow !== 'all'
              ? 'No outputs match your filters.'
              : 'No outputs found. Generate some in the Workflow Editor.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredOutputs.map((output) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={output.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={
                    output.file_type === 'image'
                      ? `${process.env.REACT_APP_API_URL}/static/outputs/${output.filename}`
                      : '/placeholder.png' // You would need to add this placeholder image
                  }
                  alt={output.filename}
                  sx={{ objectFit: 'cover' }}
                />
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" noWrap>
                    {output.filename}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {getWorkflowName(output.workflow_id)}
                  </Typography>
                  
                  <Chip
                    size="small"
                    label={formatDate(output.created_at)}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
                
                <CardActions>
                  <Tooltip title="Download">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleDownloadOutput(output)}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Details">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedOutput(output);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Box sx={{ flexGrow: 1 }} />
                  
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setOutputToDelete(output);
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
      
      {/* Delete output dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Output</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the output "{outputToDelete?.filename}"?
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
            onClick={handleDeleteOutput}
            color="error"
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Output details dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
      >
        <DialogTitle>Output Details</DialogTitle>
        <DialogContent>
          {selectedOutput && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <img
                  src={
                    selectedOutput.file_type === 'image'
                      ? `${process.env.REACT_APP_API_URL}/static/outputs/${selectedOutput.filename}`
                      : '/placeholder.png'
                  }
                  alt={selectedOutput.filename}
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  {selectedOutput.filename}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Workflow:</strong> {getWorkflowName(selectedOutput.workflow_id)}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>Created:</strong> {formatDate(selectedOutput.created_at)}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  <strong>File Type:</strong> {selectedOutput.file_type}
                </Typography>
                
                {selectedOutput.metadata && selectedOutput.metadata.description && (
                  <Typography variant="body2" paragraph>
                    <strong>Description:</strong> {selectedOutput.metadata.description}
                  </Typography>
                )}
                
                {selectedOutput.metadata && selectedOutput.metadata.parameters && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Generation Parameters:
                    </Typography>
                    
                    <Paper variant="outlined" sx={{ p: 1, mt: 1 }}>
                      <pre style={{ margin: 0, overflow: 'auto' }}>
                        {JSON.stringify(selectedOutput.metadata.parameters, null, 2)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          {selectedOutput && (
            <Button
              color="primary"
              onClick={() => handleDownloadOutput(selectedOutput)}
            >
              Download
            </Button>
          )}
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

export default OutputsPage;
