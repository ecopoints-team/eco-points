from app import create_app
from app.models import Organization
from app import db
import sys

app = create_app()
with app.app_context():
    org = db.session.get(Organization, 1)
    if not org:
        print("Organization 1 not found!")
        sys.exit(1)
        
    # The hex string we generated earlier
    hex_str = "67414141414142714d5078336f6458727261653768693554756837314c496536337854634d6a6a7a34796861514b70566c435770734a716d373455513455782d2d525941552d586a6d31646c57393443675742633455584b39527346677547496b6736636245304475732d77375966384b68784b447354394c317958474d3239475a754832566f5a55554d6773625239345a6854553562775056667a44376143425042475859354b4345562d2d614d436139744f426e493d"
    binary_data = bytes.fromhex(hex_str)
    
    org.qr_hmac_secret_enc = binary_data
    db.session.commit()
    print("Successfully updated Organization 1 qr_hmac_secret_enc in local database.")
