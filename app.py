from flask import Flask, request, jsonify, render_template, redirect, url_for
from pymongo import MongoClient
import os
from bson.objectid import ObjectId
import json
import uuid

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

@app.route('/show_outfit')
def show_outfit():
    # MongoDB에서 모든 데이터 조회
    data = list(outfit.find())
    
    # 모든 데이터를 템플릿에 전달
    return render_template('show_outfit.html', outfits=data) 

@app.route('/insert_outfit')
def insert_outfit():
    return render_template('insert_outfit.html')

@app.route('/delete_my/<string:item_id>', methods=['DELETE'])
def delete_my_item(item_id):
    try:
        my.delete_one({'_id': ObjectId(item_id)})
        return jsonify({'message': '항목이 삭제되었습니다.'}), 200
    except Exception as e:
        return jsonify({'error': '삭제 중 오류가 발생했습니다.'}), 500
    
@app.route('/delete_outfit/<outfit_id>/<int:index>', methods=['DELETE'])
def delete_item(outfit_id, index):
    try:
        # outfit_id를 사용하여 해당 문서를 찾고, 특정 인덱스의 아이템을 삭제
        outfit.update_one(
            {'_id': ObjectId(outfit_id)},
            {'$unset': {f'outfit.{index}': 1}}
        )
        outfit.update_one(
            {'_id': ObjectId(outfit_id)},
            {'$pull': {'outfit': None}}
        )
        return '', 204
    except Exception as e:
        print(e)
        return '', 500

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
        image_filename = f"{uuid.uuid4()}_{image.filename}"
        image.save(os.path.join('static', image_filename))
        data['image'] = image_filename
    else:
        data['image'] = 'default.jpg'  # 기본 이미지 파일명

    # MongoDB에 데이터 저장
    my.insert_one(data)

    return jsonify({'message': '저장되었습니다.'}), 200

@app.route('/save_data_outfit', methods=['POST'])
def save_data_outfit():
    try:
        outfit_data = json.loads(request.form.get('outfit', '[]'))
        image = request.files.get('image')

        if not outfit_data:
            return jsonify({"message": "최소한 하나의 옷 정보를 입력해주세요."}), 400

        if not image:
            return jsonify({"message": "이미지를 업로드해 주세요."}), 400

        # 이미지 파일 저장
        image_filename = f"{uuid.uuid4()}_{image.filename}"
        image.save(os.path.join('static', image_filename))

        data = {
            'outfit': outfit_data,
            'image': image_filename,
            'liked': False  # 'liked'의 기본값을 False로 설정
        }
        
        # MongoDB에 데이터 저장
        outfit.insert_one(data)

        return jsonify({'message': '저장되었습니다.'}), 200
    except Exception as e:
        return jsonify({"message": f"오류 발생: {str(e)}"}), 500

@app.route('/like_outfit', methods=['POST'])
def like_outfit():
    outfit_id = request.json.get('outfitId')
    like = request.json.get('like')  # 좋아요 여부를 나타내는 값
    if not outfit_id:
        return jsonify({'error': 'Invalid outfit ID'}), 400
    try:
        # 좋아요 여부를 업데이트
        outfit.update_one({'_id': ObjectId(outfit_id)}, {'$set': {'liked': like}})
        updated_outfit = outfit.find_one({'_id': ObjectId(outfit_id)})
        return jsonify({'liked': updated_outfit.get('liked', False)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True)
