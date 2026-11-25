/* =====================================================================
   GenRPM — DATA KURIKULUM
   File ini sengaja dipisah agar mudah disunting tanpa menyentuh logika.
   - Tambah/ubah mata pelajaran, fase, kelas, materi, CP, dan TP di sini.
   - CP, materi, dan buku dari 20 Panduan Mapel Pendidikan Khusus BSKAP 2025
     ada di js/data-panduan.js (dibuat otomatis) dan digabung saat aplikasi dimuat.
   ===================================================================== */

window.GENRPM_DATA = {
  tahunAjaran: ["2025/2026", "2026/2027", "2027/2028", "2028/2029"],

  fase: {
    "Fondasi": { label: "Fase Fondasi (TKLB)", kelas: ["TKLB"], jenjang: "TKLB" },
    "A": { label: "Fase A (Kelas I-II)", kelas: ["I", "II"], jenjang: "SDLB" },
    "B": { label: "Fase B (Kelas III-IV)", kelas: ["III", "IV"], jenjang: "SDLB" },
    "C": { label: "Fase C (Kelas V-VI)", kelas: ["V", "VI"], jenjang: "SDLB" },
    "D": { label: "Fase D (Kelas VII-IX)", kelas: ["VII", "VIII", "IX"], jenjang: "SMPLB" },
    "E": { label: "Fase E (Kelas X)", kelas: ["X"], jenjang: "SMALB" },
    "F": { label: "Fase F (Kelas XI-XII)", kelas: ["XI", "XII"], jenjang: "SMALB" }
  },

  /* Daftar mapel. Mapel yang punya panduan BSKAP (js/data-panduan.js) otomatis
     ditambahkan; daftar di bawah ini untuk mapel lain yang belum ada datanya. */
  mapel: [
    "Pendidikan Agama Islam dan Budi Pekerti",
    "Pendidikan Agama Katolik dan Budi Pekerti",
    "Pendidikan Agama Hindu dan Budi Pekerti",
    "Pendidikan Agama Buddha dan Budi Pekerti",
    "Pendidikan Pancasila",
    "Ilmu Pengetahuan Alam (IPA)",
    "Ilmu Pengetahuan Sosial (IPS)",
    "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
    "Bahasa Inggris",
    "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)"
  ],

  /* Ketunaan: dipakai oleh Draf Otomatis untuk menyesuaikan profil,
     jalur diferensiasi, akomodasi, dan pemanfaatan digital. */
  ketunaan: {
    "Tidak ada (reguler/inklusif umum)": {
      singkat: "reguler/inklusif umum",
      deskripsi: "Peserta didik reguler/inklusif umum dengan kemampuan dan gaya belajar beragam.",
      jalurA: "Murid yang sudah mampu membaca kata/kalimat sederhana dan memahami petunjuk. → Kartu kata + gambar, tugas mengelompokkan dan mengurutkan, serta tantangan menyusun kalimat sebab–akibat sederhana.",
      jalurB: "Murid yang mengandalkan akses konkret/visual. → benda nyata, gambar kontras, dan video pendek, dan teks sangat singkat.",
      komunikasi: "instruksi singkat dan jelas, selalu disertai contoh atau gambar.",
      akomodasi: ["Instruksi dipecah menjadi langkah pendek", "Waktu tambahan bagi murid yang membutuhkan", "Pilihan cara menunjukkan pemahaman (lisan, gambar, tulisan)"],
      digital: ["Video pendek bertakarir", "Gambar/foto berwarna kontras", "Kuis interaktif sederhana (mis. Wordwall/Quizizz)"]
    },
    "Tunanetra": {
      singkat: "tunanetra",
      deskripsi: "Peserta didik dengan hambatan penglihatan (low vision/buta total) yang belajar terutama melalui perabaan dan pendengaran.",
      jalurA: "Murid low vision. → teks cetak besar (huruf ≥ 18 pt), kontras tinggi, kaca pembesar/zoom layar, dan benda nyata.",
      jalurB: "Murid buta total. → benda nyata/model taktil, teks Braille, gambar timbul, dan penjelasan verbal yang deskriptif.",
      komunikasi: "deskripsi verbal yang runtut, sebut nama murid saat memanggil, beri waktu meraba benda sebelum menjelaskan.",
      akomodasi: ["Model/benda taktil dan gambar timbul", "Lembar kerja Braille atau cetak besar", "Penataan kelas tetap dan bebas hambatan", "Asesmen lisan atau Braille"],
      digital: ["Pembaca layar (TalkBack/NVDA)", "Rekaman audio penjelasan materi", "Aplikasi pembesar layar untuk low vision"]
    },
    "Tunarungu": {
      singkat: "tunarungu",
      deskripsi: "Peserta didik dengan hambatan pendengaran yang mengandalkan visual, bahasa isyarat (BISINDO/SIBI), dan membaca ujaran.",
      jalurA: "Murid yang sudah membaca kalimat sederhana. → teks singkat bergambar, kosakata kunci + isyarat, peta konsep visual.",
      jalurB: "Murid yang masih membangun kosakata. → gambar, demonstrasi langsung, kartu isyarat, dan kata kunci tunggal.",
      komunikasi: "hadap murid saat berbicara, gunakan isyarat (BISINDO/SIBI), tulis kata kunci di papan, pastikan cahaya cukup.",
      akomodasi: ["Kosakata kunci dengan isyarat dan gambar", "Posisi duduk di depan menghadap guru", "Instruksi tertulis dan demonstrasi", "Asesmen berbasis gambar/praktik"],
      digital: ["Video bertakarir atau dengan juru bahasa isyarat", "Aplikasi kamus isyarat", "Presentasi visual bergambar"]
    },
    "Tunagrahita (hambatan intelektual)": {
      singkat: "tunagrahita",
      deskripsi: "Peserta didik dengan hambatan intelektual yang membutuhkan materi konkret, bertahap, berulang, dan terkait kehidupan sehari-hari.",
      jalurA: "Murid hambatan intelektual ringan. → benda nyata + kartu kata, tugas mencocokkan dan mengelompokkan sederhana.",
      jalurB: "Murid hambatan intelektual sedang. → benda nyata, bimbingan langsung (modelling–prompting), satu konsep per kegiatan.",
      komunikasi: "kalimat pendek satu perintah, ulangi dengan contoh, beri pujian segera.",
      akomodasi: ["Analisis tugas (langkah kecil)", "Pengulangan dan pembiasaan", "Contoh konkret dari kehidupan sehari-hari", "Asesmen praktik dengan bantuan bertahap"],
      digital: ["Video pendek berulang", "Gambar/foto benda nyata", "Permainan edukatif sederhana"]
    },
    "Tunadaksa": {
      singkat: "tunadaksa",
      deskripsi: "Peserta didik dengan hambatan fisik/motorik yang membutuhkan aksesibilitas gerak dan alat bantu.",
      jalurA: "Murid dengan hambatan motorik ringan. → alat tulis dan alat praktik yang dimodifikasi, waktu tambahan.",
      jalurB: "Murid dengan hambatan motorik berat. → pendamping praktik, jawaban lisan/menunjuk, perangkat bantu.",
      komunikasi: "beri waktu merespons, tawarkan alternatif cara menjawab (menunjuk, lisan, perangkat).",
      akomodasi: ["Meja/kursi dan jalur yang aksesibel", "Alat praktik yang dimodifikasi", "Waktu tambahan", "Asesmen lisan atau menunjuk"],
      digital: ["Tablet/layar sentuh", "Perangkat input alternatif", "Pengetikan suara (voice typing)"]
    },
    "Autis (Gangguan Spektrum Autisme)": {
      singkat: "autis",
      deskripsi: "Peserta didik dengan spektrum autisme yang membutuhkan struktur, jadwal visual, dan lingkungan yang dapat diprediksi.",
      jalurA: "Murid verbal. → jadwal visual, tugas terstruktur, minat khusus murid dijadikan jembatan materi.",
      jalurB: "Murid minim verbal. → kartu PECS/gambar, kegiatan sensorik terarah, pilihan jawaban bergambar.",
      komunikasi: "bahasa literal dan konsisten, jadwal visual, beri tanda transisi sebelum berganti kegiatan.",
      akomodasi: ["Jadwal visual dan aturan kelas bergambar", "Area tenang (calm corner)", "Transisi dengan aba-aba", "Tugas terstruktur (TEACCH)"],
      digital: ["Aplikasi jadwal visual", "Video modelling", "Aplikasi komunikasi berbasis gambar (AAC)"]
    },
    "ADHD / Hambatan Pemusatan Perhatian": {
      singkat: "hambatan pemusatan perhatian",
      deskripsi: "Peserta didik dengan hambatan pemusatan perhatian dan hiperaktivitas yang membutuhkan kegiatan aktif dan durasi pendek.",
      jalurA: "Murid yang mampu fokus 10–15 menit. → tugas bertahap dengan target jelas dan jeda gerak.",
      jalurB: "Murid yang fokus < 10 menit. → kegiatan sangat singkat, gerak aktif, penguatan segera.",
      komunikasi: "kontak mata sebelum instruksi, satu perintah sekali, beri tanda visual waktu (timer).",
      akomodasi: ["Tugas pendek dengan jeda gerak", "Tempat duduk jauh dari pengalih perhatian", "Timer visual", "Penguatan positif segera"],
      digital: ["Timer visual", "Kuis interaktif singkat", "Video ≤ 3 menit"]
    },
    "Tunaganda / Hambatan Majemuk": {
      singkat: "tunaganda",
      deskripsi: "Peserta didik dengan lebih dari satu hambatan yang membutuhkan layanan sangat individual dan multisensori.",
      jalurA: "Murid dengan respons komunikasi terbatas. → objek nyata, isyarat sentuh, rutinitas tetap.",
      jalurB: "Murid dengan kebutuhan dukungan penuh. → bimbingan fisik bertahap (hand-under-hand), kegiatan sensorik.",
      komunikasi: "objek penanda (object cue), isyarat sentuh, nada suara tenang dan konsisten.",
      akomodasi: ["Pendekatan multisensori", "Rutinitas tetap", "Bimbingan fisik bertahap", "Asesmen observasi perilaku"],
      digital: ["Tombol suara (switch) sederhana", "Musik/audio penanda kegiatan"]
    },
    "Lamban belajar / Kesulitan belajar spesifik": {
      singkat: "lamban belajar / kesulitan belajar",
      deskripsi: "Peserta didik yang membutuhkan waktu lebih lama dan strategi khusus untuk membaca, menulis, atau berhitung.",
      jalurA: "Murid yang mulai lancar membaca. → teks pendek bergambar, peta konsep, latihan terbimbing.",
      jalurB: "Murid yang masih kesulitan membaca/berhitung. → media konkret, audio, latihan bertahap dengan contoh.",
      komunikasi: "instruksi bertahap, cek pemahaman setelah tiap langkah, gunakan contoh nyata.",
      akomodasi: ["Waktu tambahan", "Teks dengan huruf besar dan spasi lega", "Media konkret", "Asesmen bertahap"],
      digital: ["Audio pembacaan teks (text-to-speech)", "Video pendek", "Latihan interaktif bertingkat"]
    }
  },

  dpl: [
    { kode: "DPL1", nama: "Keimanan dan Ketakwaan terhadap Tuhan YME" },
    { kode: "DPL2", nama: "Kewargaan" },
    { kode: "DPL3", nama: "Penalaran Kritis" },
    { kode: "DPL4", nama: "Kreativitas" },
    { kode: "DPL5", nama: "Kolaborasi" },
    { kode: "DPL6", nama: "Kemandirian" },
    { kode: "DPL7", nama: "Kesehatan" },
    { kode: "DPL8", nama: "Komunikasi" }
  ],

  /* Buku referensi. Taruh file PDF buku di folder /books dengan nama
     sesuai properti "pdf" agar fitur "Cari rujukan dari buku" bisa
     mencari teks di dalamnya. */
  buku: [
    {
      id: "ipa",
      judul: "Ilmu Pengetahuan Alam (IPA)",
      mapel: "Ilmu Pengetahuan Alam (IPA)",
      fase: ["D", "E", "F"],
      info: "Fase D-F · SMPLB, SMALB · 103 hlm",
      pdf: "books/ipa-smplb-smalb.pdf"
    }
  ],

  /* Materi per mapel & fase. Format: { judul, esensial } */
  materi: {
    "Ilmu Pengetahuan Alam (IPA)|D": [
      { judul: "Klasifikasi makhluk hidup", esensial: "Ciri-ciri makhluk hidup; mengelompokkan makhluk hidup berdasarkan ciri yang mudah diamati (hewan dan tumbuhan)." },
      { judul: "Daur hidup hewan", esensial: "Tahapan daur hidup hewan (kupu-kupu, katak, ayam); membedakan metamorfosis sempurna dan tidak sempurna." },
      { judul: "Perkembangbiakan hewan", esensial: "Cara hewan berkembang biak (bertelur, melahirkan, bertelur-melahirkan); contoh hewan untuk tiap cara." },
      { judul: "Perkembangbiakan tumbuhan", esensial: "Cara tumbuhan berkembang biak (biji, tunas, umbi, stek); mengenali contoh tumbuhan untuk tiap cara." },
      { judul: "Merawat hewan peliharaan", esensial: "Kebutuhan hewan (makan, minum, kandang, kebersihan); langkah merawat hewan peliharaan di rumah/sekolah." },
      { judul: "Merawat tumbuhan", esensial: "Kebutuhan tumbuhan (air, cahaya, tanah, udara); langkah menanam dan merawat tanaman sederhana." },
      { judul: "Pertumbuhan dan perkembangan manusia", esensial: "Tahap pertumbuhan manusia (bayi, anak, remaja, dewasa, lansia); perubahan tubuh di setiap tahap." },
      { judul: "Ciri pubertas laki-laki dan perempuan", esensial: "Ciri fisik pubertas pada laki-laki dan perempuan; cara menjaga kebersihan diri saat pubertas." },
      { judul: "Wujud zat: padat, cair, gas", esensial: "Ciri benda padat, cair, dan gas; contoh benda di sekitar untuk tiap wujud." },
      { judul: "Perubahan wujud zat: mencair dan membeku", esensial: "Perubahan padat ke cair (mencair) dan cair ke padat (membeku); contoh es batu dan lilin." },
      { judul: "Perubahan wujud zat: menguap dan mengembun", esensial: "Perubahan cair ke gas (menguap) dan gas ke cair (mengembun); contoh air mendidih dan embun pagi." },
      { judul: "Perubahan wujud zat: menyublim", esensial: "Perubahan padat ke gas (menyublim); contoh kapur barus/kamper." },
      { judul: "Sifat dan karakteristik zat", esensial: "Sifat benda: warna, bentuk, kekerasan, bau, rasa; membedakan benda berdasarkan sifatnya." },
      { judul: "Perubahan kimia pada buah dan sayur", esensial: "Perubahan kimia sehari-hari: buah membusuk, apel menjadi cokelat, sayur layu; ciri perubahan kimia." },
      { judul: "Campuran dan pemisahannya", esensial: "Pengertian campuran; cara memisahkan campuran sederhana (menyaring, mengendapkan, menyaring dengan kain)." },
      { judul: "Penjernihan air ramah lingkungan", esensial: "Langkah penjernihan air sederhana dengan pasir, kerikil, ijuk, dan arang; manfaat air bersih." },
      { judul: "Rotasi bumi: siang dan malam", esensial: "Bumi berputar pada porosnya; akibat rotasi bumi berupa pergantian siang dan malam." },
      { judul: "Energi matahari", esensial: "Matahari sebagai sumber energi (cahaya dan panas); pemanfaatan energi matahari sehari-hari." },
      { judul: "Energi air dan angin", esensial: "Air dan angin sebagai sumber energi; contoh pemanfaatan (kincir air, kincir angin, PLTA)." },
      { judul: "Pelestarian lingkungan", esensial: "Upaya menjaga lingkungan: hemat energi, tidak membuang sampah sembarangan, menanam pohon, 3R." }
    ]
  },

  /* CP per mapel & fase. Setiap elemen: { elemen, teks, tp: [ ... ] }.
     CP IPA Fase D diambil dari buku (sesuai screenshot). Periksa kembali. */
  cp: {
    "Ilmu Pengetahuan Alam (IPA)|D": [
      {
        elemen: "Pemahaman Konsep",
        teks: "Menjelaskan proses klasifikasi makhluk hidup, daur hidup hewan, perkembangbiakan hewan, dan perkembangbiakan tumbuhan; menerapkan cara merawat dan memelihara hewan serta tumbuhan; mengenali Pertumbuhan dan perkembangan manusia; menjelaskan ciri fisik laki-laki dan perempuan pada masa pubertas; mengidentifikasi proses perubahan wujud zat meliputi menguap, mengembun, mencair, membeku, menyublim pada benda padat, cair dan gas; membedakan sifat dan karakteristik zat; serta menerapkan pengetahuan kontekstual dalam kehidupan sehari-hari. Mengenali perubahan kimia dalam kehidupan sehari-hari seperti pada buah dan sayur; mengenali pemisahan campuran sederhana yang banyak digunakan dalam kehidupan sehari-hari seperti penjernihan air yang ramah lingkungan; dan menggambarkan pemahamannya tentang rotasi bumi (perubahan siang dan malam), sumber energi matahari, air, dan angin, serta upaya pelestarian lingkungannya.",
        tp: [
          "Murid mampu menjelaskan konsep {materi} dengan bahasa sendiri atau media yang sesuai.",
          "Murid mampu menyebutkan dan mengelompokkan contoh-contoh {materi} di lingkungan sekitar.",
          "Murid mampu menerapkan pemahaman {materi} dalam kegiatan sehari-hari."
        ]
      },
      {
        elemen: "Mengamati",
        teks: "Menemukan fenomena dan peristiwa secara sederhana dengan mengoptimalkan panca indra yang masih berfungsi, secara mandiri, dan sesuai dengan fakta empiris.",
        tp: [
          "Murid mampu mengamati benda/peristiwa terkait {materi} menggunakan panca indra yang berfungsi.",
          "Murid mampu mencatat atau menyampaikan hasil pengamatan {materi} sesuai fakta."
        ]
      },
      {
        elemen: "Mempertanyakan dan Memprediksi",
        teks: "Menyusun dan menjawab pertanyaan tentang hal-hal yang ingin diketahui saat melakukan pengamatan. Murid membuat prediksi mengenai objek dan peristiwa di lingkungan sekitar melalui penalaran kritis.",
        tp: [
          "Murid mampu mengajukan pertanyaan sederhana tentang {materi}.",
          "Murid mampu membuat prediksi sederhana tentang apa yang akan terjadi pada {materi}."
        ]
      },
      {
        elemen: "Merencanakan dan Menyelidiki",
        teks: "Berpartisipasi dalam penyelidikan untuk mengeksplorasi dan menjawab pertanyaan secara mandiri. murid melakukan pengukuran dengan alat sederhana yang ada disekitarnya untuk mendapatkan data melalui penalaran kritis dan tanggap terhadap lingkungannya.",
        tp: [
          "Murid mampu mengikuti langkah percobaan/penyelidikan sederhana tentang {materi}.",
          "Murid mampu menggunakan alat sederhana untuk mengumpulkan data tentang {materi}."
        ]
      },
      {
        elemen: "Memproses dan Menganalisis Data dan Informasi",
        teks: "Menggunakan berbagai metode untuk menyimpulkan informasi, mendiskusikan, dan mencocokkan antara hasil pengamatan dan prediksi melalui penalaran kritis dan berkoordinasi dengan temannya.",
        tp: [
          "Murid mampu mencocokkan hasil pengamatan dengan prediksi tentang {materi}.",
          "Murid mampu menyimpulkan informasi sederhana tentang {materi} bersama teman."
        ]
      },
      {
        elemen: "Mengevaluasi dan Merefleksi",
        teks: "Membandingkan hasil pengamatan yang berbeda dengan mengacu pada teori melalui penalaran kritis dari berbagai sudut pandang.",
        tp: [
          "Murid mampu membandingkan hasil pengamatannya dengan hasil teman tentang {materi}.",
          "Murid mampu menyampaikan hal yang sudah dan belum dipahami tentang {materi}."
        ]
      },
      {
        elemen: "Mengomunikasikan Hasil",
        teks: "Menjelaskan informasi secara terstruktur melalui lisan atau tulisan, menggunakan media digital atau non-digital untuk mendukung penjelasan dan menunjukkan pola berpikir sistematis sesuai kemampuan.",
        tp: [
          "Murid mampu menyajikan hasil belajar {materi} secara lisan, tulisan, gambar, atau isyarat.",
          "Murid mampu menggunakan media (poster/foto/video) untuk menjelaskan {materi}."
        ]
      }
    ]
  }
};
