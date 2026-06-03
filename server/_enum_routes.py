import re, os
controllers_dir = 'app/controllers'
files = ['auth_controller.py','dashboard_controller.py','users_controller.py','locations_controller.py','machines_controller.py','rewards_controller.py','logs_controller.py','leaderboard_controller.py','groups_controller.py','analytics_controller.py','settings_controller.py','sessions_controller.py']
pattern = re.compile(r"@(\w+)_bp\.route\(['\"](.*?)['\"]\s*,\s*methods=\[([^\]]+)\]")
total=0
for fn in files:
    path = os.path.join(controllers_dir, fn)
    with open(path, encoding='utf-8') as f:
        src = f.read()
    matches = pattern.findall(src)
    for bp, route, methods in matches:
        ms = [m.strip().strip("'\"") for m in methods.split(',')]
        for m in ms:
            if m in ('POST','PUT','PATCH'):
                total += 1
                print(f"{fn}: {m} {route}")
print('TOTAL:', total)
