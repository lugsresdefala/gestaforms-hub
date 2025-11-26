"""Streamlit authentication component for LEXA - Development Version"""

import streamlit as st
from typing import Optional
from utils.auth import hash_password, verify_password

try:
    from database import SessionLocal
    from models.user import User
    DATABASE_AVAILABLE = True
except ImportError:
    DATABASE_AVAILABLE = False
    User = None


def register_user(email: str, password: str, plan: str = "free") -> Optional[object]:
    """Register a new user with email and password.
    
    Args:
        email: User's email address
        password: User's password (will be hashed)
        plan: Subscription plan (default: "free")
        
    Returns:
        User object if successful, None otherwise
    """
    if not DATABASE_AVAILABLE:
        return None
        
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_user = db.query(User).filter_by(email=email).first()
        if existing_user:
            return None
            
        # Create new user with hashed password
        password_hash = hash_password(password)
        new_user = User(email=email, password_hash=password_hash, plan=plan)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    finally:
        db.close()


def login_user(email: str, password: str) -> Optional[object]:
    """Authenticate a user with email and password.
    
    Args:
        email: User's email address
        password: User's password
        
    Returns:
        User object if authentication successful, None otherwise
    """
    if not DATABASE_AVAILABLE:
        return None
        
    db = SessionLocal()
    try:
        user = db.query(User).filter_by(email=email).first()
        if user and verify_password(password, user.password_hash):
            return user
        return None
    finally:
        db.close()


def render_auth() -> None:
    """Render a simplified authentication widget for development."""
    st.sidebar.markdown("### Modo Desenvolvimento")
    st.sidebar.info("Autenticação desativada para desenvolvimento")
    
    # Set default session state for development
    if 'user' not in st.session_state:
        st.session_state.user = {
            'email': 'dev@example.com',
            'plan': 'enterprise',
            'char_usage': 0,
            'char_limit': 1000000
        }
    
    # Display mock user info
    st.sidebar.success(f"Logado como: {st.session_state.user['email']}")
    st.sidebar.info(f"Plano: {st.session_state.user['plan'].title()}")
    
    # Display usage information
    char_limit = st.session_state.user['char_limit']
    char_usage = st.session_state.user['char_usage']
    usage_percent = (char_usage / char_limit) * 100 if char_limit > 0 else 0
    
    st.sidebar.info(f"Uso: {char_usage:,}/{char_limit:,} caracteres ({usage_percent:.1f}%)")
    st.sidebar.progress(min(usage_percent / 100, 1.0))
