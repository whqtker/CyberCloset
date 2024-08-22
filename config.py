import os

class Config:
    SECRET_KEY = os.urandom(24)
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/project')