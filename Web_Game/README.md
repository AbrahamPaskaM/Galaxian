# Galaxian Classic Arcade

Game shooter arcade berbasis browser dengan nuansa neon retro. Pemain mengendalikan pesawat, menembak alien, menghindari peluru, dan menghadapi serangan alien yang menyelam menuju player.

## Fitur

- Game loop berbasis `requestAnimationFrame`
- Player dapat bergerak ke kiri dan kanan
- Sistem menembak dengan cooldown
- Formasi alien berbeda pada setiap wave
- Pola alien acak seperti grid, hexagon, diamond, dan zigzag
- Alien menembak dengan kecepatan yang menyesuaikan wave
- Alien menyelam menuju player setelah waktu tertentu
- Alien yang melewati atau menabrak player muncul kembali dari atas
- Sistem skor, nyawa, wave, dan high score
- High score tersimpan di `localStorage`
- Background bintang acak dan bergerak
- Efek audio sintetis untuk tembakan dan tabrakan
- Kontrol keyboard dan tombol mobile

## Struktur File

```text
Web_Game/
├── index.html   # Struktur halaman dan elemen game
├── style.css    # Tampilan, layout, dan tema arcade
├── game.js      # Logika game, player, alien, collision, audio
└── README.md    # Dokumentasi project
```

## Cara Menjalankan

1. Buka folder project di VS Code.
2. Buka file `index.html` di browser.
3. Tekan tombol `START GAME`.

Project ini tidak memerlukan instalasi dependency atau server khusus karena menggunakan HTML, CSS, dan JavaScript murni.

## Kontrol

### Keyboard

| Tombol | Fungsi |
| --- | --- |
| `ArrowLeft` atau `A` | Bergerak ke kiri |
| `ArrowRight` atau `D` | Bergerak ke kanan |
| `Space` atau `ArrowUp` | Menembak |

### Mobile

- Tombol kiri dan kanan digunakan untuk menggerakkan player.
- Tombol `FIRE` digunakan untuk menembak.

## Aturan Gameplay

- Player memulai permainan dengan 3 nyawa.
- Cooldown tembakan player sekitar 0,5 detik.
- Pada Wave 1, alien mulai melakukan serangan menyelam sekitar detik ke-10.
- Pada wave berikutnya, serangan menyelam dimulai lebih cepat.
- Kecepatan alien dan peluru musuh meningkat secara bertahap setiap wave.
- Alien yang menabrak player mengurangi satu nyawa lalu kembali muncul dari atas.
- Permainan berakhir ketika nyawa player habis.
- Setiap alien yang terkena peluru memberikan 10 poin.

## Teknologi

- HTML5 Canvas
- CSS3
- JavaScript ES6+
- Web Audio API
- Local Storage API

## Catatan Audio

Audio dimulai setelah tombol `START GAME` ditekan karena browser biasanya memblokir audio otomatis sebelum ada interaksi pengguna.
