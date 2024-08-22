import { typeOptions } from './typeOptions.js';

function populateTypeOptions() {
    const typeSelects = document.querySelectorAll('#type');
    
    typeSelects.forEach(typeSelect => {
        Object.keys(typeOptions).forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });
    });
}

function updateTypeOptions() {
    let typeSelect = document.getElementById('type');
    let detailSelect = document.getElementById('detail');

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

function setupFormSubmission() {
    document.querySelector('form').addEventListener('submit', (event) => {
        console.log('submit');
        event.preventDefault();

        const formData = new FormData(event.target);
        formData.append('image', document.getElementById('image').files[0]);

        fetch('/save_data_my', {
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

document.addEventListener('DOMContentLoaded', () => {
    // 삭제 버튼 클릭 시 deleteItem 함수 호출
    const deleteBtns = document.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', async (event) => {
            const itemId = event.target.getAttribute('data-id');
            if (!itemId) {
                console.error('Item ID not found');
                alert('항목 ID를 찾을 수 없습니다.');
                return;
            }
            const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');
            if (!csrfTokenElement) {
                console.error('CSRF token not found');
                alert('CSRF 토큰을 찾을 수 없습니다.');
                return;
            }
            try {
                const response = await fetch(`/delete_my/${itemId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfTokenElement.getAttribute('content') // CSRF 토큰 추가
                    }
                });
                if (response.ok) {
                    const result = await response.json();
                    alert(result.message);
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
                console.error('Error deleting item:', error);
                alert('삭제 중 오류가 발생했습니다.');
            }
        });
    });
});

function init() {
    populateTypeOptions();
    const brandList = document.getElementById('brand-list');
    if (brandList) {
        loadBrands();
    }
    const typeSelect = document.getElementById('type');
    if (typeSelect) {
        typeSelect.addEventListener('change', updateTypeOptions);
    }
    const form = document.querySelector('form');
    if (form) {
        setupFormSubmission();
    }
}

window.updateTypeOptions = updateTypeOptions;
window.previewImage = previewImage;

// DOMContentLoaded 이벤트에 init 함수 연결
window.removeEventListener('DOMContentLoaded', init);
window.addEventListener('DOMContentLoaded', init);