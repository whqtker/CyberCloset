from flask import Blueprint, request, jsonify, render_template, session, redirect, url_for
from bson.objectid import ObjectId
from MongoDBConn import my
from utils.helpers import login_required
import os
import uuid
from flask_wtf import FlaskForm

my_routes = Blueprint('my_routes', __name__)

class EmptyForm(FlaskForm):
    pass

@my_routes.route('/insert_my')
@login_required
def insert_my():
    form = EmptyForm()
    return render_template('insert_my.html', form=form)

@my_routes.route('/show_my')
@login_required
def show_my():
    data = list(my.find({'username': session['username']}))
    return render_template('show_my.html', data=data)

@my_routes.route('/save_data_my', methods=['POST'])
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
        'username': session['username']
    }

    if image:
        image_filename = f"{uuid.uuid4()}_{image.filename}"
        image.save(os.path.join('static/img', image_filename))
        data['image'] = image_filename
    else:
        data['image'] = 'default.jpg'

    my.insert_one(data)
    return jsonify({'message': '저장되었습니다.'}), 200

@my_routes.route('/delete_my/<string:item_id>', methods=['DELETE'])
def delete_my_item(item_id):
    try:
        my.delete_one({'_id': ObjectId(item_id)})
        return jsonify({'message': '항목이 삭제되었습니다.'}), 200
    except Exception as e:
        return jsonify({'error': '삭제 중 오류가 발생했습니다.'}), 500


@my_routes.route('/edit_my/<string:item_id>')
def edit_my_item(item_id):
    item = my.find_one({'_id': ObjectId(item_id)})
    return render_template('edit_my.html', item=item)

@my_routes.route('/update_my/<string:item_id>', methods=['POST'])
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

@my_routes.route('/brands')
def get_brands():
    # MongoDB에서 distinct한 브랜드 목록 가져오기
    brands = list(my.distinct('brand'))
    return jsonify(brands)