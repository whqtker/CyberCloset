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

function init() {
    populateTypeOptions();
    loadBrands();
    setupFormSubmission();
    
    // 옷 종류 선택 시 이벤트 리스너 추가
    document.getElementById('type').addEventListener('change', updateTypeOptions);
}

window.addOutfitItem = addOutfitItem;
window.updateTypeOptions = updateTypeOptions;

// DOMContentLoaded 이벤트에 init 함수 연결
window.addEventListener('DOMContentLoaded', init);