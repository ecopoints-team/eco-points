"""Quick query to check prod DB user state."""
from dotenv import load_dotenv
load_dotenv()
from app import create_app
from app.models import User
from werkzeug.security import check_password_hash

app = create_app()
with app.app_context():
    count = User.query.count()
    print(f'Total users in DB: {count}')
    if count == 0:
        print('  DATABASE IS EMPTY — no users seeded!')
    else:
        users = User.query.limit(5).all()
        for u in users:
            hp = u.password_hash
            prefix = hp[:30] if hp else 'NONE'
            # Test password
            pw_ok = check_password_hash(hp, 'test123') if hp else False
            print(f'  id={u.id} email={u.email} role={u.role} '
                  f'hash={prefix}... pw_test123={pw_ok}')
