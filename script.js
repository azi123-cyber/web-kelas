document.addEventListener('DOMContentLoaded', () => {
    if (typeof database === 'undefined') {
        console.error("Firebase belum terinisialisasi! Periksa script di index.html.");
        alert("Koneksi ke database gagal! Cek konsol untuk error.");
        return;
    }

    const SECRET_CODE = "KELASXDKEREN";
    const dbRef = database.ref('/');

    let tasks = [];
    let profiles = {};

    const listenToDataChanges = () => {
        dbRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                tasks = data.tasks ? Object.values(data.tasks) : [];
                profiles = data.profiles || getDefaultProfiles();
            } else {
                const defaultData = {
                    tasks: getDefaultTasks(),
                    profiles: getDefaultProfiles()
                };
                dbRef.set(defaultData);
            }
            renderAll();
        }, (error) => {
            console.error("Gagal membaca data dari Firebase:", error);
            alert("Tidak dapat terhubung ke database. Periksa koneksi internet dan konfigurasi Firebase Anda.");
        });
    };

    const renderAll = () => {
        renderTasks();
        renderProfiles();
    };

    // ✅ gunakan update() agar data tidak hilang saat refresh
    const saveDataToFirebase = () => {
        const tasksObject = tasks.reduce((obj, task) => {
            obj[task.id] = task;
            return obj;
        }, {});
        database.ref('/').update({
            tasks: tasksObject,
            profiles: profiles
        });
    };

    const getDefaultTasks = () => ([
        { id: Date.now() + 1, judul: "Matematika", deskripsi: "Kerjakan LKS halaman 30-35 tentang integral.", deadline: getTodayDateString() },
        { id: Date.now() + 2, judul: "Sejarah", deskripsi: "Presentasi kelompok G30S/PKI.", deadline: getFutureDateString(5) }
    ]);

    const getDefaultProfiles = () => ({
        waliKelas: { id: 'wk', nama: 'Sulistyowati, S.Pd.', peran: 'Wali Kelas', foto: '', wa: '' },
        siswa: Array.from({ length: 36 }, (_, i) => ({
            id: `siswa-${i + 1}`, nama: `Siswa ${i + 1}`, peran: 'Anggota Kelas', foto: '', wa: ''
        }))
    });

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

    const formatDate = (date) => date.toISOString().split('T')[0];
    const getTodayDateString = () => formatDate(new Date());
    const getFutureDateString = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return formatDate(date);
    };

    // ✅ perbandingan tanggal tanpa jam
    const sameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    const renderTasks = () => {
        const lists = {
            today: document.getElementById('hari-ini-list'),
            future: document.getElementById('mingdep-list'),
            past: document.getElementById('riwayat-list')
        };
        Object.values(lists).forEach(list => list.innerHTML = '');
        const today = new Date(getTodayDateString());
        if (!tasks) tasks = [];
        tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

        if (tasks.length === 0) {
            lists.today.innerHTML =
                '<p style="text-align:center; color: var(--text-secondary);">Belum ada tugas. Waktunya bersantai! 🎉</p>';
        }

        tasks.forEach(task => {
            const deadlineDate = new Date(task.deadline);
            const isExpired = deadlineDate < today && !sameDay(deadlineDate, today);
            const isToday = sameDay(deadlineDate, today);

            let taskCardHTML = `
              <div class="task-card" id="task-${task.id}">
                <h3>${task.judul}</h3>
                <p>${task.deskripsi}</p>
                <div class="task-footer">
                  <span>Batas Waktu:</span>
                  <span class="task-deadline ${isExpired ? 'expired' : ''}">${task.deadline}</span>
                </div>
                <button class="delete-task-btn" data-id="${task.id}" title="Hapus Tugas">&times;</button>
              </div>`;

            if (isExpired) {
                lists.past.innerHTML += taskCardHTML;
            } else if (isToday) {
                lists.today.innerHTML += taskCardHTML;
            } else {
                // ✅ tampilkan hari tertentu
                const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
                const dayLabel = deadlineDate.toLocaleDateString('id-ID', options);
                lists.future.innerHTML += `
                  <div class="task-card" id="task-${task.id}">
                    <h3>${task.judul}</h3>
                    <p>${task.deskripsi}</p>
                    <div class="task-footer">
                      <span>${dayLabel}</span>
                      <span class="task-deadline">${task.deadline}</span>
                    </div>
                    <button class="delete-task-btn" data-id="${task.id}" title="Hapus Tugas">&times;</button>
                  </div>`;
            }
        });
    };

    const renderProfiles = () => {
        if (!profiles || !profiles.waliKelas) return;
        profileList.innerHTML = '';
        const placeholderAvatar = 'https://api.dicebear.com/8.x/initials/svg?seed=';
        const wk = profiles.waliKelas;

        let profileCardHTML = `
          <div class="profile-card wali-kelas" data-id="${wk.id}">
            <img src="${wk.foto || `${placeholderAvatar}${encodeURIComponent(wk.nama)}`}" alt="Foto ${wk.nama}">
            <h2>${wk.nama}</h2>
            <p>${wk.peran}</p>
            ${wk.wa ? `<a href="https://wa.me/${wk.wa}" target="_blank" class="wa-link">WhatsApp</a>` : ''}
            <button class="edit-profile-btn" data-id="${wk.id}" title="Edit Profil">✎</button>
          </div>`;

        profiles.siswa.forEach(siswa => {
            profileCardHTML += `
              <div class="profile-card" data-id="${siswa.id}">
                <img src="${siswa.foto || `${placeholderAvatar}${encodeURIComponent(siswa.nama)}`}" alt="Foto ${siswa.nama}">
                <h2>${siswa.nama}</h2>
                <p>${siswa.peran}</p>
                ${siswa.wa ? `<a href="https://wa.me/${siswa.wa}" target="_blank" class="wa-link">WhatsApp</a>` : ''}
                <button class="edit-profile-btn" data-id="${siswa.id}" title="Edit Profil">✎</button>
              </div>`;
        });
        profileList.innerHTML = profileCardHTML;
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        const code = prompt("Masukkan kode rahasia untuk menambah tugas:");
        if (code !== SECRET_CODE) {
            alert("Kode rahasia salah! Aksi dibatalkan.");
            return;
        }
        const newTask = {
            id: Date.now(),
            judul: document.getElementById('task-title').value,
            deskripsi: document.getElementById('task-desc').value,
            deadline: document.getElementById('task-deadline').value
        };
        if (!tasks) tasks = [];
        tasks.push(newTask);
        saveDataToFirebase();
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
            if (taskCard) taskCard.classList.add('deleting');
            setTimeout(() => {
                tasks = tasks.filter(task => task.id != taskId);
                saveDataToFirebase();
            }, 400);
        }
    };

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
            foto: document.getElementById('edit-profile-foto').value
        };
        if (profileId === 'wk') {
            profiles.waliKelas = { ...profiles.waliKelas, ...updatedData };
        } else {
            const siswaIndex = profiles.siswa.findIndex(s => s.id == profileId);
            if (siswaIndex > -1) {
                profiles.siswa[siswaIndex] = { ...profiles.siswa[siswaIndex], ...updatedData };
            }
        }
        saveDataToFirebase();
        toggleModal(profileModal, false);
    };

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPageId = button.dataset.page;
            pageSections.forEach(section => section.classList.toggle('active', section.id === targetPageId));
            navButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.page === targetPageId));
        });
    });

    taskLists.forEach(list => {
        list.addEventListener('click', (e) => {
            const btn = e.target.closest('.delete-task-btn');
            if (btn) {
                handleDeleteTask(btn.dataset.id);
            }
        });
    });

    profileList.addEventListener('click', (e) => {
        const btn = e.target.closest('.edit-profile-btn');
        if (btn) {
            openProfileEditor(btn.dataset.id);
        }
    });

    const toggleModal = (modalElement, show) => modalElement.classList.toggle('visible', show);

    fab.addEventListener('click', () => toggleModal(taskModal, true));
    closeTaskModalButton.addEventListener('click', () => toggleModal(taskModal, false));
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) toggleModal(taskModal, false);
    });
    taskForm.addEventListener('submit', handleAddTask);

    closeProfileModalButton.addEventListener('click', () => toggleModal(profileModal, false));
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) toggleModal(profileModal, false);
    });
    profileForm.addEventListener('submit', handleUpdateProfile);

    listenToDataChanges();
});
