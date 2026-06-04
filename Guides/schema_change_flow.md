# Schema Change Flow

Run from: `C:\Users\pc\Documents\Github\server`

---

## Step 1 — Activate venv (if not already)

```powershell
.\.venv\Scripts\activate
```

---

## Step 2 — Generate the migration

```powershell
flask db migrate -m "describe_what_changed"
```

**Good examples:**
```
flask db migrate -m "add_user_educational_level"
flask db migrate -m "add_reward_categories_table"
flask db migrate -m "add_machine_serial_column"
```

**Check the output for:**
- `Detected added table '...'` ✅
- `Detected added column '...'` ✅
- `Detected removed table/column '...'` ⚠️ Data loss — review carefully
- `No changes in schema detected` ❌ Model not imported — fix before continuing

---

## Step 3 — Review the generated file

```powershell
# Open the newest file in migrations/versions/
Get-ChildItem .\migrations\versions\ | Sort-Object LastWriteTime | Select-Object -Last 1
```

Open it and verify:
- `upgrade()` contains the expected `CREATE TABLE` / `ADD COLUMN` / etc.
- `downgrade()` contains the reverse `DROP TABLE` / `DROP COLUMN` / etc.

---

## Step 4 — Apply the migration

```powershell
flask db upgrade
```

**Success looks like:**
```
Running upgrade <old_rev> -> <new_rev>, describe_what_changed
```
No traceback after = done.

---

## Step 5 — Verify

```powershell
flask db current
```

Should print the new revision hash with `(head)` at the end.

---

## If something goes wrong

```powershell
# Undo the last migration
flask db downgrade -1

# Then fix the model/migration file and re-run Steps 2–4
```

---

## Full flow (copy-paste)

```powershell
.\.venv\Scripts\activate
flask db migrate -m "your_description_here"
# → review the generated file in migrations/versions/
flask db upgrade
flask db current
```

---

## Quick reference

| Command | What it does |
|---------|-------------|
| `flask db migrate -m "msg"` | Detect model changes → generate migration file |
| `flask db upgrade` | Apply pending migrations to DB |
| `flask db downgrade -1` | Roll back the last applied migration |
| `flask db current` | Show which revision the DB is on |
| `flask db history` | Show full migration chain |
| `flask db show` | Show details of current revision |
