import os
from dotenv import load_dotenv

load_dotenv(r"d:\PUP EliasJP\eco-points-rpi\rvm_edge_client\.env")
secret = b'7de13662a3b06f358572795ddc9810d402b84bd5cf05741bb6807f81738447f7'

import hashlib
import hmac

digest = hmac.new(secret, b"USER-EPTU-001", hashlib.sha256).hexdigest()
print(f"EXPECTED SUFFIX: {digest[:6]}")
