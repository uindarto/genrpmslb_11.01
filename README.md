# GenRPM — Generator Rencana Pembelajaran Mendalam (Sekolah Pendidikan Khusus)

Aplikasi web satu halaman (HTML + CSS + JavaScript murni, tanpa proses build) untuk menyusun RPM/RPP.
Siap di-deploy ke Netlify.

## Struktur folder

```
index.html                     Halaman utama (satu halaman, bisa di-scroll)
assets/logo-genrpm.png         Logo di bagian paling atas (ganti file ini bila perlu, nama tetap)
css/style.css                  Tampilan
js/data.js                     DATA kurikulum: mapel, fase, kelas, ketunaan, materi, CP & TP, buku
js/app.js                      Logika: draf otomatis, template, internet, pembuatan .docx/PDF
vendor/                        Pustaka lokal: docx (Word), docx-preview + jszip (pratinjau/cetak dari .docx), mammoth (baca template .docx), pdf.js (baca buku PDF)
books/                         Taruh PDF buku referensi di sini (lihat books/README.txt)
books/panduan/*.md             49 Panduan Mata Pelajaran Pendidikan Khusus BSKAP 2025 (teks, bisa dicari)
js/data-panduan.js             CP per elemen & fase, pilihan TP, dan materi hasil ekstraksi dari 49 panduan
netlify/edge-functions/auth.js          Login (aktif bila GENRPM_USERS diisi)
netlify.toml                   Konfigurasi Netlify
```

## Deploy ke Netlify
1. Unggah folder ini ke repositori GitHub, lalu di Netlify pilih *Add new project → Import an existing project*.
   Build command: kosong. Publish directory: `.` (sudah diatur di `netlify.toml`).
2. Tidak perlu kunci API apa pun. Variabel lingkungan hanya dipakai untuk login (lihat di bawah).
3. Netlify Drop (seret folder) juga bisa, tetapi fitur login tidak ikut aktif karena memerlukan edge function.

## Login (penggunaan pribadi)
Login aktif otomatis bila variabel lingkungan berikut diisi di Netlify → Project configuration → Environment variables (centang *Contains secret values*):

| Key | Isi | Wajib |
|---|---|---|
| `GENRPM_USERS` | `nama:katasandi`, beberapa pengguna dipisah koma, mis. `weda:Rahasia123,bu_sari:Guru2026` | Ya (kosong = situs terbuka) |
| `AUTH_SECRET` | teks acak panjang untuk menandatangani sesi | Opsional |

- Sesi berlaku 7 hari; tombol **Keluar** ada di pojok kanan atas.
- Semua halaman dan data terkunci bagi yang belum login.
- Mengganti kata sandi atau menghapus pengguna langsung membatalkan sesinya (bila `AUTH_SECRET` tidak diisi). Mengganti `AUTH_SECRET` memaksa semua pengguna login ulang.
- Setelah mengubah variabel, lakukan **Deploys → Trigger deploy**.
- Berkas: `netlify/edge-functions/auth.js`, `login.html`, entri `[[edge_functions]]` di `netlify.toml`.

## Tiga cara mengisi
- **Manual** — ketik langsung di setiap kolom (format: `## Judul`, `- butir`, `-- sub-butir`, `Label: isi`, `| a | b |`).
Tombol **Draf Otomatis** dan **Isi dari Internet** ada tepat di bawah pilihan Dimensi Profil Lulusan.
- **Draf Otomatis** — kerangka lengkap disesuaikan dengan mapel, materi, alokasi waktu, ketunaan, CP/TP, dan DPL (dari panduan, tanpa koneksi).
- **Isi dari Internet** — draf yang sama ditambah rujukan Wikipedia bahasa Indonesia (tautan + ringkasan bacaan guru) dan tautan pencarian media (video, gambar, Rumah Belajar).
Kolom yang masih kosong saat **Buat Dokumen** ditekan diisi otomatis.

## Template sendiri
Pilih **Template saya** lalu unggah file RPP/RPM (.docx, .txt, .md). Komponen dibaca dari tabel
(kolom 1 = komponen utama, teks tebal/berlabel di kolom 2 = sub-komponen) atau dari judul dokumen.
Struktur bisa diedit: `# Komponen` dan `- Sub-komponen = kunci`. Sub-komponen yang tidak dikenali
(mis. Pertanyaan Pemantik, Sarana Prasarana) otomatis menjadi kolom isi tambahan.

## Buku referensi panduan BSKAP 2025
Terpasang 49 panduan (44 mata pelajaran):
- Agama & Budi Pekerti: Islam, Kristen, Katolik, Hindu, Buddha, Khonghucu (Fase A–F)
- Pendidikan Pancasila, Bahasa Indonesia, Matematika, PJOK (A–F); Bahasa Inggris (B–F)
- IPAS (B–C); IPA dan IPS (D–F)
- Seni Musik, Seni Rupa, Seni Tari, Seni Teater (A–F)
- Keterampilan (D–F): Budi Daya Perikanan, Budi Daya Peternakan Unggas, Cetak Sablon, Elektronika Alat Rumah Tangga, Budi Daya Tanaman Hortikultura, Desain Grafis, Fotografi,
  KKA, Perbengkelan Sepeda Motor, Penyiaran Radio, Pijat, Seni Lukis, Seni Membatik, Seni Musik, Seni Tari, Suvenir,
  Tata Boga, Tata Busana, Tata Gerha, Tata Kecantikan, TIK
- PKK (Fondasi/TKLB dan A–F): Pengembangan Diri (Hambatan Intelektual), PKPBI, Autisme,
  Pengembangan Diri dan Gerak (Tunadaksa), POMSK (Tunanetra)
- Memilih mata pelajaran & fase otomatis menampilkan CP resmi per elemen dari panduan; centang CP untuk mengisi kolom CP.
- Pilihan TP dirumuskan otomatis dari klausa CP (Alternatif 1 dalam panduan) — sunting sesuai kebutuhan.
- Daftar Materi diambil dari tabel pemetaan materi esensial (bila terbaca) atau dari rincian CP.
- "Cari rujukan dari buku" mencari teks di panduan dan menambahkan rujukan per bagian ke Sumber Belajar.
Ekstraksi dilakukan otomatis; cocokkan kembali dengan dokumen panduan sebelum dipakai resmi.

## Menambah data kurikulum
Sunting `js/data.js`. Kunci data memakai format `"Nama Mapel|Fase"`, contoh `"Matematika|D"`.
CP Matematika saat ini berupa ringkasan — salin teks CP resmi dari buku sebelum dipakai.

## Format dokumen (mengikuti format RPM Kemendikdasmen 2025)
- **Identifikasi:** Peserta Didik, Materi Pelajaran (jenis pengetahuan, relevansi, tingkat kesulitan, struktur materi, nilai & karakter), Dimensi Profil Lulusan.
- **Desain Pembelajaran:** CP, Lintas Disiplin Ilmu, TP (dan TP per pertemuan), Topik Pembelajaran, Praktik Pedagogis, Kemitraan, Lingkungan, Pemanfaatan Digital.
- **Pengalaman Belajar:** setiap pertemuan dipisah pita berwarna KEGIATAN AWAL – KEGIATAN INTI (Memahami, Mengaplikasi, Merefleksi) – KEGIATAN PENUTUP, lengkap dengan prinsip dan durasi. Ketik `### JUDUL` untuk membuat pita sendiri.
- **Asesmen:** pada Awal, Proses, dan Akhir Pembelajaran + rubrik.
- **Lampiran:** lembar observasi dan LKPD per pertemuan (satu halaman per LKPD). Jenis kegiatan LKPD dipilih acak dari 19 variasi sesuai mata pelajaran (tarik garis, tabel pengamatan, benar/salah, urutkan langkah, teka-teki, peta pikiran, kolase, ceklis praktik, wawancara keluarga, cerita bergambar, dll.) — tekan Draf Otomatis lagi untuk variasi lain.
- Draf Otomatis mengisi Materi dan Materi Esensial dari panduan bila masih kosong.

## Hasil
Unduh Word (.docx), Salin untuk Word (tempel ke Word/Google Docs), atau Cetak/PDF (A4).
Pratinjau dan Cetak/PDF dibuat dari file .docx yang sama (docx-preview), sehingga tata letaknya mengikuti Word.
Untuk PDF yang 100% identik, buka file .docx di Word lalu **File → Save as → PDF**.
Data isian tersimpan otomatis di peramban (localStorage), tidak dikirim ke server mana pun (Isi dari Internet hanya mengirim kata kunci materi ke Wikipedia).
