from sqlalchemy import create_engine, inspect

engine = create_engine('postgresql+psycopg://postgres:admin@127.0.0.1:5433/ecopoints')
inspector = inspect(engine)

print("Users columns:")
for col in inspector.get_columns('users'):
    print(col['name'], col['type'])

print("Community groups columns:")
for col in inspector.get_columns('community_groups'):
    print(col['name'], col['type'])
