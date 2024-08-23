from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
from bson.objectid import ObjectId
from MongoDBConn import outfit
from utils.helpers import login_required
import os
import uuid
import json
from flask_wtf import FlaskForm

outfit_routes = Blueprint('outfit_routes', __name__)

class EmptyForm(FlaskForm):
    pass

@outfit_routes.route('/show_outfit')
@login_required
def show_outfit():
    # MongoDB에서 모든 데이터 조회
    data = list(outfit.find({'username': session['username']}))
    # 모든 데이터를 템플릿에 전달
    return render_template('show_outfit.html', outfits=data)

@outfit_routes.route('/insert_outfit')
@login_required
def insert_outfit():
    form = EmptyForm()
    return render_template('insert_outfit.html', form=form)

@outfit_routes.route('/delete_outfit/<string:outfit_id>', methods=['DELETE'])
def delete_outfit(outfit_id):
    try:
        outfit.delete_one({'_id': ObjectId(outfit_id)})
        return jsonify({'message': 'Outfit이 삭제되었습니다.'}), 200
    except Exception as e:
        return jsonify({'error': '삭제 중 오류가 발생했습니다.'}), 500

@outfit_routes.route('/delete_outfit/<outfit_id>/<int:index>', methods=['DELETE'])
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
        return jsonify({'message': 'Item deleted successfully'}), 200  # 응답 메시지 추가
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

@outfit_routes.route('/save_data_outfit', methods=['POST'])
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

@outfit_routes.route('/like_outfit', methods=['POST'])
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

@outfit_routes.route('/edit_outfit/<string:outfit_id>')
@login_required
def edit_outfit(outfit_id):
    outfit_entry = outfit.find_one({'_id': ObjectId(outfit_id)})
    form = EmptyForm()
    return render_template('edit_outfit.html', outfit=outfit_entry, form=form)

@outfit_routes.route('/update_outfit/<string:outfit_id>', methods=['POST'])
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

        return redirect(url_for('outfit_routes.show_outfit'))
    except Exception as e:
        return jsonify({"message": f"오류 발생: {str(e)}"}), 500

@outfit_routes.route('/update_owned/<string:outfit_id>/<int:index>', methods=['POST'])
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
