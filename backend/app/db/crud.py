import json
import uuid
import base64
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Tuple, Dict, Any

from cassandra.cluster import Session
from cassandra.query import SimpleStatement

from app.core.password import get_password_hash  # For hashing password during user creation

# --- User CRUD ---
