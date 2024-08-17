import { typeOptions } from './typeOptions.js';

function populateTypeOptions() {
    // 'type-'로 시작하거나 ID가 'type'인 모든 select 요소를 선택
    const typeSelects = document.querySelectorAll('[id^="type-"]');
    
    typeSelects.forEach(typeSelect => {
        Object.keys(typeOptions).forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
    });
}

function addOutfitItem() {
    // Move the outfitItemCount declaration outside the function to persist its value across function calls
    if (typeof window.outfitItemCount === 'undefined') {
        window.outfitItemCount = 1;
    } else {
        window.outfitItemCount++;
    }

    const outfitContainer = document.getElementById('outfit-container');
    const outfitItem = document.createElement('div');
    outfitItem.classList.add('outfit-item');
    outfitItem.innerHTML = `
        <label for="type-${window.outfitItemCount}">옷 종류:</label>
        <select id="type-${window.outfitItemCount}" name="type-${window.outfitItemCount}" onchange="updateTypeOptions('${window.outfitItemCount}')" required>
            <option value="">선택하세요</option>
        </select>
        <label for="detail-${window.outfitItemCount}">세부 종류:</label>
        <select id="detail-${window.outfitItemCount}" name="detail-${window.outfitItemCount}" required>
            <option value="">선택하세요</option>
        </select>
        <label for="brand-${window.outfitItemCount}">브랜드:</label>
        <input type="text" id="brand-${window.outfitItemCount}" name="brand-${window.outfitItemCount}" list="brand-list" placeholder="브랜드 검색" required>
        <label for="color-${window.outfitItemCount}">색깔:</label>
        <input type="text" id="color-${window.outfitItemCount}" name="color-${window.outfitItemCount}" required>
        <label for="note-${window.outfitItemCount}">메모:</label>
        <textarea id="note-${window.outfitItemCount}" name="note-${window.outfitItemCount}" rows="1"></textarea>
    `;
    outfitContainer.appendChild(outfitItem);
    
    // 새로 추가된 select 요소에 옵션 추가
    const newTypeSelect = document.getElementById(`type-${window.outfitItemCount}`);
    Object.keys(typeOptions).forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        newTypeSelect.appendChild(option);
    });

    document.getElementById('outfit_count').value = window.outfitItemCount;
}

function updateTypeOptions(index = '') {
    let typeSelect, detailSelect;

    typeSelect = document.getElementById(`type-${index}`);
    detailSelect = document.getElementById(`detail-${index}`);

    const selectedType = typeSelect.value;
    detailSelect.innerHTML = '<option value="">선택하세요</option>';

    if (typeOptions && selectedType in typeOptions) {
        typeOptions[selectedType].forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            detailSelect.appendChild(optionElement);
        });
    }
}

function loadBrands() {
    fetch('/brands')
        .then(response => response.json())
        .then(brands => {
            const brandList = document.getElementById('brand-list');
            brands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand;
                brandList.appendChild(option);
            });
        });
}

function setupFormSubmission() {
    const form = document.querySelector('form');
    if (form) { // form 요소가 존재하는지 확인
        form.addEventListener('submit', (event) => {
            console.log('submit');
            event.preventDefault();

        const formData = new FormData(event.target);
        formData.append('image', document.getElementById('image').files[0]);

        fetch('/save_data_outfit', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                alert(data.message);
                window.location.reload();
            })
            .catch(error => {
                alert(error.message);
            });
        });
    }
}

function previewImage(event) {
    const reader = new FileReader();
    reader.onload = function(){
        const output = document.getElementById('image-preview');
        output.src = reader.result;
        output.style.display = 'block';
    };
    reader.readAsDataURL(event.target.files[0]);
}

// 삭제 버튼 클릭 이벤트 처리
const deleteBtns = document.querySelectorAll('.delete-btn');
deleteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const outfitId = btn.dataset.id;
        const itemIndex = btn.dataset.index;
        deleteItem(outfitId, itemIndex);
    });
});

// 서버에 삭제 요청을 보내는 함수
async function deleteItem(outfitId, index) {
    try {
        const response = await fetch(`/delete_outfit/${outfitId}/${index}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            alert('항목이 삭제되었습니다.');
            location.reload();
        } else {
            alert('삭제 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('삭제 중 오류가 발생했습니다.');
    }
}

document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        const outfitId = this.dataset.id;
        const isLiked = this.dataset.liked === 'true';
        likeOutfit(outfitId, isLiked, this);
    });
});

async function likeOutfit(outfitId, isLiked, btn) {
    try {
        const response = await fetch(`/like_outfit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ outfitId: outfitId, like: !isLiked })
        });
        if (response.ok) {
            btn.dataset.liked = (!isLiked).toString();
            btn.textContent = !isLiked ? '좋아요 취소' : '좋아요';
        } else {
            alert('좋아요 처리 중 오류가 발생했습니다.');
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        alert('좋아요 처리 중 오류가 발생했습니다.');
    }
}

function init() {
    populateTypeOptions();
    loadBrands();
    
    const form = document.querySelector('form');
    if (form) { // form 요소가 존재하는지 확인
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            const imageInput = document.getElementById('image');
            // 사진 파일이 없으면 제출 불가
            if (!imageInput.files[0]) {
                alert('사진을 업로드해 주세요.');
                return;
            }
            // 옷 정보 폼 데이터 추가
            const outfitItems = document.querySelectorAll('.outfit-item');
            const outfit = [];
            outfitItems.forEach((item, index) => {
                const type = item.querySelector(`select[name^="type-"]`).value; // 수정됨
                const detail = item.querySelector(`select[name^="detail-"]`).value; // 수정됨
                const brand = item.querySelector(`input[name^="brand-"]`).value; // 수정됨
                const color = item.querySelector(`input[name^="color-"]`).value; // 수정됨
                if (type && detail && brand && color) {
                    outfit.push({ type, detail, brand, color });
                }
            });
            if (outfit.length === 0) {
                alert('최소한 하나의 옷 정보를 입력해주세요.');
                return;
            }
            formData.append('outfit', JSON.stringify(outfit));
            formData.append('image', imageInput.files[0]);
            fetch('/save_data_outfit', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    alert(data.message);
                    window.location.reload();
                })
                .catch(error => {
                    alert('오류가 발생했습니다: ' + error);
                });
        });
    }
}

window.addOutfitItem = addOutfitItem;
window.updateTypeOptions = updateTypeOptions;
window.previewImage = previewImage;

// DOMContentLoaded 이벤트에 init 함수 연결
window.removeEventListener('DOMContentLoaded', init);
window.addEventListener('DOMContentLoaded', init);