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
    // 삭제 버튼 클릭 이벤트 처리
    const deleteBtns = document.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = btn.dataset.id;
            deleteItem(itemId);
        });
    });
});

// 서버에 삭제 요청을 보내는 함수
async function deleteItem(id) {
    try {
        const response = await fetch(`/delete_my/${id}`, {
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