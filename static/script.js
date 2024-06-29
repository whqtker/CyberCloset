import { typeOptions } from './typeOptions.js';

function updateTypeOptions() {
    const typeSelect = document.getElementById('type');
    const detailSelect = document.getElementById('detail');
    const selectedType = typeSelect.value;

    detailSelect.innerHTML = '<option value="">선택하세요</option>';

    if (selectedType in typeOptions) {
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

function init() {
    loadBrands();
    setupFormSubmission();
    
    // 옷 종류 선택 시 이벤트 리스너 추가
    document.getElementById('type').addEventListener('change', updateTypeOptions);
}

// 전역 스코프에 함수 노출
window.updateTypeOptions = updateTypeOptions;

// DOMContentLoaded 이벤트에 init 함수 연결
window.addEventListener('DOMContentLoaded', init);