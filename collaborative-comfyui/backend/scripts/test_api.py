#!/usr/bin/env python3
"""
Test script for the Collaborative ComfyUI API.
This script tests various API endpoints to ensure they're working correctly.
"""

import sys
import os
import requests
import json
from pathlib import Path

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

# Configuration
API_URL = "http://localhost:8000"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"
TEST_USER = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpassword"
}

def print_header(title):
    """Print a formatted header."""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80)

def print_response(response):
    """Print a formatted API response."""
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")

def get_token(username, password):
    """Get an authentication token."""
    print_header(f"Getting token for {username}")
    
    response = requests.post(
        f"{API_URL}/auth/token",
        data={"username": username, "password": password}
    )
    
    print_response(response)
    
    if response.status_code == 200:
        return response.json().get("access_token")
    return None

def register_user(user_data):
    """Register a new user."""
    print_header("Registering new user")
    
    response = requests.post(
        f"{API_URL}/auth/register",
        json=user_data
    )
    
    print_response(response)
    return response.status_code == 200

def get_current_user(token):
    """Get the current user's information."""
    print_header("Getting current user")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{API_URL}/api/users/me",
        headers=headers
    )
    
    print_response(response)
    return response.status_code == 200

def update_user_settings(token, user_data):
    """Update user settings."""
    print_header("Updating user settings")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.put(
        f"{API_URL}/api/users/me",
        json=user_data,
        headers=headers
    )
    
    print_response(response)
    return response.status_code == 200

def get_app_settings(token):
    """Get application settings."""
    print_header("Getting application settings")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{API_URL}/api/settings",
        headers=headers
    )
    
    print_response(response)
    return response.status_code == 200

def get_system_info(token):
    """Get system information."""
    print_header("Getting system information")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{API_URL}/api/comfyui/system_info",
        headers=headers
    )
    
    print_response(response)
    return response.status_code == 200

def get_all_users(token):
    """Get all users (admin only)."""
    print_header("Getting all users")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(
        f"{API_URL}/api/users",
        headers=headers
    )
    
    print_response(response)
    return response.status_code == 200

def main():
    """Main function to run the tests."""
    print_header("Starting API Tests")
    
    # Step 1: Register a test user
    register_success = register_user(TEST_USER)
    if not register_success:
        print("Registration failed, but continuing with tests...")
    
    # Step 2: Get admin token
    admin_token = get_token(ADMIN_USERNAME, ADMIN_PASSWORD)
    if not admin_token:
        print("Failed to get admin token. Exiting...")
        return
    
    # Step 3: Get test user token
    user_token = get_token(TEST_USER["username"], TEST_USER["password"])
    if not user_token:
        print("Failed to get user token. Exiting...")
        return
    
    # Step 4: Get current user info
    get_current_user(admin_token)
    get_current_user(user_token)
    
    # Step 5: Update user settings
    update_user_settings(user_token, {
        "display_name": "Test User",
        "color": "#FF5733"
    })
    
    # Step 6: Get application settings
    get_app_settings(admin_token)
    get_app_settings(user_token)
    
    # Step 7: Get system info
    get_system_info(admin_token)
    
    # Step 8: Admin gets all users
    get_all_users(admin_token)
    
    print_header("API Tests Completed")

if __name__ == "__main__":
    main()
