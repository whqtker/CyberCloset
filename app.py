from flask import Flask, request, jsonify, render_template, redirect, url_for, session
from pymongo import MongoClient
import os
from bson.objectid import ObjectId
import json
import uuid
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import re
from flask_wtf.csrf import CSRFProtect
from MongoDBConn import client, db, my, outfit, users

app = Flask(__name__)
app.secret_key = os.urandom(24)  # 세션을 위한 비밀 키 설정
csrf = CSRFProtect(app)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

# 사용자 이름이 알파벳과 숫자로만 구성되었는지 확인
def is_valid_username(username):
    return re.match("^[a-zA-Z0-9_]+$", username) is not None

# 이메일 형식이 올바른지 확인
def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email) is not None

@app.route('/')
def index():
    return render_template('main.html')

@app.route('/brands')
def get_brands():
    # MongoDB에서 distinct한 브랜드 목록 가져오기
    brands = list(my.distinct('brand'))
    return jsonify(brands)

@app.route('/insert_my')
@login_required
def insert_my():
    return render_template('insert_my.html')

@app.route('/show_my')
@login_required
def show_my():
    # MongoDB에서 데이터 조회
    data = list(my.find({'username': session['username']}))
    # 조회한 데이터를 템플릿에 전달
    return render_template('show_my.html', data=data)

@app.route('/show_outfit')
@login_required
def show_outfit():
    # MongoDB에서 모든 데이터 조회
    data = list(outfit.find({'username': session['username']}))
    # 모든 데이터를 템플릿에 전달
    return render_template('show_outfit.html', outfits=data)

@app.route('/insert_outfit')
@login_required
def insert_outfit():
    return render_template('insert_outfit.html')

@app.route('/delete_my/<string:item_id>', methods=['DELETE'])
def delete_my_item(item_id):
    try:
        my.delete_one({'_id': ObjectId(item_id)})
        return jsonify({'message': '항목이 삭제되었습니다.'}), 200
    except Exception as e:
        return jsonify({'error': '삭제 중 오류가 발생했습니다.'}), 500

@app.route('/delete_outfit/<string:outfit_id>', methods=['DELETE'])
def delete_outfit(outfit_id):
    try:
        outfit.delete_one({'_id': ObjectId(outfit_id)})
        return jsonify({'message': 'Outfit이 삭제되었습니다.'}), 200
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
@login_required
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
        'color': color,
        'username': session['username']  # 사용자 정보 추가
    }

    if image:
        # 이미지 파일 저장
        image_filename = f"{uuid.uuid4()}_{image.filename}"
        image.save(os.path.join('static/img', image_filename))
        data['image'] = image_filename
    else:
        data['image'] = 'default.jpg'  # 기본 이미지 파일명

    # MongoDB에 데이터 저장
    my.insert_one(data)

    return jsonify({'message': '저장되었습니다.'}), 200

@app.route('/save_data_outfit', methods=['POST'])
@login_required
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
        image.save(os.path.join('static/img', image_filename))

        # Add 'owned' field to each item
        for item in outfit_data:
            item['owned'] = item.get('owned', False)

        data = {
            'outfit': outfit_data,
            'image': image_filename,
            'liked': False,  # 'liked'의 기본값을 False로 설정
            'username': session['username']  # 사용자 정보 추가
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

@app.route('/edit_my/<string:item_id>')
def edit_my_item(item_id):
    item = my.find_one({'_id': ObjectId(item_id)})
    return render_template('edit_my.html', item=item)

@app.route('/update_my/<string:item_id>', methods=['POST'])
def update_my_item(item_id):
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

    # MongoDB에 데이터 업데이트
    my.update_one({'_id': ObjectId(item_id)}, {'$set': data})

    return redirect(url_for('show_my'))

@app.route('/edit_outfit/<string:outfit_id>')
def edit_outfit(outfit_id):
    outfit_entry = outfit.find_one({'_id': ObjectId(outfit_id)})
    return render_template('edit_outfit.html', outfit=outfit_entry)

@app.route('/update_outfit/<string:outfit_id>', methods=['POST'])
def update_outfit(outfit_id):
    try:
        # Parse the outfit data from the form
        outfit_data = []
        outfit_count = int(request.form.get('outfit_count', 0))
        for i in range(outfit_count):
            outfit_item = {
                'type': request.form.get(f'outfit[{i}][type]'),
                'detail': request.form.get(f'outfit[{i}][detail]'),
                'brand': request.form.get(f'outfit[{i}][brand]'),
                'color': request.form.get(f'outfit[{i}][color]'),
                'memo': request.form.get(f'outfit[{i}][memo]', '')  # Add memo field
            }
            # 필터링: 모든 필드가 비어있지 않은 경우에만 추가
            if any(outfit_item.values()):
                outfit_data.append(outfit_item)

        image = request.files.get('image', None)

        data = {
            'outfit': outfit_data
        }

        if image:
            # Save the image file
            image_filename = f"{uuid.uuid4()}_{image.filename}"
            image.save(os.path.join('static', image_filename))
            data['image'] = image_filename

        # Update the MongoDB document
        outfit.update_one({'_id': ObjectId(outfit_id)}, {'$set': data})

        return redirect(url_for('show_outfit'))
    except Exception as e:
        return jsonify({"message": f"오류 발생: {str(e)}"}), 500

@app.route('/update_owned/<string:outfit_id>/<int:index>', methods=['POST'])
def update_owned(outfit_id, index):
    try:
        owned = request.json.get('owned')
        outfit.update_one(
            {'_id': ObjectId(outfit_id)},
            {'$set': {f'outfit.{index}.owned': owned}}
        )
        return '', 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        # 입력값 검증
        if not is_valid_username(username):
            return render_template('register.html', error='Invalid username. Only letters, numbers, and underscores are allowed.')
        
        if not is_valid_email(email):
            return render_template('register.html', error='Invalid email address.')
        
        if len(password) < 8:
            return render_template('register.html', error='Password must be at least 8 characters long.')
        
        # 비밀번호 해싱
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        
        # 사용자 정보 저장
        users.insert_one({
            'username': username,
            'email': email,
            'password': hashed_password
        })
        
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        # 입력값 검증
        if not is_valid_username(username):
            return render_template('login.html', error='Invalid username or password.')
        
        # 사용자 정보 조회
        user = users.find_one({'username': username})
        
        if user and check_password_hash(user['password'], password):
            session['username'] = username
            return redirect(url_for('index'))
        else:
            return render_template('login.html', error='Invalid username or password.')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)