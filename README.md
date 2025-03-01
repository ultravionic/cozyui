# Collaborative ComfyUI Platform

A collaborative platform for teams to work together on ComfyUI workflows in real-time.

## Features

- **User Authentication**: 
  - Login and registration system
  - Role-based access control (user, moderator, admin)
  - User profile management
- **Real-time Collaboration**: 
  - See team members' cursors in real-time
  - Unique color highlighting for each user's selections
  - Simultaneous image generation capabilities
- **Dashboard**:
  - Overview of recent activities
  - Statistics on workflows and outputs
  - Quick access to frequently used workflows
- **Workflow Editor**:
  - Real-time collaborative editing
  - Cursor tracking for multiple users
  - Node selection highlighting
  - Simultaneous workflow execution
- **Workflow Management**:
  - Save and organize workflows with metadata
  - Add tags and descriptions
  - Public and private workflows
  - Template workflows for quick starting points
- **Outputs Gallery**:
  - View and manage generated images
  - Filter and search functionality
  - Download and delete options
  - Metadata viewing
- **User Management (Admin Only)**:
  - Create, edit, and delete users
  - Reset user passwords
  - Toggle user active status
  - Assign user roles
- **Settings**:
  - User profile settings
  - Application settings (admin only)
  - System information and statistics
- **Resource Management**:
  - Easy integration with ComfyUI Manager
  - Simple addition of custom nodes and models
- **Shared Access**: All outputs accessible to all team members
- **Cost Optimization**: Scales down when not in use to minimize costs

## Technical Stack

- **Backend**: Python with FastAPI
- **Frontend**: React.js with Socket.IO for real-time features
- **Authentication**: JWT-based authentication
- **Database**: PostgreSQL for user data and workflow metadata
- **Deployment**: 
  - ComfyUI instance on RunPod
  - Web application hosted on Cloudflare Pages
  - Database on a managed service

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/collaborative-comfyui.git
cd collaborative-comfyui
```

2. Set up the backend:
```bash
cd backend
pip install -r requirements.txt
python scripts/init_db.py  # Initialize the database with an admin user
python main.py  # Start the backend server
```

3. Set up the frontend:
```bash
cd frontend
npm install
npm start
```

4. Access the application at `http://localhost:3000`

### Default Admin User
- Username: admin
- Password: admin (change this in production)

## Development

### Project Structure
- `/backend`: FastAPI backend server
  - `/api`: API routes
  - `/auth`: Authentication system
  - `/database`: Database models and connection
  - `/models`: Data models
  - `/services`: External services integration
  - `/scripts`: Utility scripts
- `/frontend`: React frontend
  - `/src/components`: Reusable UI components
  - `/src/pages`: Application pages
  - `/src/services`: API service connections
  - `/src/context`: React context providers
  - `/src/utils`: Utility functions

### API Documentation
The API documentation is available at `http://localhost:8000/docs` when the backend server is running.

## Deployment

### Deploying ComfyUI on RunPod

RunPod provides GPU-accelerated containers that are perfect for running ComfyUI.

1. **Create a RunPod Account**:
   - Sign up at [RunPod.io](https://www.runpod.io/)
   - Add a payment method to your account

2. **Deploy a GPU Pod**:
   - Select "Deploy" from the dashboard
   - Choose a template with PyTorch (or use a ComfyUI template if available)
   - Select a GPU that meets your needs (RTX 3090 or better recommended)
   - Choose a region close to your users
   - Set the container disk size (at least 20GB recommended)
   - Deploy the pod

3. **Set Up ComfyUI**:
   - Connect to your pod via SSH or the web terminal
   - Clone the ComfyUI repository:
     ```bash
     git clone https://github.com/comfyanonymous/ComfyUI.git
     cd ComfyUI
     ```
   - Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
   - Install additional nodes and models as needed

4. **Configure for External Access**:
   - Edit the `main.py` file to bind to all interfaces:
     ```bash
     sed -i 's/host="127.0.0.1"/host="0.0.0.0"/' main.py
     ```
   - Start ComfyUI:
     ```bash
     python main.py --listen
     ```
   - Note the HTTP URL provided by RunPod (in your pod details)

5. **Set Up Environment Variables**:
   - In your collaborative-comfyui backend, set the `COMFYUI_API_URL` to point to your RunPod instance

### Deploying the Web Application on Cloudflare Pages

1. **Prepare Your Repository**:
   - Push your code to a GitHub repository
   - Ensure your frontend build process is configured correctly in `package.json`

2. **Connect to Cloudflare Pages**:
   - Sign up for a Cloudflare account if you don't have one
   - Go to the Cloudflare dashboard and select "Pages"
   - Click "Create a project" and connect your GitHub account
   - Select your repository

3. **Configure Build Settings**:
   - Set build command: `cd frontend && npm install && npm run build`
   - Set build output directory: `frontend/build`
   - Add environment variables:
     - `REACT_APP_API_URL`: URL of your backend API
     - `REACT_APP_SOCKET_URL`: URL for your WebSocket connection

4. **Deploy**:
   - Click "Save and Deploy"
   - Wait for the build and deployment to complete
   - Your site will be available at `[project-name].pages.dev`

5. **Custom Domain (Optional)**:
   - In the Pages project settings, go to "Custom domains"
   - Add your domain and follow the DNS configuration instructions

### Setting Up the Backend API

You can deploy the backend API on a variety of platforms. Here are two common options:

#### Option 1: Deploy on RunPod alongside ComfyUI

1. **Install Backend Dependencies**:
   ```bash
   cd /path/to/collaborative-comfyui/backend
   pip install -r requirements.txt
   ```

2. **Set Environment Variables**:
   ```bash
   export SECRET_KEY="your-secret-key"
   export COMFYUI_API_URL="http://localhost:8188"
   export DATABASE_URL="postgresql://username:password@host:port/dbname"
   ```

3. **Run the Backend**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

4. **Set Up a Reverse Proxy** (optional but recommended):
   - Install Nginx:
     ```bash
     apt-get update && apt-get install -y nginx
     ```
   - Configure Nginx to proxy requests to your backend and ComfyUI

#### Option 2: Deploy on a Separate Cloud Provider

1. **Choose a Cloud Provider**:
   - Heroku, DigitalOcean, AWS, GCP, etc.

2. **Deploy Your Backend**:
   - Follow the provider's instructions for deploying a Python/FastAPI application
   - Set up the necessary environment variables
   - Configure a database (PostgreSQL recommended)

3. **Update Frontend Configuration**:
   - Update the API URL in your frontend to point to your deployed backend

### Database Setup

1. **Set Up PostgreSQL**:
   - Install PostgreSQL on your server or use a managed service
   - Create a database for your application
   - Set up a user with appropriate permissions

2. **Configure Database Connection**:
   - Set the `DATABASE_URL` environment variable in your backend deployment
   - Run migrations to set up the database schema:
     ```bash
     cd backend
     alembic upgrade head
     ```

3. **Initialize Admin User**:
   - Run the initialization script:
     ```bash
     python scripts/init_db.py
     ```

### Scaling and Maintenance

- **Auto-Scaling on RunPod**:
  - Configure your pod to automatically scale down when not in use
  - Use the RunPod API to programmatically start/stop your pod based on usage

- **Backup Strategy**:
  - Set up regular database backups
  - Store workflow files and outputs in a persistent storage solution

- **Monitoring**:
  - Set up monitoring for your backend and ComfyUI instance
  - Configure alerts for high resource usage or errors

## Next Steps

- Implement comprehensive testing for both frontend and backend
- Add more advanced collaboration features like chat and annotations
- Integrate with additional AI image generation models
- Develop a mobile-friendly interface
- Implement usage analytics and reporting
