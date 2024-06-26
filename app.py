from flask import Flask, request, jsonify, render_template, redirect, url_for
from pymongo import MongoClient
import os
from bson.objectid import ObjectId

app = Flask(__name__)

# MongoDB 클라이언트 연결
client = MongoClient('mongodb://localhost:27017')
db = client['project']
my = db['my']
outfit = db['outfit']

@app.route('/')
def index():
    return render_template('main.html')

@app.route('/brands')
def get_brands():
    # MongoDB에서 distinct한 브랜드 목록 가져오기
    brands = list(my.distinct('brand'))
    return jsonify(brands)

@app.route('/insert_my')
def insert_my():
    return render_template('insert_my.html')

@app.route('/show_my')
def show_my():
    # MongoDB에서 데이터 조회
    data = list(my.find())

    # 조회한 데이터를 템플릿에 전달
    return render_template('show_my.html', data=data)

@app.route('/insert_outfit')
def insert_outfit():
    return render_template('insert_outfit.html')

@app.route('/show_outfit')
def show_outfit():
    # MongoDB에서 데이터 조회
    data = list(outfit.find())

    # 조회한 데이터를 템플릿에 전달
    return render_template('show_outfit.html', data=data)

@app.route('/delete/<string:item_id>', methods=['DELETE'])
def delete_item(item_id):
    try:
        my.delete_one({'_id': ObjectId(item_id)})
        return jsonify({'message': '항목이 삭제되었습니다.'}), 200
    except Exception as e:
        return jsonify({'error': '삭제 중 오류가 발생했습니다.'}), 500

@app.route('/save_data_my', methods=['POST'])
def save_data_my():
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
    my.insert_one(data)

    return jsonify({'message': '저장되었습니다.'}), 200

@app.route('/save_data_outfit', methods=['POST'])
def save_data_outfit():
    outfit_data = []
    for i in range(int(request.form['outfit_count'])):
        type = request.form[f'type-{i}']
        detail = request.form[f'detail-{i}']
        brand = request.form[f'brand-{i}']
        color = request.form[f'color-{i}']
        image = request.files.get(f'image-{i}', None)

        outfit_item = {
            'type': type,
            'detail': detail,
            'brand': brand,
            'color': color
        }

        if image:
            # 이미지 파일 저장
            image_filename = image.filename
            image.save(os.path.join('static', image_filename))
            outfit_item['image'] = image_filename
        else:
            outfit_item['image'] = 'default.jpg'  # 기본 이미지 파일명

        outfit_data.append(outfit_item)

    # MongoDB에 데이터 저장
    outfit.insert_one({'outfit': outfit_data})

    return jsonify({'message': '저장되었습니다.'}), 200


if __name__ == '__main__':
    app.run(debug=True)
