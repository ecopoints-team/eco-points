1. Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate

2. Install dependencies
pip install -r requirements.txt

3. Set environment variables
set DATABASE_URL=postgresql+psycopg://postgres:admin@127.0.0.1:5433/ecopoints
set SECRET_KEY=change-me
set FLASK_APP=run.py

4. Run database migrations
flask db init
flask db migrate -m "initial"
flask db upgrade

5. Start the application
python run.py
