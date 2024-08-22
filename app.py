from flask import Flask, render_template
from config import Config
from flask_wtf.csrf import CSRFProtect
from routes.my_routes import my_routes
from routes.outfit_routes import outfit_routes
from routes.auth_routes import auth_routes
from flask_wtf import FlaskForm

app = Flask(__name__)
app.config.from_object(Config)
csrf = CSRFProtect(app)

csrf.init_app(app)

app.register_blueprint(my_routes)
app.register_blueprint(outfit_routes)
app.register_blueprint(auth_routes)

class EmptyForm(FlaskForm):
    pass

@app.route('/')
def index():
    form = EmptyForm()
    return render_template('main.html', form=form)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)