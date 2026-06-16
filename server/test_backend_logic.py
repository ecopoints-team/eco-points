from app import create_app, db
from app.models import User, Organization
from app.middleware import compute_qr_suffix

app = create_app()
with app.app_context():
    org = db.session.get(Organization, 1)
    secret = org.get_qr_hmac_secret()
    
    user = User.query.filter_by(display_id="USER-EPTU-001").first()
    
    suffix = compute_qr_suffix(secret, user.display_id)
    print(f"Backend DB Secret: {secret}")
    print(f"Backend User Display ID: {user.display_id}")
    print(f"Backend Computed Suffix: {suffix}")
