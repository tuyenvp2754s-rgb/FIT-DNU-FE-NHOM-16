/* ============================================
   PETADOPT PROFESSIONAL - JAVASCRIPT
   Main App File (app.js) - FULLY FIXED & OPTIMIZED
   ============================================ */

// ============================================
// 1. API & DATA MANAGEMENT
// ============================================

const API_URL = 'https://6a0d322e769682b8ee75c462.mockapi.io/api/v1/pets';
const ADOPTION_FORM_KEY = 'adoptionFormData';
const FAVORITES_KEY = 'petFavorites';
const SELECTED_PET_KEY = 'selectedPet';
const AUTH_USERS_KEY = 'petadoptUsers';
const AUTH_SESSION_KEY = 'petadoptSession';

let allPets = [];
let filteredPets = [];
let currentPage = 1;
const petsPerPage = 12;
let pendingAuthAction = null;

// ============================================
// 2. UTILITY FUNCTIONS
// ============================================

/**
 * Hiển thị thông báo Toast
 */
function showToast(message, type = 'success') {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = 'toast show';

  if (type === 'error') {
    toast.style.background = '#ef4444';
  } else if (type === 'warning') {
    toast.style.background = '#f59e0b';
  } else {
    toast.style.background = '#111827';
  }

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/**
 * Định dạng ngày hiển thị dạng DD/MM/YYYY
 */
function formatDate(date) {
  if (!date) return 'N/A';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Lấy emoji chuẩn theo loài vật (Sửa lỗi hiển thị chữ undefined icon)
 */
function getPetEmoji(type) {
  const emojiMap = {
    dog: '🐶',
    cat: '🐱',
    rabbit: '🐰',
    bird: '🐦',
    hamster: '🐹'
  };
  // Nếu dữ liệu API trả về chữ viết hoa hoặc giá trị khác, chuẩn hóa về viết thường
  const key = String(type).toLowerCase().trim();
  return emojiMap[key] || '🐾';
}

/**
 * Lấy biểu tượng giới tính
 */
function getGenderEmoji(gender) {
  const g = String(gender).toLowerCase().trim();
  return g === 'male' || g === 'đực' ? '♂' : '♀';
}

/**
 * Hàm hoãn xử lý (Debounce) hỗ trợ tìm kiếm mượt mà
 */
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Bộ công cụ quản lý bộ nhớ Local Storage
 */
const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage error:', e);
    }
  },
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Storage error:', e);
      return null;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Storage error:', e);
    }
  }
};

// ============================================
// 3. API CALLS
// ============================================

/**
 * Tải danh sách thú cưng từ MockAPI
 */
async function fetchPets() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch pets');
    allPets = await response.json();
    filteredPets = [...allPets];
    console.log('Pets loaded:', allPets.length);
    return allPets;
  } catch (error) {
    console.error('API Error:', error);
    showToast('Không thể tải dữ liệu thú cưng', 'error');
    return [];
  }
}

// ============================================
// 4. PET CARD RENDERING (Đã thêm bộ lọc ẩn thú cưng đã nhận nuôi)
// ============================================

/**
 * Kiểm tra pet có đơn nhận nuôi đã được duyệt hay không
 * @param {number|string} petId - ID của thú cưng
 * @returns {boolean} true nếu pet đã được duyệt
 */
function isPetApproved(petId) {
  const applications = storage.get(ADOPTION_FORM_KEY) || [];
  return applications.some(app => {
    const appPetId = app.petId || (app.pet && String(app.pet.id));
    return String(appPetId) === String(petId) && 
           (app.status === 'Đã duyệt' || app.status === 'approved' || app.status === 'APPROVED');
  });
}

/**
 * Tạo cấu trúc HTML cho từng thẻ thú cưng (Sửa lỗi hiển thị text undefined)
 */
function createPetCard(pet) {
  const isFavorite = isFavoritePet(pet.id);
  const emoji = getPetEmoji(pet.type);
  const genderEmoji = getGenderEmoji(pet.gender);
  const isApproved = isPetApproved(pet.id);
  
  // Chuẩn hóa văn bản hiển thị loài vật, tránh hiển thị chữ gốc tiếng Anh hoặc bị undefined
  let typeText = 'Thú cưng';
  if (pet.type === 'dog') typeText = 'Chó';
  else if (pet.type === 'cat') typeText = 'Mèo';
  else if (pet.type === 'hamster') typeText = 'Chuột Hamster';
  else if (pet.type === 'rabbit') typeText = 'Thỏ';
  else if (pet.type) typeText = pet.type;

  // Chuẩn hóa văn bản giới tính
  const genderText = (pet.gender === 'male' || pet.gender === 'đực') ? 'Đực' : 'Cái';
  
  return `
    <div class="card pet-card" data-pet-id="${pet.id}">
      <div class="pet-image">
        <img src="${pet.image}" alt="${pet.name}" onerror="this.src='https://via.placeholder.com/250?text=${pet.name}'">
      </div>
      <div class="pet-content">
        <h3>${pet.name || 'Thú cưng'}</h3>
        <div class="pet-meta">
          <span>${emoji} ${typeText}</span>
          <span>🎂 ${pet.age || 1} tuổi</span>
          <span>${genderEmoji} ${genderText}</span>
        </div>
        <p style="color: var(--color-text-light); margin: var(--spacing-lg) 0; font-size: var(--font-size-sm);">
          ${pet.description || 'Bé rất thân thiện và dễ chăm sóc'}
        </p>
        <div style="display: flex; gap: var(--spacing-md); margin-top: auto;">
          <button class="btn btn-primary adoption-btn" data-pet-id="${pet.id}" 
            ${isApproved ? 'disabled' : ''} onclick="handleAdoptionAction('${pet.id}')">
            ${isApproved ? '✅ Đã có chủ' : '🏠 Nhận nuôi'}
          </button>
          <button class="btn btn-outline favorite-btn" data-pet-id="${pet.id}" 
            ${isApproved ? 'disabled' : ''} onclick="handleFavoriteAction('${pet.id}')">
            ${isFavorite ? '❤️ Đã lưu' : '🤍 Lưu'}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render danh sách thú cưng ra lưới (Tự động loại bỏ các bé đã được nhận nuôi)
 */
function renderPetsGrid(pets, containerId = 'petsContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Lấy danh sách hồ sơ đăng ký nhận nuôi hiện tại trong LocalStorage
  const applications = storage.get(ADOPTION_FORM_KEY) || [];
  
  // Gom tất cả ID của những bé đã có người gửi đơn đăng ký
  const adoptedPetIds = applications.map(app => app.pet && String(app.pet.id));

  // LỌC: Chỉ giữ lại những bé chưa có ai làm đơn đăng ký nhận nuôi
  const availablePets = pets.filter(pet => !adoptedPetIds.includes(String(pet.id)));

  if (availablePets.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: var(--spacing-xl) 0;">
        <h3>Không có thú cưng nào trống</h3>
        <p>Tất cả bé trong mục này đã được mọi người gửi đơn đăng ký nhận nuôi!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = availablePets.map(pet => createPetCard(pet)).join('');
  
  // QUAN TRỌNG: Không gán event listener trực tiếp ở đây!
  // Event Delegation sẽ được xử lý ở hàm setupPetsGridEventDelegation()
}

/**
 * Render danh sách thú cưng tại trang chủ (Tự động loại bỏ các bé đã được nhận nuôi)
 */
function renderHomePets() {
  const container = document.getElementById('homePets');
  if (!container) return;

  const applications = storage.get(ADOPTION_FORM_KEY) || [];
  const adoptedPetIds = applications.map(app => app.pet && String(app.pet.id));

  // Chỉ lấy những bé chưa được gửi đơn nhận nuôi
  const availablePets = allPets.filter(pet => !adoptedPetIds.includes(String(pet.id)));

  // Lấy tối đa 3 bé đầu tiên còn trống để hiển thị ở trang chủ
  const homePets = availablePets.slice(0, 3);
  
  if (homePets.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><p>Mọi bé thú cưng đều đã tìm thấy mái ấm!</p></div>`;
    return;
  }

  container.innerHTML = homePets.map(pet => createPetCard(pet)).join('');
  
  // QUAN TRỌNG: Không gán event listener ở đây!
  // Event Delegation sẽ được setup riêng cho homePets container
}

// ============================================
// 5. FILTERING & SEARCHING
// ============================================

/**
 * Bộ lọc tìm kiếm nâng cao theo nhiều tiêu chí
 */
function filterPets() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const speciesFilter = document.getElementById('speciesFilter')?.value || '';
  const genderFilter = document.getElementById('genderFilter')?.value || '';
  const ageFilter = document.getElementById('ageFilter')?.value || '';
  const sortFilter = document.getElementById('sortFilter')?.value || '';

  filteredPets = allPets.filter(pet => {
    if (searchTerm && !pet.name.toLowerCase().includes(searchTerm)) {
      return false;
    }
    if (speciesFilter && pet.type !== speciesFilter) {
      return false;
    }
    if (genderFilter && pet.gender !== genderFilter) {
      return false;
    }
    if (ageFilter) {
      if (ageFilter === 'young' && pet.age >= 1) return false;
      if (ageFilter === 'adult' && (pet.age < 1 || pet.age > 5)) return false;
      if (ageFilter === 'old' && pet.age <= 5) return false;
    }
    return true;
  });

  if (sortFilter) {
    if (sortFilter === 'newest') {
      filteredPets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortFilter === 'youngest') {
      filteredPets.sort((a, b) => a.age - b.age);
    } else if (sortFilter === 'oldest') {
      filteredPets.sort((a, b) => b.age - a.age);
    }
  }

  currentPage = 1;
  renderPaginatedPets();
  setupPetsGridEventDelegation();  // ✅ Re-setup event delegation khi filter thay đổi
}

/**
 * Phân trang danh sách hiển thị
 */
function renderPaginatedPets() {
  const start = (currentPage - 1) * petsPerPage;
  const end = start + petsPerPage;
  const paginatedPets = filteredPets.slice(start, end);

  renderPetsGrid(paginatedPets);

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    // Đo đạc dựa trên danh sách thú cưng thực tế sau khi loại trừ hàng đã đăng ký
    const applications = storage.get(ADOPTION_FORM_KEY) || [];
    const adoptedPetIds = applications.map(app => app.pet && String(app.pet.id));
    const finalAvailableCount = filteredPets.filter(pet => !adoptedPetIds.includes(String(pet.id))).length;

    loadMoreBtn.style.display = end < finalAvailableCount ? 'block' : 'none';
  }
}

/**
 * Tải thêm thú cưng khi nhấn nút xem thêm
 */
function loadMorePets() {
  currentPage++;
  const start = (currentPage - 1) * petsPerPage;
  const end = start + petsPerPage;
  const paginatedPets = filteredPets.slice(start, end);

  const container = document.getElementById('petsContainer');
  if (container) {
    const applications = storage.get(ADOPTION_FORM_KEY) || [];
    const adoptedPetIds = applications.map(app => app.pet && String(app.pet.id));
    
    // Chỉ render các bé chưa được nhận nuôi trong danh sách tải thêm
    const availablePaginated = paginatedPets.filter(pet => !adoptedPetIds.includes(String(pet.id)));
    const newCards = availablePaginated.map(pet => createPetCard(pet)).join('');
    container.innerHTML += newCards;

    // ✅ Re-setup event delegation vì có pet card mới được thêm vào
    setupPetsGridEventDelegation();

    const finalAvailableCount = filteredPets.filter(pet => !adoptedPetIds.includes(String(pet.id))).length;
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn && end >= finalAvailableCount) {
      loadMoreBtn.style.display = 'none';
    }
  }
}

// ============================================
// 6. MODAL FUNCTIONS
// ============================================

/**
 * ============================================================
 * SETUP EVENT DELEGATION CHO PET CARDS
 * ============================================================
 * 
 * GIẢI THÍCH LỖI CŨ:
 * Trước đây, code gán event listener trực tiếp cho từng card
 * bằng document.querySelectorAll('.pet-card').forEach(...)
 * 
 * Vấn đề:
 * - Mỗi lần render lại danh sách (filter, load more), event listener lại được gán thêm
 * - Event listener cũ vẫn tồn tại → modal bị "kẹt" hoặc không hoạt động
 * - Gây lỗi: Click lần 2 trở đi, modal không hiển thị
 * 
 * GIẢI PHÁP - EVENT DELEGATION:
 * - Gán listener MỘT LẦN DUY NHẤT trên container cha (petsContainer)
 * - Khi click bất cứ đâu, kiểm tra xem click vào card nào
 * - Không cần gán listener mỗi lần render
 * 
 * ============================================================
 */
function setupPetsGridEventDelegation() {
  const petsContainer = document.getElementById('petsContainer');
  if (!petsContainer) return;

  // Xóa listener cũ (nếu có) để tránh lặp lại
  petsContainer.removeEventListener('click', handlePetCardClick);
  
  // Gán MỘT listener cho toàn bộ container
  petsContainer.addEventListener('click', handlePetCardClick);
}

/**
 * Hàm xử lý click event (dùng cho Event Delegation)
 */
function handlePetCardClick(event) {
  // Nếu click vào button, bỏ qua (để button onclick xử lý)
  if (event.target.closest('button')) {
    return;
  }

  // Tìm card cha của element được click
  const card = event.target.closest('.pet-card');
  if (!card) return;

  // Lấy ID từ data attribute
  const petId = card.dataset.petId;
  if (petId) {
    openPetModal(petId);
  }
}

/**
 * Setup Event Delegation cho home pets container
 */
function setupHomeEventDelegation() {
  const homePetsContainer = document.getElementById('homePets');
  if (!homePetsContainer) return;

  // Xóa listener cũ (nếu có)
  homePetsContainer.removeEventListener('click', handlePetCardClick);
  
  // Gán listener cho home pets container
  homePetsContainer.addEventListener('click', handlePetCardClick);
}

/**
 * Mở hộp thoại Modal chi tiết thú cưng
 * CẢI TIẾN: Clear modal content trước khi populate
 */
function openPetModal(petId) {
  const pet = allPets.find(p => p.id === petId);
  if (!pet) return;

  const modal = document.getElementById('petModal');
  if (!modal) return;

  // ✅ QUAN TRỌNG: Clear modal content cũ trước khi thêm dữ liệu mới
  // Tránh dữ liệu cũ bị lẫn vào
  modal.querySelectorAll('[id^="modalPet"]').forEach(el => {
    el.textContent = '';
    el.src = '';
  });

  const emoji = getPetEmoji(pet.type);
  const genderEmoji = getGenderEmoji(pet.gender);
  
  let typeLabel = 'Thú cưng';
  if (pet.type === 'dog') typeLabel = 'Chó';
  else if (pet.type === 'cat') typeLabel = 'Mèo';
  else if (pet.type) typeLabel = pet.type;

  const genderLabel = (pet.gender === 'male' || pet.gender === 'đực') ? 'Đực' : 'Cái';

  // Populate modal với dữ liệu pet mới
  document.getElementById('modalPetImage').src = pet.image;
  document.getElementById('modalPetImage').onerror = function() {
    this.src = 'https://via.placeholder.com/300?text=' + pet.name;
  };
  document.getElementById('modalPetName').textContent = pet.name || 'Thú cưng';
  document.getElementById('modalPetAge').textContent = `🎂 ${pet.age || 1} tuổi`;
  document.getElementById('modalPetGender').textContent = `${genderEmoji} ${genderLabel}`;
  document.getElementById('modalPetSpecies').textContent = `${emoji} ${typeLabel}`;
  document.getElementById('modalPetDescription').textContent = pet.description || 'Bé rất thân thiện và dễ chăm sóc.';
  document.getElementById('modalPetStatus').textContent = '🟢 Sẵn sàng nhận nuôi';

  const isFavorite = isFavoritePet(petId);
  const favBtn = document.getElementById('saveFavoriteBtn');
  if (favBtn) {
    favBtn.textContent = isFavorite ? '❤️ Đã lưu' : '🤍 Lưu yêu thích';
    favBtn.onclick = () => handleFavoriteAction(petId);
  }

  modal.classList.add('active');

  // Setup close button (gán một lần, không gán lại nhiều lần)
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn && !closeBtn.hasAttribute('data-listener-attached')) {
    closeBtn.onclick = () => closePetModal();
    closeBtn.setAttribute('data-listener-attached', 'true');
  }

  // Setup overlay click (gán một lần, không gán lại nhiều lần)
  const overlay = modal.querySelector('.modal-overlay');
  if (overlay && !overlay.hasAttribute('data-listener-attached')) {
    overlay.onclick = () => closePetModal();
    overlay.setAttribute('data-listener-attached', 'true');
  }
}

/**
 * Đóng hộp thoại Modal chi tiết thú cưng
 * CẢI TIẾN: Clear modal content khi đóng
 */
function closePetModal() {
  const modal = document.getElementById('petModal');
  if (modal) {
    modal.classList.remove('active');
    
    // ✅ Clear modal content để tránh lẫn dữ liệu
    modal.querySelectorAll('[id^="modalPet"]').forEach(el => {
      el.textContent = '';
      el.src = '';
      el.onclick = null; // Clear onClick handlers
    });
  }
}

// ============================================
// 7. ADOPTION FORM & HISTORY PROCESSOR
// ============================================

/**
 * Lưu dữ liệu thú cưng được chọn và dẫn tới trang điền đơn
 */
async function renderAdoptionHistory() {
  const API_ADS = "https://6a0d322e769682b8ee75c462.mockapi.io/api/v1/adoptions";
  
  // 1. Lấy dữ liệu mới nhất từ API
  const response = await fetch(API_ADS);
  const ads = await response.json();

  // 2. Chọn nơi để hiển thị danh sách (cần có <div id="historyList"></div> trong HTML)
  const container = document.getElementById("historyList");
  
  // 3. Vẽ dữ liệu ra màn hình
  container.innerHTML = ads.map(a => `
    <div class="card history-card ${a.status === 'Đã duyệt' ? 'approved' : 'pending'}">
      <h3>${a.petName}</h3>
      <p>Trạng thái: ${a.status || 'Chờ duyệt'}</p>
    </div>
  `).join("");
}

// Gọi hàm này khi trang tải xong
window.onload = renderAdoptionHistory;
function goToAdoptionForm(petId) {
  if (!getCurrentUser()) {
    showAuthRequired('adoption', petId);
    return;
  }

  const pet = allPets.find(p => p.id === petId);
  if (pet) {
    storage.set(SELECTED_PET_KEY, pet);
    window.location.href = 'adoption.html';
  }
}

function handleAdoptionAction(petId) {
  goToAdoptionForm(petId);
}

/**
 * Lấy dữ liệu thú cưng đang làm đơn
 */
function getSelectedPet() {
  return storage.get(SELECTED_PET_KEY);
}

/**
 * Đổ dữ liệu thú cưng vào sidebar trang nhận nuôi
 */
function loadSelectedPetInfo() {
  const pet = getSelectedPet();
  const petCard = document.querySelector('.adopt-pet-card') || document.querySelector('.sidebar-card') || document.querySelector('aside') || document.body;
  
  if (pet && petCard) {
    const image = petCard.querySelector('img');
    const name = petCard.querySelector('h3') || petCard.querySelector('h4') || petCard.querySelector('.pet-name');
    const meta = petCard.querySelector('.pet-meta') || petCard.querySelector('p');

    if (image) image.src = pet.image;
    if (name) name.textContent = pet.name || 'Thú cưng';
    
    if (meta) {
      const emoji = getPetEmoji(pet.type);
      let typeLabel = 'Thú cưng';
      if (pet.type === 'dog') typeLabel = 'Chó';
      else if (pet.type === 'cat') typeLabel = 'Mèo';
      else if (pet.type) typeLabel = pet.type;

      meta.innerHTML = `
        <span>${emoji} ${typeLabel}</span>
        <span>🎂 ${pet.age || 1} tuổi</span>
      `;
    }
  }
}

/**
 * Điều hướng giữa thanh tiến trình 3 bước nhận nuôi
 */
function goToStep(stepNumber) {
  const steps = document.querySelectorAll('.form-step');
  const progressFill = document.querySelector('.progress-fill');
  const progressSteps = document.querySelectorAll('.progress-steps .step');

  steps.forEach((step, index) => {
    step.classList.remove('active');
    if (index + 1 === stepNumber) {
      step.classList.add('active');
    }
  });

  if (progressFill) {
    progressFill.style.width = ((stepNumber - 1) / 2) * 100 + '%';
  }

  progressSteps.forEach((step, index) => {
    step.classList.remove('active');
    if (index + 1 <= stepNumber) {
      step.classList.add('active');
    }
  });

  const form = document.querySelector('.adoption-form') || document.querySelector('form');
  if (form) {
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Khởi tạo trình điều hướng các nút bấm tại trang form điền đơn
 */
function initFormSteps() {
  const nextButtons = document.querySelectorAll('.next-step');
  const prevButtons = document.querySelectorAll('.prev-step');

  nextButtons.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      goToStep(index + 2);
    });
  });

  prevButtons.forEach((btn, index) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      goToStep(index + 1);
    });
  });

  const form = document.getElementById('adoptionForm') || document.querySelector('form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitAdoptionForm();
    });
  }

  const allButtons = document.querySelectorAll('button');
  allButtons.forEach(btn => {
    if (btn.textContent.includes('Gửi hồ sơ nhận nuôi')) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        submitAdoptionForm();
      });
    }
  });
}

/**
 * Xử lý thu thập thông tin và đóng gói đơn nhận nuôi lưu vào Lịch sử
 */
function submitAdoptionForm() {
  if (!getCurrentUser()) {
    showToast('Bạn cần đăng nhập để gửi hồ sơ nhận nuôi.', 'error');
    showAuthRequired('adoption', getSelectedPet()?.id);
    return;
  }

  const fullName = document.getElementById('adoptionFullName')?.value?.trim() || "Người dùng ẩn danh";
  const email = document.getElementById('adoptionEmail')?.value?.trim() || "Chưa cung cấp Email";
  const phone = document.getElementById('adoptionPhone')?.value?.trim() || "Chưa nhập số điện thoại";
  const address = document.getElementById('adoptionAddress')?.value?.trim() || "Chưa nhập địa chỉ";

  const selectedPet = getSelectedPet();
  if (!selectedPet) {
    showToast('Không tìm thấy thông tin thú cưng cần nhận nuôi!', 'error');
    return;
  }

  const currentUser = getCurrentUser();
  const newApplication = {
    userName: fullName,
    email: email,
    phone: phone,
    address: address,
    petName: selectedPet.name,
    petId: selectedPet.id,
    userId: currentUser.id,
    username: currentUser.username,
    status: "Chờ duyệt",
    submittedAt: new Date().toISOString()
  };

  // POST lên MockAPI
  fetch('https://6a0d322e769682b8ee75c462.mockapi.io/api/v1/adoptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newApplication)
  })
  .then(res => res.json())
  .then(data => {
    // Cũng lưu ở localStorage để hiển thị local
    let currentApplications = getUserApplications();
    if (!Array.isArray(currentApplications)) {
      currentApplications = currentApplications ? [currentApplications] : [];
    }
    currentApplications.unshift(newApplication);
    setUserApplications(currentApplications);

    showToast('Gửi hồ sơ thành công! Đang chuyển hướng...', 'success');
    storage.remove(SELECTED_PET_KEY);

    setTimeout(() => {
      window.location.href = 'history.html';
    }, 1500);
  })
  .catch(err => {
    console.error('Lỗi khi gửi hồ sơ:', err);
    // Fallback: lưu ở localStorage nếu API lỗi
    let currentApplications = getUserApplications();
    if (!Array.isArray(currentApplications)) {
      currentApplications = currentApplications ? [currentApplications] : [];
    }
    currentApplications.unshift(newApplication);
    setUserApplications(currentApplications);

    showToast('Hồ sơ được lưu (offline mode). Đang chuyển hướng...', 'success');
    storage.remove(SELECTED_PET_KEY);

    setTimeout(() => {
      window.location.href = 'history.html';
    }, 1500);
  });
}

/**
 * Hiển thị dữ liệu lịch sử nhận nuôi động lên trang history.html
 */
function renderAdoptionHistory() {
  const gridContainer = document.querySelector('.history-grid');
  const emptyState = document.querySelector('.empty-state');
  if (!gridContainer) return;

  let applications = getUserApplications();
  if (!Array.isArray(applications)) {
    applications = [applications];
  }

  if (applications.length === 0) {
    gridContainer.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  gridContainer.style.display = 'grid';

  gridContainer.innerHTML = applications.map(app => {
    const pet = app.pet || { name: 'Thú cưng', type: 'dog', age: 1, image: 'https://via.placeholder.com/150' };
    const petEmoji = getPetEmoji(pet.type);
    
    let typeLabel = 'Thú cưng';
    if (pet.type === 'dog') typeLabel = 'Chó';
    else if (pet.type === 'cat') typeLabel = 'Mèo';
    else if (pet.type) typeLabel = pet.type;

    const formattedDate = formatDate(app.submittedAt);

    let statusClass = 'pending';
    let statusText = 'Đang chờ duyệt';
    let timelineHTML = '';

    if (app.status === 'approved' || app.status === 'APPROVED') {
      statusClass = 'approved';
      statusText = 'Đã chấp nhận';
      timelineHTML = `
        <div class="timeline-item active"><div class="timeline-dot"></div><div><h4>Đã gửi hồ sơ</h4><p>${formattedDate}</p></div></div>
        <div class="timeline-item active"><div class="timeline-dot"></div><div><h4>Đã phê duyệt</h4><p>Thành công</p></div></div>
      `;
    } else if (app.status === 'rejected' || app.status === 'REJECTED') {
      statusClass = 'rejected';
      statusText = 'Bị từ chối';
      timelineHTML = `
        <div class="timeline-item active"><div class="timeline-dot"></div><div><h4>Đã gửi hồ sơ</h4><p>${formattedDate}</p></div></div>
        <div class="timeline-item rejected"><div class="timeline-dot"></div><div><h4>Hồ sơ bị từ chối</h4><p>Kiểm tra ghi chú</p></div></div>
      `;
    } else {
      timelineHTML = `
        <div class="timeline-item active"><div class="timeline-dot"></div><div><h4>Đã gửi hồ sơ</h4><p>${formattedDate}</p></div></div>
        <div class="timeline-item"><div class="timeline-dot"></div><div><h4>Đang xét duyệt</h4><p>Chờ xử lý</p></div></div>
      `;
    }

    return `
      <div class="card history-card ${statusClass}">
        <div class="history-top">
          <img src="${pet.image}" alt="${pet.name}" onerror="this.src='https://via.placeholder.com/150'">
          <div>
            <h3>${pet.name || 'Thú cưng'}</h3>
            <p>${petEmoji} ${typeLabel} • ${pet.age || 1} tuổi</p>
          </div>
        </div>
        <div class="status ${statusClass}">
          ${statusText}
        </div>
        <div class="history-info">
          <p>📅 Ngày đăng ký: ${formattedDate}</p>
          <p>👤 Người đăng ký: ${app.fullName} (${app.phone})</p>
          <p>📍 Địa chỉ nhận nuôi: ${app.address}</p>
        </div>
        <div class="timeline small">
          ${timelineHTML}
        </div>
      </div>
    `;
  }).join('');
}

// ============================================
// 8. FAVORITES & PROFILE SYNCHRONIZATION
// ============================================

function getCurrentUser() {
  try {
    const savedUser = sessionStorage.getItem(AUTH_SESSION_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    console.error('Auth session error:', error);
    return null;
  }
}

function getUserStorageKey(baseKey) {
  const user = getCurrentUser();
  return user ? `${baseKey}_${user.id}` : baseKey;
}

function getUserData(baseKey, fallback = []) {
  const key = getUserStorageKey(baseKey);
  return storage.get(key) ?? fallback;
}

function setUserData(baseKey, value) {
  const key = getUserStorageKey(baseKey);
  storage.set(key, value);
}

function getUserFavorites() {
  return getUserData(FAVORITES_KEY, []);
}

function setUserFavorites(favorites) {
  setUserData(FAVORITES_KEY, favorites);
}

function getUserApplications() {
  return getUserData(ADOPTION_FORM_KEY, []);
}

function setUserApplications(applications) {
  setUserData(ADOPTION_FORM_KEY, applications);
}

function isFavoritePet(petId) {
  const favorites = getUserFavorites();
  return favorites.includes(String(petId));
}

function handleFavoriteAction(petId) {
  if (!getCurrentUser()) {
    showAuthRequired('favorite', petId);
    return;
  }

  toggleFavorite(petId);
}

function toggleFavorite(petId) {
  if (!getCurrentUser()) {
    showAuthRequired('favorite', petId);
    return;
  }

  let favorites = getUserFavorites();
  petId = String(petId);

  if (favorites.includes(petId)) {
    favorites = favorites.filter(id => id !== petId);
    showToast('Đã xoá khỏi danh sách yêu thích');
  } else {
    favorites.push(petId);
    showToast('Đã thêm vào danh sách yêu thích');
  }

  setUserFavorites(favorites);

  const btns = document.querySelectorAll(`[data-pet-id="${petId}"]`);
  btns.forEach(btn => {
    const isFav = isFavoritePet(petId);
    btn.textContent = isFav ? '❤️ Đã lưu' : '🤍 Lưu';
  });
}

/**
 * REFRESH DỮ LIỆU ADOPTION TỪ MockAPI - ĐẢM BẢO LUÔN HIỂN THỊ DỮ LIỆU MỚI NHẤT
 * Hàm này fetch từ MockAPI và cập nhật localStorage với dữ liệu mới
 */
async function refreshUserAdoptionsFromAPI() {
  const currentUser = getCurrentUser();
  if (!currentUser) return; // Không fetch nếu user chưa đăng nhập

  try {
    const response = await fetch('https://6a0d322e769682b8ee75c462.mockapi.io/api/v1/adoptions');
    if (!response.ok) throw new Error('Không thể tải dữ liệu từ API');

    const allAdoptions = await response.json();
    
    // Filter chỉ lấy các hồ sơ của user hiện tại
    const userAdoptions = Array.isArray(allAdoptions) 
      ? allAdoptions.filter(adoption => 
          adoption.userId === currentUser.id || 
          adoption.username === currentUser.username
        )
      : [];

    // Cập nhật localStorage với dữ liệu mới từ API
    if (userAdoptions.length > 0) {
      setUserApplications(userAdoptions);
    }
  } catch (error) {
    console.warn('Không thể refresh adoption data từ API:', error);
    // Fallback sử dụng dữ liệu cũ từ localStorage
  }
}

/**
 * ĐỒNG BỘ HIỂN THỊ TRANG CÁ NHÂN (PROFILE.HTML) - FIX LỖI KHÔNG XOÁ ĐƯỢC CON VẬT
 */
function renderProfilePage() {
  const favContainer = document.getElementById("profileFavoritesList");
  const historyContainer = document.getElementById("profileHistoryList");

  const favorites = getUserFavorites();
  const applications = getUserApplications();

  // --- RENDERING THÚ CƯNG YÊU THÍCH ---
  if (favContainer) {
    if (favorites.length === 0) {
      favContainer.innerHTML = `<p style="color: #6b7280; font-style: italic; padding: 12px 0;">Danh sách yêu thích trống. Hãy nhấn "Lưu" ở ngoài trang Thú cưng!</p>`;
    } else {
      const favPets = allPets.filter(pet => favorites.includes(String(pet.id)));
      
      if (favPets.length === 0) {
        favContainer.innerHTML = `<p style="color: #6b7280; font-style: italic; padding: 12px 0;">Danh sách yêu thích trống.</p>`;
      } else {
        favContainer.innerHTML = favPets.map(pet => {
          let emoji = getPetEmoji(pet.type);
          let typeLabel = pet.type === 'dog' ? 'Chó' : (pet.type === 'cat' ? 'Mèo' : pet.type);
          return `
            <div class="favorite-item-row" id="profile-fav-${pet.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 12px; transition: all 0.3s ease;">
              <div style="display: flex; align-items: center; gap: 16px;">
                <img src="${pet.image}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;" alt="${pet.name}" onerror="this.src='https://via.placeholder.com/150'">
                <div>
                  <h4 style="margin: 0 0 4px 0; font-size: 16px; color: #1f2937; font-weight: 700;">${pet.name}</h4>
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">${emoji} ${typeLabel} • 🎂 ${pet.age || 1} tuổi</p>
                </div>
              </div>
              <button class="btn-remove-fav" onclick="profileRemoveFavorite('${pet.id}')" style="background: #fee2e2; color: #ef4444; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px;">
                💔 Bỏ lưu
              </button>
            </div>
          `;
        }).join('');
      }
    }
  }

  // --- RENDERING LỊCH SỬ ĐĂNG KÝ ---
  if (historyContainer) {
    if (applications.length === 0) {
      historyContainer.innerHTML = `<p style="color: #6b7280; font-style: italic; padding: 12px 0;">Bạn chưa gửi đơn đăng ký nhận nuôi bé nào.</p>`;
    } else {
      historyContainer.innerHTML = applications.map(form => {
        // Hỗ trợ cả format cũ (form.pet.name) và format mới (form.petName)
        const petName = form.petName || (form.pet ? form.pet.name : 'Thú cưng');
        const formattedDate = formatDate(form.submittedAt);
        let statusText = 'Đang chờ';
        let badgeStyle = 'background: #fef3c7; color: #d97706;';

        // Kiểm tra status - hỗ trợ cả tiếng Anh và tiếng Việt
        if (form.status === 'approved' || form.status === 'APPROVED' || form.status === 'Đã duyệt') {
          statusText = 'Đã duyệt';
          badgeStyle = 'background: #d1fae5; color: #059669;';
        } else if (form.status === 'rejected' || form.status === 'REJECTED' || form.status === 'Từ chối') {
          statusText = 'Từ chối';
          badgeStyle = 'background: #fee2e2; color: #ef4444;';
        }

        return `
          <div class="history-item-row" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 12px;">
            <div>
              <h4 style="margin: 0 0 4px 0; font-size: 16px; color: #1f2937; font-weight: 700;">${petName}</h4>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">Đăng ký ngày: ${formattedDate}</p>
            </div>
            <span class="status-badge" style="padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; ${badgeStyle}">${statusText}</span>
          </div>
        `;
      }).join('');
    }
  }

  // --- ĐỒNG BỘ CHỈ SỐ THÀNH TÍCH BÊN CỘT PHẢI ---
  if (document.getElementById("statFavorites")) document.getElementById("statFavorites").textContent = favorites.length;
  if (document.getElementById("statApplications")) document.getElementById("statApplications").textContent = applications.length;
  if (document.getElementById("statApproved")) {
    const approvedCount = applications.filter(a => 
      a.status === 'approved' || a.status === 'APPROVED' || a.status === 'Đã duyệt'
    ).length;
    document.getElementById("statApproved").textContent = approvedCount;
  }
}

/**
 * HÀM XỬ LÝ CLICK BỎ LƯU - XOÁ TRỰC TIẾP KHÔNG CẦN F5 TRANG
 */
function profileRemoveFavorite(petId) {
  let favorites = getUserFavorites();
  petId = String(petId);

  // Xóa ID thú cưng khỏi danh sách mảng dữ liệu
  favorites = favorites.filter(id => id !== petId);
  setUserFavorites(favorites);

  showToast("Đã xóa khỏi danh sách yêu thích!");

  // Thực hiện hiệu ứng xoá bỏ phần tử HTML ra khỏi DOM ngay tức thì
  const targetRow = document.getElementById(`profile-fav-${petId}`);
  if (targetRow) {
    targetRow.style.opacity = "0";
    targetRow.style.transform = "scale(0.9)";
    targetRow.style.maxHeight = "0px";
    targetRow.style.padding = "0px";
    targetRow.style.margin = "0px";
    targetRow.style.border = "none";
    targetRow.style.overflow = "hidden";

    setTimeout(() => {
      targetRow.remove();
      // Nếu hết thú cưng yêu thích thì hiện thông báo trống
      const favContainer = document.getElementById("profileFavoritesList");
      if (favContainer && favContainer.querySelectorAll(".favorite-item-row").length === 0) {
        favContainer.innerHTML = `<p style="color: #6b7280; font-style: italic; padding: 12px 0;">Danh sách yêu thích trống. Hãy nhấn "Lưu" ở ngoài trang Thú cưng!</p>`;
      }
      // Cập nhật lại số lượng ở bảng Thành tích bên phải
      if (document.getElementById("statFavorites")) document.getElementById("statFavorites").textContent = favorites.length;
    }, 300);
  } else {
    renderProfilePage();
  }
}

// Khai báo tên hàm dự phòng trùng khớp với thẻ HTML cũ của bạn
function localUnfavorite(petId) {
  profileRemoveFavorite(petId);
}

// ============================================
// 9. AUTHENTICATION (ĐĂNG NHẬP / ĐĂNG KÝ)
// ============================================

function buildAuthMarkup() {
  return `
    <div id="authModal" class="auth-modal" aria-hidden="true">
      <div class="auth-modal__overlay"></div>
      <div class="auth-modal__dialog">
        <button id="authModalClose" class="auth-modal__close" type="button">×</button>
        <div class="auth-modal__header">
          <h3 id="authModalTitle">Đăng nhập</h3>
          <p id="authModalSubtitle">Đăng nhập để lưu thú cưng và gửi hồ sơ nhận nuôi.</p>
        </div>

        <div class="auth-modal__tabs">
          <button class="auth-tab active" data-mode="login" type="button">Đăng nhập</button>
          <button class="auth-tab" data-mode="register" type="button">Đăng ký</button>
        </div>

        <form id="authForm" class="auth-form">
          <input id="authUsername" name="username" type="text" placeholder="Tên đăng nhập" required>
          <input id="authEmail" name="email" type="email" placeholder="Email" class="auth-field--register" style="display: none;">
          <input id="authPassword" name="password" type="password" placeholder="Mật khẩu" required>
          <input id="authConfirmPassword" name="confirmPassword" type="password" placeholder="Xác nhận mật khẩu" class="auth-field--register" style="display: none;">
          <button class="btn btn-primary auth-submit-btn" type="submit">Đăng nhập</button>
        </form>

        <p id="authMessage" class="auth-message"></p>
      </div>
    </div>
  `;
}

function initAuthSystem() {
  if (document.getElementById('authModal')) {
    return;
  }

  document.body.insertAdjacentHTML('beforeend', buildAuthMarkup());

  let authButton = document.getElementById('authNavbarBtn');
  if (!authButton) {
    const navWrapper = document.querySelector('.nav-wrapper');
    authButton = document.createElement('button');
    authButton.id = 'authNavbarBtn';
    authButton.type = 'button';
    authButton.className = 'btn btn-primary auth-navbar-btn';
    authButton.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Đăng nhập';

    if (navWrapper) {
      navWrapper.appendChild(authButton);
    } else {
      document.body.appendChild(authButton);
    }
  }

  const authModal = document.getElementById('authModal');
  const authClose = document.getElementById('authModalClose');
  const authOverlay = authModal?.querySelector('.auth-modal__overlay');
  const authTabs = document.querySelectorAll('.auth-tab');
  const authForm = document.getElementById('authForm');
  const authMessage = document.getElementById('authMessage');
  const title = document.getElementById('authModalTitle');
  const subtitle = document.getElementById('authModalSubtitle');
  const submitButton = authForm?.querySelector('.auth-submit-btn');
  const usernameInput = document.getElementById('authUsername');
  const emailInput = document.getElementById('authEmail');
  const passwordInput = document.getElementById('authPassword');
  const confirmInput = document.getElementById('authConfirmPassword');

  authButton?.addEventListener('click', () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      handleLogout();
    } else {
      openAuthModal();
    }
  });

  authClose?.addEventListener('click', closeAuthModal);
  authOverlay?.addEventListener('click', closeAuthModal);

  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.mode;
      authTabs.forEach(item => item.classList.toggle('active', item === tab));
      const isRegister = mode === 'register';
      document.querySelectorAll('.auth-field--register').forEach(field => {
        field.style.display = isRegister ? 'block' : 'none';
      });
      title.textContent = isRegister ? 'Đăng ký' : 'Đăng nhập';
      subtitle.textContent = isRegister
        ? 'Tạo tài khoản để lưu thú cưng riêng cho bạn.'
        : 'Đăng nhập để lưu thú cưng và gửi hồ sơ nhận nuôi.';
      submitButton.textContent = isRegister ? 'Đăng ký' : 'Đăng nhập';
      authMessage.textContent = '';
      usernameInput.value = '';
      emailInput.value = '';
      passwordInput.value = '';
      confirmInput.value = '';
    });
  });

  authForm?.addEventListener('submit', handleAuthSubmit);
  updateAuthButton();
}

function openAuthModal(message = '') {
  const modal = document.getElementById('authModal');
  const authMessage = document.getElementById('authMessage');
  if (modal) {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
  }
  if (authMessage) {
    authMessage.textContent = message;
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }
}

function showAuthRequired(actionType = 'general', petId = null) {
  pendingAuthAction = { type: actionType, petId: petId ? String(petId) : null };
  openAuthModal('Bạn cần đăng nhập để thực hiện chức năng này. Nếu chưa có tài khoản, hãy chọn Đăng ký.');
}

function handleAuthSubmit(event) {
  event.preventDefault();

  const currentMode = document.querySelector('.auth-tab.active')?.dataset.mode || 'login';
  const username = document.getElementById('authUsername')?.value.trim();
  const email = document.getElementById('authEmail')?.value.trim();
  const password = document.getElementById('authPassword')?.value;
  const confirmPassword = document.getElementById('authConfirmPassword')?.value;
  const authMessage = document.getElementById('authMessage');

  if (!username || !password) {
    if (authMessage) authMessage.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.';
    return;
  }

  const users = storage.get(AUTH_USERS_KEY) || [];

  if (currentMode === 'register') {
    if (!email || !confirmPassword) {
      if (authMessage) authMessage.textContent = 'Vui lòng nhập email và xác nhận mật khẩu.';
      return;
    }

    if (password.length < 4) {
      if (authMessage) authMessage.textContent = 'Mật khẩu phải có ít nhất 4 ký tự.';
      return;
    }

    if (password !== confirmPassword) {
      if (authMessage) authMessage.textContent = 'Mật khẩu xác nhận không khớp.';
      return;
    }

    const existingUser = users.find(user => user.username === username || user.email === email);
    if (existingUser) {
      if (authMessage) authMessage.textContent = 'Tên đăng nhập hoặc email đã tồn tại.';
      return;
    }

    const newUser = {
      id: 'user_' + Date.now(),
      username,
      email,
      password
    };

    users.push(newUser);
    storage.set(AUTH_USERS_KEY, users);
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(newUser));
    showToast('Đăng ký thành công!');
    closeAuthModal();
    updateAuthButton();
    handlePendingAuthAction();
    window.location.reload();
    return;
  }

  const foundUser = users.find(user => (user.username === username || user.email === username) && user.password === password);
  if (!foundUser) {
    if (authMessage) authMessage.textContent = 'Tài khoản hoặc mật khẩu không đúng.';
    return;
  }

  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(foundUser));
  showToast(`Đăng nhập thành công, xin chào ${foundUser.username}!`);
  closeAuthModal();
  updateAuthButton();
  handlePendingAuthAction();
  window.location.reload();
}

function handlePendingAuthAction() {
  if (!pendingAuthAction) return;

  const { type, petId } = pendingAuthAction;
  pendingAuthAction = null;

  if (type === 'adoption') {
    goToAdoptionForm(petId);
  } else if (type === 'favorite') {
    toggleFavorite(petId);
  }
}

function updateAuthButton() {
  const button = document.getElementById('authNavbarBtn');
  const currentUser = getCurrentUser();
  if (!button) return;

  if (currentUser) {
    button.textContent = `👋 ${currentUser.username}`;
    button.classList.add('is-logged-in');
  } else {
    button.textContent = '🔐 Đăng nhập';
    button.classList.remove('is-logged-in');
  }
}

function handleLogout() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  updateAuthButton();
  showToast('Đã đăng xuất');
  setTimeout(() => window.location.reload(), 300);
}

function openAdminModal() {
  const modal = document.getElementById('adminModal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function closeAdminModal() {
  const modal = document.getElementById('adminModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}

function handleAdminLogin(e) {
  if (e) e.preventDefault();

  const username = document.getElementById('adminUsername')?.value;
  if (username === 'admin') {
    localStorage.setItem('adminLogged', 'true');
    window.location.href = 'admin.html';
  } else {
    showToast('Sai tài khoản hoặc mật khẩu', 'error');
  }
}

function checkAdminLogin() {
  if (localStorage.getItem('adminLogged') !== 'true') {
    window.location.href = 'index.html';
  }
}

function adminLogout() {
  localStorage.removeItem('adminLogged');
  window.location.href = 'index.html';
}

// ============================================
// 10. PROFILE & UTILS
// ============================================

function openEditProfile() {
  const modal = document.getElementById('editProfileModal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }
}

function loadThemePreference() {
  const theme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const toggle = document.getElementById('darkModeToggle');
  if (toggle) toggle.checked = theme === 'dark';
}

// ============================================
// 11. EVENT LISTENERS SETUP
// ============================================

function setupFilterListeners() {
  const filterInputs = ['searchInput', 'speciesFilter', 'genderFilter', 'ageFilter', 'sortFilter'];
  filterInputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      if (id === 'searchInput') {
        element.addEventListener('input', debounce(filterPets, 300));
      } else {
        element.addEventListener('change', filterPets);
      }
    }
  });
}

function setupModalCloseButtons() {
  // Nút X (đóng modal)
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    });
  });

  // Bấm ra bên ngoài (overlay) để đóng
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
      }
    });
  });
}

function setupAdminModalEvents() {
  const adminTrigger = document.getElementById('openAdminModal');
  if (adminTrigger) {
    adminTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      openAdminModal();
    });
  }

  const adminForm = document.getElementById('adminLoginForm');
  if (adminForm) {
    adminForm.addEventListener('submit', handleAdminLogin);
  }
}

// ============================================
// 12. APP INITIALIZATION (TRÁI TIM CỦA ỨNG DỤNG - ĐÃ FIX LỖI MẤT DỮ LIỆU)
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Tải giao diện màu (Sáng / Tối)
  loadThemePreference();

  // 2. Khởi tạo hệ thống đăng nhập / đăng ký
  initAuthSystem();

  // 3. Cài đặt các sự kiện cho Modal
  setupModalCloseButtons();
  setupAdminModalEvents();

  // 4. QUAN TRỌNG: Gọi API lấy dữ liệu và chờ tải xong mới làm bước tiếp theo
  await fetchPets(); 

  // 5. Khởi chạy các hàm render tùy thuộc vào việc người dùng đang ở trang HTML nào
  
  // ---> Đang ở trang Thú cưng (pets.html)
  if (document.getElementById('petsContainer')) {
    renderPaginatedPets();
    setupPetsGridEventDelegation();  // ✅ Gán Event Delegation cho pet cards
    setupFilterListeners();
  }

  // ---> Đang ở Trang chủ (index.html)
  if (document.getElementById('homePets')) {
    renderHomePets();
    setupHomeEventDelegation();  // ✅ Gán Event Delegation cho home pet cards
  }

  // ---> Đang ở trang Hồ sơ cá nhân (profile.html)
  if (document.getElementById('profileFavoritesList') || document.getElementById('profileHistoryList')) {
    // Refresh adoption data từ MockAPI trước khi render
    refreshUserAdoptionsFromAPI();
    renderProfilePage();
  }

  // ---> Đang ở trang Lịch sử nhận nuôi (history.html)
  if (document.querySelector('.history-grid')) {
    renderAdoptionHistory();
  }

  // ---> Đang ở trang Form điền đơn nhận nuôi (adoption.html)
  if (document.getElementById('adoptionForm')) {
    loadSelectedPetInfo();
    initFormSteps();
  }
  
});