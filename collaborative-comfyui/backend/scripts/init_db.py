import sys
import os
from pathlib import Path

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from database.db import engine, Base
from database.session import get_db
from models.user import User
from auth.security import get_password_hash

def init_db():
    """
    Initialize the database with an admin user.
    """
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Get database session
    db = next(get_db())
    
    # Check if admin user already exists
    admin_user = db.query(User).filter(User.username == "admin").first()
    if admin_user:
        print("Admin user already exists.")
        return
    
    # Create admin user
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin")
    hashed_password = get_password_hash(admin_password)
    
    admin_user = User(
        username="admin",
        hashed_password=hashed_password,
        display_name="Administrator",
        email="admin@example.com",
        role="admin",
        is_active=True,
        color="#FF5733"
    )
    
    db.add(admin_user)
    db.commit()
    
    print("Admin user created successfully.")

if __name__ == "__main__":
    init_db()
