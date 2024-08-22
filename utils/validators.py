import re

def is_valid_username(username):
    return re.match("^[a-zA-Z0-9_]+$", username) is not None

def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email) is not None