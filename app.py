from flask import Flask, request, jsonify, render_template, redirect, url_for
from pymongo import MongoClient
import os

app = Flask(__name__)

# MongoDB 클라이언트 연결
client = MongoClient('mongodb://localhost:27017')
db = client['project']
collection = db['my']

@app.route('/')
def index():
    return render_template('main.html')

@app.route('/brands')
def get_brands():
    brands = ['Nike', 'Adidas', 'Zara', 'H&M', 'Gucci', 'Chanel']
    return jsonify(brands)

@app.route('/insert')
def insert():
    return render_template('insert.html')

@app.route('/save_data', methods=['POST'])
def save_data():
    type = request.form['type']
    detail = request.form['detail']
    brand = request.form['brand']
    color = request.form['color']
    image = request.files['image']

    # 이미지 파일 저장
    image_filename = image.filename
    image.save(os.path.join('static', image_filename))

    data = {
        'type': type,
        'detail': detail,
        'brand': brand,
        'color': color,
        'image': image_filename
    }

    # MongoDB에 데이터 저장
    collection.insert_one(data)

    return jsonify({'message': '저장되었습니다.'}), 200

if __name__ == '__main__':
    app.run(debug=True)
