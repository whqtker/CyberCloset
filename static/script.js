import { typeOptions } from './typeOptions.js';

function populateTypeOptions() {
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
        typeSelect = document.getElementById(`type-${index}`);
        detailSelect = document.getElementById(`detail-${index}`);
    }

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