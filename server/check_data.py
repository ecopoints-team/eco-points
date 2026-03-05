"""
Diagnostic script: Check why dashboard recycling trends show no data.
Traces the full pipeline: DB → serializer → API response → frontend expectations.
"""
import sqlite3
import os
import json
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'ecopoints.db')

def main():
    if not os.path.exists(DB_PATH):
        print(f"[FAIL] Database not found at: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    print("=" * 70)
    print("  ECOPOINTS DASHBOARD DATA DIAGNOSTIC")
    print("=" * 70)

    # 1. Table row counts
    print("\n[1] TABLE ROW COUNTS")
    print("-" * 40)
    tables = [
        'organizations', 'accounts', 'users', 'rvms',
        'recycling_sessions', 'recycling_items',
        'transactions', 'rewards', 'redemptions',
    ]
    for t in tables:
        try:
            cur.execute(f"SELECT COUNT(*) as cnt FROM {t}")
            row = cur.fetchone()
            print(f"  {t:25s} : {row['cnt']}")
        except Exception as e:
            print(f"  {t:25s} : ERROR - {e}")

    # 2. RecyclingItem date range
    print("\n[2] RECYCLING ITEM DATE RANGE")
    print("-" * 40)
    cur.execute("SELECT MIN(deposited_at) as earliest, MAX(deposited_at) as latest, COUNT(*) as total FROM recycling_items")
    row = cur.fetchone()
    print(f"  Earliest : {row['earliest']}")
    print(f"  Latest   : {row['latest']}")
    print(f"  Total    : {row['total']}")

    # 3. Sample items (newest 5)
    print("\n[3] NEWEST 5 RECYCLING ITEMS")
    print("-" * 40)
    cur.execute("""
        SELECT ri.id, ri.condition, ri.deposited_at, ri.session_id, ri.points_awarded
        FROM recycling_items ri
        ORDER BY ri.deposited_at DESC
        LIMIT 5
    """)
    for r in cur.fetchall():
        status = 'Accepted' if r['condition'] != 'Rejected' else 'Rejected'
        print(f"  id={r['id']}, condition={r['condition']}, status={status}, deposited_at={r['deposited_at']}, pts={r['points_awarded']}")

    # 4. Condition distribution (maps to status)
    print("\n[4] CONDITION DISTRIBUTION (condition → status)")
    print("-" * 40)
    cur.execute("SELECT condition, COUNT(*) as cnt FROM recycling_items GROUP BY condition ORDER BY cnt DESC")
    for r in cur.fetchall():
        status = 'Accepted' if r['condition'] != 'Rejected' else 'Rejected'
        print(f"  condition='{r['condition']}' → status='{status}' : {r['cnt']} items")

    # 5. Check what the frontend status filter expects
    print("\n[5] FRONTEND STATUS MATCHING CHECK")
    print("-" * 40)
    # Frontend uses: isAccepted = ['Accepted', 'Completed', 'Success'].includes(l.status)
    #                isRejected = ['Rejected', 'Failed', 'Error'].includes(l.status)
    # Backend: status = 'Accepted' if condition != 'Rejected' else 'Rejected'
    cur.execute("SELECT COUNT(*) as cnt FROM recycling_items WHERE condition != 'Rejected'")
    accepted = cur.fetchone()['cnt']
    cur.execute("SELECT COUNT(*) as cnt FROM recycling_items WHERE condition = 'Rejected'")
    rejected = cur.fetchone()['cnt']
    print(f"  Backend sends status='Accepted': {accepted}")
    print(f"  Backend sends status='Rejected': {rejected}")
    print(f"  Frontend isAccepted matches 'Accepted': YES")
    print(f"  Frontend isRejected matches 'Rejected': YES")

    # 6. Check deposited_at format (ISO parsing issue?)
    print("\n[6] DEPOSITED_AT FORMAT CHECK")
    print("-" * 40)
    cur.execute("SELECT deposited_at FROM recycling_items ORDER BY deposited_at DESC LIMIT 3")
    for r in cur.fetchall():
        raw = r['deposited_at']
        print(f"  Raw value: '{raw}'")
        # Check if JS new Date() would parse this
        try:
            dt = datetime.fromisoformat(str(raw).replace('Z', '+00:00') if raw else '')
            print(f"    → Parsed OK: {dt.isoformat()}")
        except Exception as e:
            print(f"    → PARSE FAIL: {e}")

    # 7. Weekly data check (current week Mon-Sun)
    print("\n[7] CURRENT WEEK DATA (Mon-Sun)")
    print("-" * 40)
    now = datetime.now()
    weekday = now.weekday()  # 0=Mon
    monday = now - timedelta(days=weekday)
    monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    sunday = monday + timedelta(days=6, hours=23, minutes=59, seconds=59)
    print(f"  Current week: {monday.strftime('%Y-%m-%d')} to {sunday.strftime('%Y-%m-%d')}")

    cur.execute("""
        SELECT DATE(deposited_at) as day, COUNT(*) as cnt
        FROM recycling_items
        WHERE deposited_at >= ? AND deposited_at <= ?
        GROUP BY DATE(deposited_at)
        ORDER BY day
    """, (monday.isoformat(), sunday.isoformat()))
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"  {r['day']}: {r['cnt']} items")
    else:
        print("  *** NO DATA THIS WEEK ***")

    # 8. Monthly data check (current year)
    print("\n[8] MONTHLY DATA (current year)")
    print("-" * 40)
    year = now.year
    cur.execute("""
        SELECT strftime('%Y-%m', deposited_at) as month, COUNT(*) as cnt
        FROM recycling_items
        WHERE strftime('%Y', deposited_at) = ?
        GROUP BY month
        ORDER BY month
    """, (str(year),))
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"  {r['month']}: {r['cnt']} items")
    else:
        print(f"  *** NO DATA FOR {year} ***")

    # 9. Yearly data
    print("\n[9] YEARLY DATA")
    print("-" * 40)
    cur.execute("""
        SELECT strftime('%Y', deposited_at) as year, COUNT(*) as cnt
        FROM recycling_items
        GROUP BY year
        ORDER BY year
    """)
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"  {r['year']}: {r['cnt']} items")
    else:
        print("  *** NO YEARLY DATA ***")

    # 10. Session → Item join check
    print("\n[10] SESSION JOIN CHECK")
    print("-" * 40)
    cur.execute("""
        SELECT COUNT(*) as cnt FROM recycling_items ri
        JOIN recycling_sessions rs ON ri.session_id = rs.id
    """)
    joined = cur.fetchone()['cnt']
    cur.execute("SELECT COUNT(*) as cnt FROM recycling_items")
    total = cur.fetchone()['cnt']
    print(f"  Items with valid session join: {joined}/{total}")
    if joined < total:
        print(f"  *** {total - joined} ORPHANED ITEMS (no matching session) ***")

    # 11. Session → Account → User chain
    print("\n[11] FULL JOIN CHAIN (item→session→account→user)")
    print("-" * 40)
    cur.execute("""
        SELECT COUNT(*) as cnt FROM recycling_items ri
        JOIN recycling_sessions rs ON ri.session_id = rs.id
        JOIN accounts a ON rs.account_id = a.id
        JOIN users u ON u.account_id = a.id
    """)
    full = cur.fetchone()['cnt']
    print(f"  Items with full join chain: {full}/{total}")

    # 12. Session → RVM → Organization chain
    print("\n[12] RVM/ORG JOIN CHAIN (session→rvm→org)")
    print("-" * 40)
    cur.execute("""
        SELECT COUNT(*) as cnt FROM recycling_items ri
        JOIN recycling_sessions rs ON ri.session_id = rs.id
        JOIN rvms ON rs.rvm_id = rvms.id
        JOIN organizations o ON rvms.organization_id = o.id
    """)
    org_joined = cur.fetchone()['cnt']
    print(f"  Items with RVM+Org join: {org_joined}/{total}")

    # 13. Check if location filtering might be the issue
    print("\n[13] ITEMS PER ORGANIZATION (location filter check)")
    print("-" * 40)
    cur.execute("""
        SELECT o.name, o.id, COUNT(ri.id) as cnt
        FROM recycling_items ri
        JOIN recycling_sessions rs ON ri.session_id = rs.id
        JOIN rvms ON rs.rvm_id = rvms.id
        JOIN organizations o ON rvms.organization_id = o.id
        GROUP BY o.id
        ORDER BY cnt DESC
    """)
    rows = cur.fetchall()
    if rows:
        for r in rows:
            print(f"  org_id={r['id']}, name='{r['name']}': {r['cnt']} items")
    else:
        print("  *** NO ORG DATA ***")

    # 14. Simulate the API serialization for 1 item
    print("\n[14] SIMULATED API RESPONSE (1 item)")
    print("-" * 40)
    cur.execute("""
        SELECT ri.id, ri.condition, ri.deposited_at, ri.points_awarded, ri.session_id
        FROM recycling_items ri
        ORDER BY ri.deposited_at DESC
        LIMIT 1
    """)
    item = cur.fetchone()
    if item:
        status = 'Accepted' if item['condition'] != 'Rejected' else 'Rejected'
        ts = item['deposited_at']
        simulated = {
            'id': item['id'],
            'status': status,
            'timestamp': ts,
            'depositedAt': ts,
            'condition': item['condition'],
            'pointsAwarded': item['points_awarded'],
        }
        print(f"  {json.dumps(simulated, indent=4)}")
        print(f"\n  JS new Date('{ts}') would parse to a valid date: ", end='')
        try:
            dt = datetime.fromisoformat(str(ts).replace('Z', '+00:00'))
            print(f"YES ({dt})")
        except:
            print("NO (parse error!)")

    # 15. Check if the API endpoint has timestamp format with timezone
    print("\n[15] TIMEZONE FORMAT CHECK")
    print("-" * 40)
    cur.execute("SELECT deposited_at FROM recycling_items LIMIT 3")
    for r in cur.fetchall():
        raw = str(r['deposited_at'])
        has_tz = '+' in raw or 'Z' in raw or raw.endswith('+00:00')
        print(f"  '{raw}' → has_timezone_info: {has_tz}")
        if not has_tz:
            print(f"    ⚠ No timezone — Python isoformat() without tz. JS Date may still parse OK.")

    print("\n" + "=" * 70)
    print("  DIAGNOSTIC COMPLETE")
    print("=" * 70)

    conn.close()

if __name__ == '__main__':
    main()
