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
    brands = ['나이키', '아디다스', '자라', 'H&M', '구찌', '샤넬', '루이비통', '프라다', '발렌시아가', '버버리', '펜디', '톰브라운', '알렉산더맥퀸', '마르지엘라', '마르셀로불론', '발망', '페라가모', '페르소나']
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
    image = request.files.get('image', None)

    data = {
        'type': type,
        'detail': detail,
        'brand': brand,
        'color': color
    }

    if image:
        # 이미지 파일 저장
        image_filename = image.filename
        image.save(os.path.join('static', image_filename))
        data['image'] = image_filename
    else:
        data['image'] = 'default.jpg'  # 기본 이미지 파일명

    # MongoDB에 데이터 저장
    collection.insert_one(data)

    return jsonify({'message': '저장되었습니다.'}), 200

if __name__ == '__main__':
    app.run(debug=True)
