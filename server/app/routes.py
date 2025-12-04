from flask import current_app as app, render_template, request, redirect, url_for
from .models import User
from . import db


@app.route('/')
def index():
    return {'message': 'Flask API is running'}


@app.route('/api/users')
def get_users():
    users = User.query.order_by(User.id.asc()).all()
    return {'users': [{'id': u.id, 'name': u.name, 'created_at': u.created_at} for u in users]}


@app.route('/add', methods=['GET', 'POST'])
def add_user():
    name = request.values.get('name')
    if not name:
        name = f'User{User.query.count() + 1}'
    user = User(name=name)
    db.session.add(user)
    db.session.commit()
    return redirect(url_for('index'))
