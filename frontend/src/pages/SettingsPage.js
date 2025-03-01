import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function SettingsPage() {
  const { apiClient, currentUser } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // User settings
  const [userSettings, setUserSettings] = useState({
    display_name: '',
    email: '',
    color: '#1976d2',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  
  // App settings
  const [appSettings, setAppSettings] = useState({
    comfyui_api_url: '',
    enable_real_time_collaboration: true,
    auto_save_interval: 60,
    max_upload_size_mb: 10,
    default_theme: 'light',
  });
  
  // System settings
  const [systemInfo, setSystemInfo] = useState({
    comfyui_version: '',
    python_version: '',
    cuda_version: '',
    gpu_info: '',
    installed_packages: [],
  });
  
  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      
      try {
        // Fetch user settings
        if (currentUser) {
          setUserSettings({
            ...userSettings,
            display_name: currentUser.display_name || '',
            email: currentUser.email || '',
            color: currentUser.color || '#1976d2',
          });
        }
        
        // Fetch app settings
        const appSettingsResponse = await apiClient.get('/api/settings');
        setAppSettings(appSettingsResponse.data);
        
        // Fetch system info
        const systemInfoResponse = await apiClient.get('/api/comfyui/system_info');
        setSystemInfo(systemInfoResponse.data);
      } catch (err) {
        setError('Failed to fetch settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [apiClient, currentUser]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle user settings change
  const handleUserSettingsChange = (e) => {
    const { name, value } = e.target;
    setUserSettings({ ...userSettings, [name]: value });
  };
  
  // Handle app settings change
  const handleAppSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppSettings({
      ...appSettings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  // Save user settings
  const handleSaveUserSettings = async () => {
    setSaving(true);
    
    try {
      // Validate passwords if changing
      if (userSettings.new_password || userSettings.current_password) {
        if (!userSettings.current_password) {
          throw new Error('Current password is required to change password');
        }
        
        if (userSettings.new_password !== userSettings.confirm_password) {
          throw new Error('New passwords do not match');
        }
        
        if (userSettings.new_password && userSettings.new_password.length < 8) {
          throw new Error('New password must be at least 8 characters');
        }
      }
      
      // Update user settings
      const response = await apiClient.put('/api/users/me', {
        display_name: userSettings.display_name,
        email: userSettings.email,
        color: userSettings.color,
        current_password: userSettings.current_password,
        new_password: userSettings.new_password,
      });
      
      // Clear password fields
      setUserSettings({
        ...userSettings,
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      
      setSnackbar({
        open: true,
        message: 'User settings saved successfully',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed: ${err.message || err.response?.data?.detail || 'Unknown error'}`,
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Save app settings
  const handleSaveAppSettings = async () => {
    setSaving(true);
    
    try {
      // Validate settings
      if (appSettings.auto_save_interval < 0) {
        throw new Error('Auto-save interval must be a positive number');
      }
      
      if (appSettings.max_upload_size_mb < 1) {
        throw new Error('Max upload size must be at least 1MB');
      }
      
      // Update app settings
      const response = await apiClient.put('/api/settings', appSettings);
      
      setSnackbar({
        open: true,
        message: 'Application settings saved successfully',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed: ${err.message || err.response?.data?.detail || 'Unknown error'}`,
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle snackbar close
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Refresh system info
  const handleRefreshSystemInfo = async () => {
    setLoading(true);
    
    try {
      const systemInfoResponse = await apiClient.get('/api/comfyui/system_info');
      setSystemInfo(systemInfoResponse.data);
      
      setSnackbar({
        open: true,
        message: 'System information refreshed',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to refresh system information',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Settings
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="User Settings" />
          {currentUser && currentUser.role === 'admin' && (
            <Tab label="Application Settings" />
          )}
          <Tab label="System Information" />
        </Tabs>
        
        {/* User Settings */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Profile Settings
                  </Typography>
                  
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Display Name"
                    name="display_name"
                    value={userSettings.display_name}
                    onChange={handleUserSettingsChange}
                  />
                  
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Email"
                    name="email"
                    type="email"
                    value={userSettings.email}
                    onChange={handleUserSettingsChange}
                  />
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      User Color
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: userSettings.color,
                          mr: 2,
                        }}
                      />
                      <TextField
                        name="color"
                        type="color"
                        value={userSettings.color}
                        onChange={handleUserSettingsChange}
                        sx={{ width: 100 }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Change Password
                  </Typography>
                  
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Current Password"
                    name="current_password"
                    type="password"
                    value={userSettings.current_password}
                    onChange={handleUserSettingsChange}
                  />
                  
                  <TextField
                    fullWidth
                    margin="normal"
                    label="New Password"
                    name="new_password"
                    type="password"
                    value={userSettings.new_password}
                    onChange={handleUserSettingsChange}
                  />
                  
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Confirm New Password"
                    name="confirm_password"
                    type="password"
                    value={userSettings.confirm_password}
                    onChange={handleUserSettingsChange}
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveUserSettings}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : 'Save User Settings'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Application Settings (Admin Only) */}
        {currentUser && currentUser.role === 'admin' && (
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      ComfyUI Configuration
                    </Typography>
                    
                    <TextField
                      fullWidth
                      margin="normal"
                      label="ComfyUI API URL"
                      name="comfyui_api_url"
                      value={appSettings.comfyui_api_url}
                      onChange={handleAppSettingsChange}
                      helperText="URL to the ComfyUI API (e.g., http://localhost:8188)"
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          name="enable_real_time_collaboration"
                          checked={appSettings.enable_real_time_collaboration}
                          onChange={handleAppSettingsChange}
                        />
                      }
                      label="Enable Real-time Collaboration"
                    />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      General Settings
                    </Typography>
                    
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Auto-save Interval (seconds)"
                      name="auto_save_interval"
                      type="number"
                      value={appSettings.auto_save_interval}
                      onChange={handleAppSettingsChange}
                      inputProps={{ min: 0 }}
                      helperText="Set to 0 to disable auto-save"
                    />
                    
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Max Upload Size (MB)"
                      name="max_upload_size_mb"
                      type="number"
                      value={appSettings.max_upload_size_mb}
                      onChange={handleAppSettingsChange}
                      inputProps={{ min: 1 }}
                    />
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="theme-label">Default Theme</InputLabel>
                      <Select
                        labelId="theme-label"
                        name="default_theme"
                        value={appSettings.default_theme}
                        onChange={handleAppSettingsChange}
                        label="Default Theme"
                      >
                        <MenuItem value="light">Light</MenuItem>
                        <MenuItem value="dark">Dark</MenuItem>
                        <MenuItem value="system">System Preference</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveAppSettings}
                    disabled={saving}
                  >
                    {saving ? <CircularProgress size={24} /> : 'Save Application Settings'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>
        )}
        
        {/* System Information */}
        <TabPanel value={tabValue} index={currentUser && currentUser.role === 'admin' ? 2 : 1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">System Information</Typography>
            
            <Button
              startIcon={<RefreshIcon />}
              onClick={handleRefreshSystemInfo}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      ComfyUI Information
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          ComfyUI Version
                        </Typography>
                        <Typography variant="body1">
                          {systemInfo.comfyui_version || 'Unknown'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Python Version
                        </Typography>
                        <Typography variant="body1">
                          {systemInfo.python_version || 'Unknown'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          CUDA Version
                        </Typography>
                        <Typography variant="body1">
                          {systemInfo.cuda_version || 'Unknown'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          GPU
                        </Typography>
                        <Typography variant="body1">
                          {systemInfo.gpu_info || 'Unknown'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Server Information
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Operating System
                        </Typography>
                        <Typography variant="body1">
                          {systemInfo.os || 'Unknown'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          CPU
                        </Typography>
                        <Typography variant="body1">
                          {systemInfo.cpu || 'Unknown'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Memory
                        </Typography>
                        <Typography variant="body1">
                          {systemInfo.memory
                            ? `${Math.round(systemInfo.memory / 1024 / 1024 / 1024)} GB`
                            : 'Unknown'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Disk Space
                        </Typography>
                        <Typography variant="body1">
                          {systemInfo.disk_space
                            ? `${Math.round(systemInfo.disk_space / 1024 / 1024 / 1024)} GB free`
                            : 'Unknown'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              {currentUser && currentUser.role === 'admin' && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Installed Packages
                      </Typography>
                      
                      {systemInfo.installed_packages && systemInfo.installed_packages.length > 0 ? (
                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                          <Grid container spacing={2}>
                            {systemInfo.installed_packages.map((pkg) => (
                              <Grid item xs={6} md={4} key={pkg.name}>
                                <Typography variant="body2">
                                  {pkg.name} {pkg.version}
                                </Typography>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      ) : (
                        <Typography variant="body2">No package information available</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </TabPanel>
      </Paper>
      
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

export default SettingsPage;
