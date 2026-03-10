import sqlite3

conn = sqlite3.connect('ecopoints.db')
c = conn.cursor()

# Check admin users
c.execute("""
    SELECT username, email, role, 
           CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN 'HAS_PW' ELSE 'NO_PW' END,
           substr(password_hash, 1, 30) as pw_start
    FROM users 
    WHERE role IN ('superadmin','head_admin','auditor','inventory_officer','technician')
""")
rows = c.fetchall()
print(f"Total admin users: {len(rows)}")
for r in rows:
    print(f"  {str(r[0]):15s} | {str(r[1]):35s} | {str(r[2]):20s} | {r[3]} | {r[4]}")

# Verify password with werkzeug
try:
    from werkzeug.security import check_password_hash
    c.execute("SELECT username, password_hash FROM users WHERE username='sysadmin'")
    row = c.fetchone()
    if row:
        print(f"\nPassword check for sysadmin:")
        print(f"  Hash exists: {bool(row[1])}")
        if row[1]:
            print(f"  Hash starts with: {row[1][:50]}")
            result = check_password_hash(row[1], 'test123')
            print(f"  check_password('test123'): {result}")
    else:
        print("\nNo user with username='sysadmin' found!")
        c.execute("SELECT COUNT(*) FROM users")
        total = c.fetchone()[0]
        print(f"Total users in database: {total}")
except ImportError:
    print("\nwerkzeug not available, skipping password check")

conn.close()
