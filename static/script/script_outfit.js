import { typeOptions } from './typeOptions.js';

// 옵션을 동적으로 추가
function populateTypeOptions() {
    // ID가 "type-"으로 시작하는 모든 <select> 요소를 선택
    const typeSelects = document.querySelectorAll('[id^="type-"]');
    
    // 각 select 요소에 대하여 반복문 실행
    typeSelects.forEach(typeSelect => {
        // typeOptions 객체의 키(옷 종류)를 반복문으로 순회하며 select 요소에 옵션을 추가
        Object.keys(typeOptions).forEach(type => {
            // option 요소를 생성하고 select 요소에 추가
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
    });
}

// insert_outfit에서 옷 항목을 동적으로 추가
function addOutfitItem() {
    // outfitItemCount 변수가 정의되어 있지 않으면 1로 초기화, 그렇지 않으면 1 증가
    if (typeof window.outfitItemCount === 'undefined') {
        window.outfitItemCount = 1;
    } else {
        window.outfitItemCount++;
    }

    // outfit-container라는 ID를 가진 요소를 찾아서 그 안에 새로운 div 요소를 생성
    const outfitContainer = document.getElementById('outfit-container');
    const outfitItem = document.createElement('div');

    // outfit-item 클래스 추가
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
    
    // 새로 추가된 select 요소에 옷 종류 옵션 추가
    const newTypeSelect = document.getElementById(`type-${window.outfitItemCount}`);
    Object.keys(typeOptions).forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        newTypeSelect.appendChild(option);
    });

    // outfit_count라는 ID를 가진 요소의 값을 현재 window.outfitItemCount로 설정
    document.getElementById('outfit_count').value = window.outfitItemCount;
}

// insert_outfit에서 옷 종류에 따라 세부 종류 옵션을 동적으로 업데이트
function updateTypeOptions(index = '') {
    // index 매개변수는 동적으로 생성된 select 요소의 ID를 구분하기 위함.
    let typeSelect, detailSelect;

    // type-${index}와 detail-${index} ID를 가진 select 요소를 할당
    typeSelect = document.getElementById(`type-${index}`);
    detailSelect = document.getElementById(`detail-${index}`);

    // 사용자가 선택한 옷 종류
    const selectedType = typeSelect.value;
    detailSelect.innerHTML = '<option value="">선택하세요</option>';

    if (typeOptions && selectedType in typeOptions) {
        // 선택한 옷 종류에 따라 세부 종류 옵션을 추가
        typeOptions[selectedType].forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            detailSelect.appendChild(optionElement);
        });
    }
}

// 브랜드 목록을 동적으로 로드 및 요소에 추가
function loadBrands() {
    // 브랜드 데이터 요청
    fetch('/brands')
        // 응답 데이터를 JSON으로 변환
        .then(response => response.json())

        // JSON 데이터는 brands에 저장
        .then(brands => {
            const brandList = document.getElementById('brand-list');

            // 읽어 온 브랜드에 대하여 반복문 실행
            brands.forEach(brand => {
                // option 요소를 생성하고 brand-list 요소에 추가
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

// insert_outfit에서 이미지를 추가했을 때 이미지 미리보기
function previewImage(event) {
    // FileReader 객체 생성
    const reader = new FileReader();

    // 파일 읽기에 성공했을 때 실행되는 이벤트 핸들러
    reader.onload = function(){
        // 이미지 미리보기를 위한 img 요소 선택
        const output = document.getElementById('image-preview');

        // img 요소의 src 속성을 파일 경로로 설정
        output.src = reader.result;

        // img 요소를 화면에 표시
        output.style.display = 'block';
    };

    // 파일을 읽어오기
    reader.readAsDataURL(event.target.files[0]);
}

// 삭제 버튼 클릭 이벤트 처리
// delete-btn 클래스를 가진 모든 요소를 선택
const deleteBtns = document.querySelectorAll('.delete-btn');

// delete-btn 요소에 대하여 반복문 실행
deleteBtns.forEach(btn => {
    // 각 delete-btn 요소에 클릭 이벤트 리스너 추가
    // 클릭 이벤트 발생 시 익명 함수 실행
    btn.addEventListener('click', () => {
        // 클릭된 버튼의 data-id와 data-index 속성 값 읽어오기
        const outfitId = btn.dataset.id;
        const itemIndex = btn.dataset.index;

        // 선택된 항목에 대하여 삭제 함수 호출
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

// .like-btn 클래스를 가진 모든 요소에 대하여 클릭 이벤트 리스너 추가
document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        // 클릭된 버튼의 data-id와 data-liked 속성 값 읽어오기
        const outfitId = this.dataset.id;
        const isLiked = this.dataset.liked === 'true';
        likeOutfit(outfitId, isLiked, this);
    });
});

// 좋아요 토글 함수
async function likeOutfit(outfitId, isLiked, btn) {
    try {
        // fetch 함수를 사용해 서버에 POST 요청을 보냄
        const response = await fetch(`/like_outfit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ outfitId: outfitId, like: !isLiked })
        });

        // 응답이 성공적으로 왔을 때
        if (response.ok) {
            // 좋아요 상태를 업데이트하고 버튼의 텍스트 변경
            btn.dataset.liked = (!isLiked).toString();
            btn.textContent = !isLiked ? '좋아요 취소' : '좋아요';
        } else {
            alert('Error : 응답이 성공적이지 않습니다.');
        }
    } catch (error) {
        console.error('Error toggling like :', error);
        alert('좋아요 처리 중 오류가 발생했습니다.');
    }
}

// 삭제 버튼 클릭 이벤트 처리
document.querySelectorAll('.delete-outfit-btn').forEach(button => {
    button.addEventListener('click', async function() {
        const outfitId = this.dataset.id;
        const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');
        if (!csrfTokenElement) {
            console.error('CSRF token not found');
            alert('CSRF 토큰을 찾을 수 없습니다.');
            return;
        }
        try {
            const response = await fetch(`/delete_outfit/${outfitId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfTokenElement.getAttribute('content') // CSRF 토큰 추가
                }
            });
            if (response.ok) {
                alert('Outfit이 삭제되었습니다.');
                location.reload();
            } else {
                const result = await response.json().catch(() => null);
                if (result && result.error) {
                    alert(result.error);
                } else {
                    alert('삭제 중 오류가 발생했습니다.');
                }
            }
        } catch (error) {
            console.error('Error deleting outfit:', error);
            alert('삭제 중 오류가 발생했습니다.');
        }
    });
});

// 소유 여부 체크박스 변경 이벤트 처리
document.querySelectorAll('.owned-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const outfitId = this.getAttribute('data-id');
        const index = this.getAttribute('data-index');
        const owned = this.checked;
        fetch(`/update_owned/${outfitId}/${index}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ owned })
        })
        .then(response => {
            if (!response.ok) {
                alert('업데이트 중 오류가 발생했습니다.');
            }
        });
    });
});

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