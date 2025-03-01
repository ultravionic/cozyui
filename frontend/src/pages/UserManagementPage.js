import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';

function UserManagementPage() {
  const { apiClient, currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('create'); // 'create', 'edit', 'delete', 'resetPassword'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      
      try {
        const response = await apiClient.get('/api/users');
        setUsers(response.data);
      } catch (err) {
        setError('Failed to fetch users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [apiClient]);
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username) {
      errors.username = 'Username is required';
    }
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (dialogType === 'create') {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (!formData.role) {
      errors.role = 'Role is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Open dialog
  const handleOpenDialog = (type, user = null) => {
    setDialogType(type);
    setSelectedUser(user);
    
    if (type === 'create') {
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
      });
    } else if (type === 'edit' && user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        confirmPassword: '',
        role: user.role,
      });
    } else if (type === 'resetPassword' && user) {
      setFormData({
        ...formData,
        password: '',
        confirmPassword: '',
      });
    }
    
    setOpenDialog(true);
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormErrors({});
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      if (dialogType === 'create') {
        await apiClient.post('/api/users', {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        });
        
        setSnackbar({
          open: true,
          message: 'User created successfully',
          severity: 'success',
        });
      } else if (dialogType === 'edit' && selectedUser) {
        await apiClient.put(`/api/users/${selectedUser.id}`, {
          username: formData.username,
          email: formData.email,
          role: formData.role,
        });
        
        setSnackbar({
          open: true,
          message: 'User updated successfully',
          severity: 'success',
        });
      } else if (dialogType === 'resetPassword' && selectedUser) {
        await apiClient.post(`/api/users/${selectedUser.id}/reset-password`, {
          password: formData.password,
        });
        
        setSnackbar({
          open: true,
          message: 'Password reset successfully',
          severity: 'success',
        });
      }
      
      // Refresh users list
      const response = await apiClient.get('/api/users');
      setUsers(response.data);
      
      handleCloseDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed: ${err.response?.data?.detail || 'Unknown error'}`,
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setSubmitting(true);
    
    try {
      await apiClient.delete(`/api/users/${selectedUser.id}`);
      
      // Refresh users list
      const response = await apiClient.get('/api/users');
      setUsers(response.data);
      
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success',
      });
      
      handleCloseDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed: ${err.response?.data?.detail || 'Unknown error'}`,
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle toggle user active status
  const handleToggleUserActive = async (user) => {
    try {
      await apiClient.put(`/api/users/${user.id}/toggle-active`);
      
      // Refresh users list
      const response = await apiClient.get('/api/users');
      setUsers(response.data);
      
      setSnackbar({
        open: true,
        message: `User ${user.is_active ? 'deactivated' : 'activated'} successfully`,
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed: ${err.response?.data?.detail || 'Unknown error'}`,
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
  
  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'moderator':
        return 'warning';
      default:
        return 'primary';
    }
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">User Management</Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Add User
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Active' : 'Inactive'}
                      color={user.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.last_login ? formatDate(user.last_login) : 'Never'}
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Edit User">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('edit', user)}
                          disabled={user.id === currentUser.id}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Reset Password">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('resetPassword', user)}
                          disabled={user.id === currentUser.id}
                        >
                          <LockIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title={user.is_active ? 'Deactivate' : 'Activate'}>
                        <IconButton
                          size="small"
                          color={user.is_active ? 'default' : 'success'}
                          onClick={() => handleToggleUserActive(user)}
                          disabled={user.id === currentUser.id}
                        >
                          {user.is_active ? (
                            <LockIcon fontSize="small" />
                          ) : (
                            <LockOpenIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete User">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDialog('delete', user)}
                          disabled={user.id === currentUser.id}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Create/Edit User Dialog */}
      <Dialog
        open={openDialog && ['create', 'edit', 'resetPassword'].includes(dialogType)}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogType === 'create'
            ? 'Add New User'
            : dialogType === 'edit'
            ? 'Edit User'
            : 'Reset Password'}
        </DialogTitle>
        <DialogContent>
          {dialogType !== 'resetPassword' && (
            <>
              <TextField
                margin="normal"
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                error={!!formErrors.username}
                helperText={formErrors.username}
                disabled={submitting}
              />
              
              <TextField
                margin="normal"
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                disabled={submitting}
              />
              
              <FormControl
                fullWidth
                margin="normal"
                error={!!formErrors.role}
              >
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Role"
                  disabled={submitting}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="moderator">Moderator</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
                {formErrors.role && (
                  <Typography variant="caption" color="error">
                    {formErrors.role}
                  </Typography>
                )}
              </FormControl>
            </>
          )}
          
          {(dialogType === 'create' || dialogType === 'resetPassword') && (
            <>
              <TextField
                margin="normal"
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                error={!!formErrors.password}
                helperText={formErrors.password}
                disabled={submitting}
              />
              
              <TextField
                margin="normal"
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
                disabled={submitting}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            color="primary"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete User Dialog */}
      <Dialog
        open={openDialog && dialogType === 'delete'}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the user "{selectedUser?.username}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUser}
            color="error"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : 'Delete'}
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

export default UserManagementPage;
