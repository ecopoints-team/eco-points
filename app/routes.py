from flask import current_app as app, render_template, request, redirect, url_for
from .models import User
from . import db


@app.route('/')
def index():
    users = User.query.order_by(User.id.asc()).all()
    return render_template('index.html', users=users)


@app.route('/add', methods=['GET', 'POST'])
def add_user():
    name = request.values.get('name')
    if not name:
        name = f'User{User.query.count() + 1}'
    user = User(name=name)
    db.session.add(user)
    db.session.commit()
    return redirect(url_for('index'))
