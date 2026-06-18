import requests
import json

from dotenv import load_dotenv
load_dotenv(r"d:\PUP EliasJP\eco-points-rpi\rvm_edge_client\.env")
import os

API_KEY = os.environ.get("API_KEY")
MACHINE_ID = os.environ.get("MACHINE_ID")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000")

print(f"Testing with API_KEY: {API_KEY}")
print(f"Testing with MACHINE_ID: {MACHINE_ID}")

# Send a fake QR code to see what the server responds
payload = {
    "user_qr": "HEAD-EPTU-001.123456",
    "machine_uuid": MACHINE_ID
}

headers = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

resp = requests.post(f"{BACKEND_URL}/api/rpi/session/start", json=payload, headers=headers)
print(f"Status Code: {resp.status_code}")
print(f"Response: {resp.text}")
