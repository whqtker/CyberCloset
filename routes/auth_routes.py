from flask import Blueprint, request, render_template, redirect, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash
from MongoDBConn import users
from utils.validators import is_valid_username, is_valid_email
from flask_wtf.csrf import CSRFProtect
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, Length

class RegisterForm(FlaskForm):
    username = StringField('사용자 이름', validators=[DataRequired()])
    email = StringField('이메일', validators=[DataRequired(), Email()])
    password = PasswordField('비밀번호', validators=[DataRequired(), Length(min=8)])
    submit = SubmitField('회원가입')

class LoginForm(FlaskForm):
    username = StringField('사용자 이름', validators=[DataRequired()])
    password = PasswordField('비밀번호', validators=[DataRequired()])
    submit = SubmitField('로그인')

class EmptyForm(FlaskForm):
    pass

csrf = CSRFProtect()

auth_routes = Blueprint('auth_routes', __name__)

@auth_routes.route('/register', methods=['GET', 'POST'])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        username = form.username.data
        email = form.email.data
        password = form.password.data
        
        if not is_valid_username(username):
            form.username.errors.append('Invalid username. Only letters, numbers, and underscores are allowed.')
        
        if not is_valid_email(email):
            form.email.errors.append('Invalid email address.')
        
        if len(password) < 8:
            form.password.errors.append('Password must be at least 8 characters long.')
        
        if form.errors:
            return render_template('register.html', form=form)
        
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        
        users.insert_one({
            'username': username,
            'email': email,
            'password': hashed_password
        })
        
        return redirect(url_for('auth_routes.login'))
    return render_template('register.html', form=form)

@auth_routes.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        username = form.username.data
        password = form.password.data
        
        if not is_valid_username(username):
            return render_template('login.html', form=form, error='Invalid username or password.')
        
        user = users.find_one({'username': username})
        
        if user and check_password_hash(user['password'], password):
            session['username'] = username
            return redirect(url_for('index'))
        else:
            return render_template('login.html', form=form, error='Invalid username or password.')
    return render_template('login.html', form=form)

@auth_routes.route('/logout', methods=['POST'])
def logout():
    form = EmptyForm()
    if form.validate_on_submit():
        session.pop('username', None)
        return redirect(url_for('index'))
    return redirect(url_for('index'))