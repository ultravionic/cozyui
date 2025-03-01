import os
import sys
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
    
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        if admin_user is None:
            # Create admin user
            admin_password = os.environ.get("ADMIN_PASSWORD", "admin")
            hashed_password = get_password_hash(admin_password)
            
            admin_user = User(
                username="admin",
                hashed_password=hashed_password,
                display_name="Admin",
                color="#e74c3c",
                is_active=True,
                is_admin=True
            )
            
            db.add(admin_user)
            db.commit()
            
            print("Admin user created successfully.")
        else:
            print("Admin user already exists.")
        
        # Create demo users if they don't exist
        demo_users = [
            {"username": "user1", "display_name": "User 1", "color": "#3498db"},
            {"username": "user2", "display_name": "User 2", "color": "#2ecc71"},
            {"username": "user3", "display_name": "User 3", "color": "#f39c12"}
        ]
        
        for demo_user in demo_users:
            user = db.query(User).filter(User.username == demo_user["username"]).first()
            
            if user is None:
                # Create demo user
                password = os.environ.get(f"{demo_user['username'].upper()}_PASSWORD", "password")
                hashed_password = get_password_hash(password)
                
                user = User(
                    username=demo_user["username"],
                    hashed_password=hashed_password,
                    display_name=demo_user["display_name"],
                    color=demo_user["color"],
                    is_active=True,
                    is_admin=False
                )
                
                db.add(user)
                db.commit()
                
                print(f"Demo user '{demo_user['username']}' created successfully.")
            else:
                print(f"Demo user '{demo_user['username']}' already exists.")
    
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
        sys.exit(1)
    
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
