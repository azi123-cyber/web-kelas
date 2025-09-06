document.addEventListener('DOMContentLoaded', () => {
    
    // === KONFIGURASI & DATA ===
    const SECRET_CODE = "KELASXDKEREN"; // Ganti kode rahasia ini sesuai keinginan
    const TASK_STORAGE_KEY = 'webKelasTasks_v3'; 
    const PROFILE_STORAGE_KEY = 'webKelasProfiles_v1'; // Kunci untuk data profil

    // === Fungsi Memuat Data ===
    const loadTasks = () => {
        const tasksJSON = localStorage.getItem(TASK_STORAGE_KEY);
        if (!tasksJSON) {
            return [
                { id: 1, judul: "Matematika", deskripsi: "Kerjakan LKS halaman 30-35 tentang integral.", deadline: getTodayDateString() },
                { id: 2, judul: "Sejarah", deskripsi: "Presentasi kelompok G30S/PKI.", deadline: getFutureDateString(5) }
            ];
        }
        return JSON.parse(tasksJSON);
    };

    const loadProfiles = () => {
        const profilesJSON = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (!profilesJSON) {
            // Data profil default jika localStorage kosong
            const defaultProfiles = {
                waliKelas: { id: 'wk', nama: 'Sulistyowati, S.Pd.', peran: 'Wali Kelas', foto: '', wa: '' },
                siswa: Array.from({ length: 36 }, (_, i) => ({ 
                    id: `siswa-${i + 1}`, 
                    nama: `Siswa ${i + 1}`, 
                    peran: 'Anggota Kelas', 
                    foto: '', 
                    wa: '' 
                }))
            };
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(defaultProfiles));
            return defaultProfiles;
        }
        return JSON.parse(profilesJSON);
    };

    // === Fungsi Menyimpan Data ===
    const saveTasks = () => {
        localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
    };

    const saveProfiles = () => {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
    };

    // === Fungsi Helper Tanggal ===
    const formatDate = (date) => date.toISOString().split('T')[0];
    const getTodayDateString = () => formatDate(new Date());
    const getFutureDateString = (days) => {
        const date = new Date(); // <--- INI BAGIAN YANG DIPERBAIKI
        date.setDate(date.getDate() + days);
        return formatDate(date);
    };

    let tasks = loadTasks();
    let profiles = loadProfiles();

    // === Selektor Elemen DOM ===
    const pageSections = document.querySelectorAll('.page-section');
    const navButtons = document.querySelectorAll('.nav-button');
    const fab = document.getElementById('add-task-button');
    
    // Modal Tugas
    const taskModal = document.getElementById('add-task-modal');
    const closeTaskModalButton = taskModal.querySelector('.close-modal-button');
    const taskForm = document.getElementById('task-form');
    const taskLists = document.querySelectorAll('.task-list');

    // Modal Edit Profil
    const profileModal = document.getElementById('edit-profile-modal');
    const closeProfileModalButton = profileModal.querySelector('.close-modal-button');
    const profileForm = document.getElementById('edit-profile-form');
    const profileList = document.getElementById('profil-list');
    
    // === Fungsi Render Utama ===
    const renderTasks = () => {
        const lists = {
            today: document.getElementById('hari-ini-list'),
            future: document.getElementById('mingdep-list'),
            past: document.getElementById('riwayat-list'),
        };
        Object.values(lists).forEach(list => list.innerHTML = '');

        const today = new Date(getTodayDateString());
        tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        if (tasks.length === 0) {
            lists.today.innerHTML = '<p style="text-align:center; color: var(--text-secondary);">Belum ada tugas. Waktunya bersantai! 🎉</p>';
        }

        tasks.forEach(task => {
            const deadlineDate = new Date(task.deadline);
            const isExpired = deadlineDate < today;
            const isToday = deadlineDate.getTime() === today.getTime();
            
            const taskCardHTML = `
                <div class="task-card" id="task-${task.id}">
                    <h3>${task.judul}</h3>
                    <p>${task.deskripsi}</p>
                    <div class="task-footer">
                        <span>Batas Waktu:</span>
                        <span class="task-deadline ${isExpired ? 'expired' : ''}">${task.deadline}</span>
                    </div>
                    <button class="delete-task-btn" data-id="${task.id}" title="Hapus Tugas">&times;</button>
                </div>`;
            
            if (isExpired) lists.past.innerHTML += taskCardHTML;
            else if (isToday) lists.today.innerHTML += taskCardHTML;
            else lists.future.innerHTML += taskCardHTML;
        });
    };
    
    const renderProfiles = () => {
        profileList.innerHTML = '';
        const placeholderAvatar = 'https://api.dicebear.com/8.x/initials/svg?seed=';
        
        // Render Wali Kelas
        const wk = profiles.waliKelas;
        let profileCardHTML = `
            <div class="profile-card wali-kelas" data-id="${wk.id}">
                <img src="${wk.foto || `${placeholderAvatar}${encodeURIComponent(wk.nama)}`}" alt="Foto ${wk.nama}">
                <h2>${wk.nama}</h2>
                <p>${wk.peran}</p>
                ${wk.wa ? `<a href="https://wa.me/${wk.wa}" target="_blank" class="wa-link">WhatsApp</a>` : ''}
                <button class="edit-profile-btn" data-id="${wk.id}" title="Edit Profil">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87M3,17.25V21H6.75L17.81,9.94L14.06,6.19L3,17.25Z"></path></svg>
                </button>
            </div>`;

        // Render Siswa
        profiles.siswa.forEach(siswa => {
            profileCardHTML += `
                <div class="profile-card" data-id="${siswa.id}">
                    <img src="${siswa.foto || `${placeholderAvatar}${encodeURIComponent(siswa.nama)}`}" alt="Foto ${siswa.nama}">
                    <h2>${siswa.nama}</h2>
                    <p>${siswa.peran}</p>
                     ${siswa.wa ? `<a href="https://wa.me/${siswa.wa}" target="_blank" class="wa-link">WhatsApp</a>` : ''}
                    <button class="edit-profile-btn" data-id="${siswa.id}" title="Edit Profil">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87M3,17.25V21H6.75L17.81,9.94L14.06,6.19L3,17.25Z"></path></svg>
                    </button>
                </div>`;
        });
        profileList.innerHTML = profileCardHTML;
    };

    // === Logika Aksi (Tambah & Hapus Tugas) ===
    const handleAddTask = (e) => {
        e.preventDefault();
        const code = prompt("Masukkan kode rahasia untuk menambah tugas:");
        if (code !== SECRET_CODE) {
            alert("Kode rahasia salah! Aksi dibatalkan.");
            return;
        }

        tasks.push({
            id: Date.now(),
            judul: document.getElementById('task-title').value,
            deskripsi: document.getElementById('task-desc').value,
            deadline: document.getElementById('task-deadline').value,
        });
        saveTasks();
        renderTasks();
        taskForm.reset();
        toggleModal(taskModal, false);
    };

    const handleDeleteTask = (taskId) => {
        const code = prompt("Masukkan kode rahasia untuk menghapus tugas:");
        if (code !== SECRET_CODE) {
            alert("Kode rahasia salah! Aksi dibatalkan.");
            return;
        }

        if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
            const taskCard = document.getElementById(`task-${taskId}`);
            taskCard.classList.add('deleting');
            
            setTimeout(() => {
                tasks = tasks.filter(task => task.id != taskId);
                saveTasks();
                renderTasks();
            }, 400);
        }
    };

    // === Logika Aksi (Edit Profil) ===
    const openProfileEditor = (profileId) => {
        let profileData;
        if (profileId === 'wk') {
            profileData = profiles.waliKelas;
        } else {
            profileData = profiles.siswa.find(s => s.id == profileId);
        }

        if (profileData) {
            document.getElementById('edit-profile-id').value = profileData.id;
            document.getElementById('edit-profile-nama').value = profileData.nama;
            document.getElementById('edit-profile-peran').value = profileData.peran;
            document.getElementById('edit-profile-wa').value = profileData.wa;
            document.getElementById('edit-profile-foto').value = profileData.foto;
            toggleModal(profileModal, true);
        }
    };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        const code = prompt("Masukkan kode rahasia untuk menyimpan perubahan:");
        if (code !== SECRET_CODE) {
            alert("Kode rahasia salah! Aksi dibatalkan.");
            return;
        }

        const profileId = document.getElementById('edit-profile-id').value;
        const updatedData = {
            nama: document.getElementById('edit-profile-nama').value,
            peran: document.getElementById('edit-profile-peran').value,
            wa: document.getElementById('edit-profile-wa').value,
            foto: document.getElementById('edit-profile-foto').value,
        };

        if (profileId === 'wk') {
            profiles.waliKelas = { ...profiles.waliKelas, ...updatedData };
        } else {
            const siswaIndex = profiles.siswa.findIndex(s => s.id == profileId);
            if (siswaIndex > -1) {
                profiles.siswa[siswaIndex] = { ...profiles.siswa[siswaIndex], ...updatedData };
            }
        }

        saveProfiles();
        renderProfiles();
        toggleModal(profileModal, false);
    };

    // === Event Listeners ===
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPageId = button.dataset.page;
            
            pageSections.forEach(section => {
                section.classList.toggle('active', section.id === targetPageId);
            });
            
            navButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.page === targetPageId);
            });
        });
    });
    
    taskLists.forEach(list => {
        list.addEventListener('click', (e) => {
            const deleteButton = e.target.closest('.delete-task-btn');
            if (deleteButton) {
                handleDeleteTask(deleteButton.dataset.id);
            }
        });
    });

    profileList.addEventListener('click', (e) => {
        const editButton = e.target.closest('.edit-profile-btn');
        if (editButton) {
            openProfileEditor(editButton.dataset.id);
        }
    });

    const toggleModal = (modalElement, show) => {
        modalElement.classList.toggle('visible', show);
    };
    
    fab.addEventListener('click', () => toggleModal(taskModal, true));
    closeTaskModalButton.addEventListener('click', () => toggleModal(taskModal, false));
    taskModal.addEventListener('click', (e) => { if (e.target === taskModal) toggleModal(taskModal, false); });
    taskForm.addEventListener('submit', handleAddTask);

    closeProfileModalButton.addEventListener('click', () => toggleModal(profileModal, false));
    profileModal.addEventListener('click', (e) => { if (e.target === profileModal) toggleModal(profileModal, false); });
    profileForm.addEventListener('submit', handleUpdateProfile);
    
    // === Panggilan Fungsi Inisialisasi ===
    renderTasks();
    renderProfiles();
});