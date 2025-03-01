import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Image as ImageIcon,
  Code as CodeIcon,
  People as PeopleIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';

function DashboardPage() {
  const { apiClient, currentUser } = useAuth();
  const { connected, users } = useSocket();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    workflows: 0,
    outputs: 0,
    recentWorkflows: [],
    recentOutputs: [],
    systemStats: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      
      try {
        // Fetch workflows count and recent workflows
        const workflowsResponse = await apiClient.get('/api/workflows?limit=5');
        
        // Fetch outputs count and recent outputs
        const outputsResponse = await apiClient.get('/api/outputs?limit=5');
        
        // Fetch system stats
        const systemStatsResponse = await apiClient.get('/api/comfyui/system_stats');
        
        setStats({
          workflows: workflowsResponse.data.length, // This is just the recent ones, in a real app you'd have a count endpoint
          outputs: outputsResponse.data.length, // Same here
          recentWorkflows: workflowsResponse.data,
          recentOutputs: outputsResponse.data,
          systemStats: systemStatsResponse.data,
        });
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [apiClient]);
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Dashboard</Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/editor')}
        >
          New Workflow
        </Button>
      </Box>
      
      {!connected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Not connected to collaboration server. Some features may be unavailable.
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <>
          {/* Stats cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: 'primary.main',
                  color: 'white',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CodeIcon sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    Workflows
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
                  {stats.workflows}
                </Typography>
                <Typography variant="body2">Total saved workflows</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: 'secondary.main',
                  color: 'white',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ImageIcon sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    Outputs
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
                  {stats.outputs}
                </Typography>
                <Typography variant="body2">Total generated outputs</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: 'success.main',
                  color: 'white',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    Online Users
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
                  {Object.keys(users).length || 1} {/* At least the current user */}
                </Typography>
                <Typography variant="body2">Currently active users</Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper
                sx={{
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  height: 140,
                  bgcolor: 'info.main',
                  color: 'white',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <StorageIcon sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    GPU Memory
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
                  {stats.systemStats?.cuda?.used_memory
                    ? `${Math.round(stats.systemStats.cuda.used_memory / 1024)} MB`
                    : 'N/A'}
                </Typography>
                <Typography variant="body2">
                  {stats.systemStats?.cuda?.total_memory
                    ? `of ${Math.round(stats.systemStats.cuda.total_memory / 1024)} MB`
                    : 'GPU memory usage'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Recent workflows and outputs */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Workflows
                  </Typography>
                  
                  <List>
                    {stats.recentWorkflows.length > 0 ? (
                      stats.recentWorkflows.map((workflow) => (
                        <React.Fragment key={workflow.id}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <CodeIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={workflow.name}
                              secondary={
                                <>
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="text.primary"
                                  >
                                    {workflow.description
                                      ? workflow.description.substring(0, 50) +
                                        (workflow.description.length > 50 ? '...' : '')
                                      : 'No description'}
                                  </Typography>
                                  <br />
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Created: {formatDate(workflow.created_at)}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                          <Divider variant="inset" component="li" />
                        </React.Fragment>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="No workflows found" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate('/workflows')}
                  >
                    View All Workflows
                  </Button>
                </CardActions>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Outputs
                  </Typography>
                  
                  <List>
                    {stats.recentOutputs.length > 0 ? (
                      stats.recentOutputs.map((output) => (
                        <React.Fragment key={output.id}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                <ImageIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={output.filename}
                              secondary={
                                <>
                                  <Chip
                                    size="small"
                                    label={output.file_type}
                                    sx={{ mr: 1 }}
                                  />
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Created: {formatDate(output.created_at)}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                          <Divider variant="inset" component="li" />
                        </React.Fragment>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="No outputs found" />
                      </ListItem>
                    )}
                  </List>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    onClick={() => navigate('/outputs')}
                  >
                    View All Outputs
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
          
          {/* System information */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      ComfyUI Version
                    </Typography>
                    <Typography variant="body1">
                      {stats.systemStats?.comfyui_version || 'Unknown'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Python Version
                    </Typography>
                    <Typography variant="body1">
                      {stats.systemStats?.python_version || 'Unknown'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      GPU
                    </Typography>
                    <Typography variant="body1">
                      {stats.systemStats?.cuda?.device || 'Unknown'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      CUDA Version
                    </Typography>
                    <Typography variant="body1">
                      {stats.systemStats?.cuda?.version || 'Unknown'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}

export default DashboardPage;
