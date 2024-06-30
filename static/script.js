import { typeOptions } from './typeOptions.js';

function populateTypeOptions() {
    // 'type-'로 시작하거나 ID가 'type'인 모든 select 요소를 선택
    const typeSelects = document.querySelectorAll('[id^="type-"], #type');
    
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
    if (index === '') {
        typeSelect = document.getElementById('type');
        detailSelect = document.getElementById('detail');
    } else {
        // Corrected to use template literals for dynamic ID generation
        typeSelect = document.getElementById(`type-${index}`);
        detailSelect = document.getElementById(`detail-${index}`);
    }

    if (!typeSelect || !detailSelect) {
        console.error('Type or detail select element not found');
        return;
    }

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

function isInsertOutfitPage() {
    return window.location.pathname.endsWith('insert_outfit.html');
}

function init() {
    populateTypeOptions();
    loadBrands();
    setupFormSubmission();

    // 옷 종류 선택 시 이벤트 리스너 추가
    document.getElementById('type').addEventListener('change', updateTypeOptions);

    // insert_outfit.html 전용 초기화 코드
    if (isInsertOutfitPage()) {
        document.querySelector('form').addEventListener('submit', (event) => {
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
                const type = item.querySelector(`[name^="type-"]`).value;
                const detail = item.querySelector(`[name^="detail-"]`).value;
                const brand = item.querySelector(`[name^="brand-"]`).value;
                const color = item.querySelector(`[name^="color-"]`).value;
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

// DOMContentLoaded 이벤트에 init 함수 연결
window.removeEventListener('DOMContentLoaded', init);
window.addEventListener('DOMContentLoaded', init);