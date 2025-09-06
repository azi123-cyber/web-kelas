document.addEventListener('DOMContentLoaded', () => {
    
    // === KONFIGURASI & DATA ===
    const SECRET_CODE = "KELASXDKEREN";
    const dbRef = database.ref('/'); // Referensi utama ke database Firebase

    let tasks = [];
    let profiles = {};

    // === [BARU] Fungsi untuk memuat data dari Firebase & memantau perubahan ===
    const listenToDataChanges = () => {
        dbRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Jika ada data di Firebase, gunakan itu
                tasks = data.tasks ? Object.values(data.tasks) : []; // Firebase object to array
                profiles = data.profiles || getDefaultProfiles();
            } else {
                // Jika database kosong, isi dengan data default
                const defaultData = {
                    tasks: getDefaultTasks(),
                    profiles: getDefaultProfiles()
                };
                dbRef.set(defaultData); // Simpan data default ke Firebase
            }
            // Render ulang setiap kali ada perubahan data
            renderAll();
        });
    };
    
    const renderAll = () => {
        renderTasks();
        renderProfiles();
    }

    // === [BARU] Fungsi untuk menyimpan data ke Firebase ===
    const saveDataToFirebase = () => {
        // Mengubah array menjadi object untuk kompatibilitas Firebase yang lebih baik
        const tasksObject = tasks.reduce((obj, task) => {
            obj[task.id] = task;
            return obj;
        }, {});
        
        database.ref('/').set({
            tasks: tasksObject,
            profiles: profiles
        });
    };

    // Data default jika database kosong
    const getDefaultTasks = () => ([
        { id: 1, judul: "Matematika", deskripsi: "Kerjakan LKS halaman 30-35 tentang integral.", deadline: getTodayDateString() },
        { id: 2, judul: "Sejarah", deskripsi: "Presentasi kelompok G30S/PKI.", deadline: getFutureDateString(5) }
    ]);

    const getDefaultProfiles = () => ({
        waliKelas: { id: 'wk', nama: 'Sulistyowati, S.Pd.', peran: 'Wali Kelas', foto: '', wa: '' },
        siswa: Array.from({ length: 36 }, (_, i) => ({ id: `siswa-${i + 1}`, nama: `Siswa ${i + 1}`, peran: 'Anggota Kelas', foto: '', wa: '' }))
    });

    // === Selektor Elemen DOM (Tidak banyak berubah) ===
    const pageSections = document.querySelectorAll('.page-section');
    const navButtons = document.querySelectorAll('.nav-button');
    const fab = document.getElementById('add-task-button');
    const taskModal = document.getElementById('add-task-modal');
    const closeTaskModalButton = taskModal.querySelector('.close-modal-button');
    const taskForm = document.getElementById('task-form');
    const taskLists = document.querySelectorAll('.task-list');
    const profileModal = document.getElementById('edit-profile-modal');
    const closeProfileModalButton = profileModal.querySelector('.close-modal-button');
    const profileForm = document.getElementById('edit-profile-form');
    const profileList = document.getElementById('profil-list');

    // === Fungsi Helper Tanggal (Tidak berubah) ===
    const formatDate = (date) => date.toISOString().split('T')[0];
    const getTodayDateString = () => formatDate(new Date());
    const getFutureDateString = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return formatDate(date);
    };
    
    // === Fungsi Render (Tidak ada perubahan logika, hanya dipanggil) ===
    const renderTasks = () => {
        const lists = { today: document.getElementById('hari-ini-list'), future: document.getElementById('mingdep-list'), past: document.getElementById('riwayat-list') };
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
            const taskCardHTML = `<div class="task-card" id="task-${task.id}"><h3>${task.judul}</h3><p>${task.deskripsi}</p><div class="task-footer"><span>Batas Waktu:</span><span class="task-deadline ${isExpired ? 'expired' : ''}">${task.deadline}</span></div><button class="delete-task-btn" data-id="${task.id}" title="Hapus Tugas">&times;</button></div>`;
            if (isExpired) lists.past.innerHTML += taskCardHTML;
            else if (isToday) lists.today.innerHTML += taskCardHTML;
            else lists.future.innerHTML += taskCardHTML;
        });
    };
    
    const renderProfiles = () => {
        if (!profiles.waliKelas) return; // Guard clause jika profil belum termuat
        profileList.innerHTML = '';
        const placeholderAvatar = 'https://api.dicebear.com/8.x/initials/svg?seed=';
        const wk = profiles.waliKelas;
        let profileCardHTML = `<div class="profile-card wali-kelas" data-id="${wk.id}"><img src="${wk.foto || `${placeholderAvatar}${encodeURIComponent(wk.nama)}`}" alt="Foto ${wk.nama}"><h2>${wk.nama}</h2><p>${wk.peran}</p>${wk.wa ? `<a href="https://wa.me/${wk.wa}" target="_blank" class="wa-link">WhatsApp</a>` : ''}<button class="edit-profile-btn" data-id="${wk.id}" title="Edit Profil"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87M3,17.25V21H6.75L17.81,9.94L14.06,6.19L3,17.25Z"></path></svg></button></div>`;
        profiles.siswa.forEach(siswa => {
            profileCardHTML += `<div class="profile-card" data-id="${siswa.id}"><img src="${siswa.foto || `${placeholderAvatar}${encodeURIComponent(siswa.nama)}`}" alt="Foto ${siswa.nama}"><h2>${siswa.nama}</h2><p>${siswa.peran}</p>${siswa.wa ? `<a href="https://wa.me/${siswa.wa}" target="_blank" class="wa-link">WhatsApp</a>` : ''}<button class="edit-profile-btn" data-id="${siswa.id}" title="Edit Profil"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87M3,17.25V21H6.75L17.81,9.94L14.06,6.19L3,17.25Z"></path></svg></button></div>`;
        });
        profileList.innerHTML = profileCardHTML;
    };

    // === Logika Aksi (Diubah untuk menyimpan ke Firebase) ===
    const handleAddTask = (e) => {
        e.preventDefault();
        const code = prompt("Masukkan kode rahasia untuk menambah tugas:");
        if (code !== SECRET_CODE) { alert("Kode rahasia salah! Aksi dibatalkan."); return; }
        tasks.push({ id: Date.now(), judul: document.getElementById('task-title').value, deskripsi: document.getElementById('task-desc').value, deadline: document.getElementById('task-deadline').value });
        saveDataToFirebase(); // Simpan ke Firebase
        taskForm.reset();
        toggleModal(taskModal, false);
    };

    const handleDeleteTask = (taskId) => {
        const code = prompt("Masukkan kode rahasia untuk menghapus tugas:");
        if (code !== SECRET_CODE) { alert("Kode rahasia salah! Aksi dibatalkan."); return; }
        if (confirm("Apakah Anda yakin ingin menghapus tugas ini?")) {
            const taskCard = document.getElementById(`task-${taskId}`);
            if(taskCard) taskCard.classList.add('deleting');
            setTimeout(() => {
                tasks = tasks.filter(task => task.id != taskId);
                saveDataToFirebase(); // Simpan ke Firebase
            }, 400);
        }
    };
    
    const openProfileEditor = (profileId) => { /* ... (fungsi ini tidak berubah) ... */ };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        const code = prompt("Masukkan kode rahasia untuk menyimpan perubahan:");
        if (code !== SECRET_CODE) { alert("Kode rahasia salah! Aksi dibatalkan."); return; }
        const profileId = document.getElementById('edit-profile-id').value;
        const updatedData = { nama: document.getElementById('edit-profile-nama').value, peran: document.getElementById('edit-profile-peran').value, wa: document.getElementById('edit-profile-wa').value, foto: document.getElementById('edit-profile-foto').value };
        if (profileId === 'wk') {
            profiles.waliKelas = { ...profiles.waliKelas, ...updatedData };
        } else {
            const siswaIndex = profiles.siswa.findIndex(s => s.id == profileId);
            if (siswaIndex > -1) { profiles.siswa[siswaIndex] = { ...profiles.siswa[siswaIndex], ...updatedData }; }
        }
        saveDataToFirebase(); // Simpan ke Firebase
        toggleModal(profileModal, false);
    };

    // === Event Listeners (Tidak ada perubahan) ===
    navButtons.forEach(button => { /*...*/ });
    taskLists.forEach(list => { /*...*/ });
    profileList.addEventListener('click', (e) => { /*...*/ });
    // ... semua event listener lainnya tetap sama ...
    
    // === Panggilan Fungsi Inisialisasi ===
    listenToDataChanges(); // Mulai memantau perubahan dari Firebase
});

// NOTE: Beberapa fungsi dan event listener yang tidak berubah saya singkat (/*...*/)
// agar lebih ringkas, tapi di file Anda biarkan seperti kode sebelumnya.