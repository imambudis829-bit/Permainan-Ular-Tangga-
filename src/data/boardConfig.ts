import { BonusEffectType, SnakeOrLadder, TileConfig } from '../types/game';

export const SNAKES_AND_LADDERS: SnakeOrLadder[] = [
  // 8 Ladders (Tangga Naik)
  { id: 'L1', kind: 'ladder', from: 4, to: 25, name: 'Tangga Niat Tulus', palette: 'amber' },
  { id: 'L2', kind: 'ladder', from: 13, to: 46, name: 'Tangga Rajin Mengaji', palette: 'teal' },
  { id: 'L3', kind: 'ladder', from: 33, to: 49, name: 'Tangga Jujur & Amanah', palette: 'amber' },
  { id: 'L4', kind: 'ladder', from: 42, to: 63, name: 'Tangga Bakti Orang Tua', palette: 'teal' },
  { id: 'L5', kind: 'ladder', from: 50, to: 69, name: 'Tangga Shalat Tepat Waktu', palette: 'amber' },
  { id: 'L6', kind: 'ladder', from: 62, to: 81, name: 'Tangga Semangat Sedekah', palette: 'teal' },
  { id: 'L7', kind: 'ladder', from: 74, to: 92, name: 'Tangga Sabar & Tawakal', palette: 'amber' },
  { id: 'L8', kind: 'ladder', from: 79, to: 98, name: 'Tangga Istiqamah Ilmu', palette: 'teal' },

  // 8 Snakes (Ular Turun)
  { id: 'S1', kind: 'snake', from: 27, to: 5, name: 'Ular Lupa Bersyukur', palette: 'emerald' },
  { id: 'S2', kind: 'snake', from: 40, to: 3, name: 'Ular Menunda Shalat', palette: 'crimson' },
  { id: 'S3', kind: 'snake', from: 43, to: 18, name: 'Ular Malas Belajar', palette: 'emerald' },
  { id: 'S4', kind: 'snake', from: 54, to: 31, name: 'Ular Mudah Marah', palette: 'crimson' },
  { id: 'S5', kind: 'snake', from: 66, to: 45, name: 'Ular Berkata Kasar', palette: 'emerald' },
  { id: 'S6', kind: 'snake', from: 76, to: 58, name: 'Ular Sombong Diri', palette: 'crimson' },
  { id: 'S7', kind: 'snake', from: 89, to: 53, name: 'Ular Ingkar Janji', palette: 'emerald' },
  { id: 'S8', kind: 'snake', from: 97, to: 78, name: 'Ular Putus Asa', palette: 'crimson' },
];

const QUIZ_TILES = new Set([
  2, 7, 11, 16, 19, 23, 29, 34, 38, 44, 48, 52,
  56, 61, 64, 68, 72, 77, 83, 86, 90, 93, 95, 99,
]);

const BONUS_TILE_MAP: Record<number, { effect: BonusEffectType; title: string; fact: string }> = {
  8: {
    effect: 'points_15',
    title: 'Kotak Berkah Senyum',
    fact: 'Senyummu di hadapan saudaramu adalah sedekah. Dapatkan bonus +15 poin keberkahan!',
  },
  15: {
    effect: 'shield',
    title: 'Perisai Doa Pagi',
    fact: 'Membaca zikir dan doa perlindungan menjaga langkahmu. Perisai Anti-Ular aktif!',
  },
  21: {
    effect: 'step_2',
    title: 'Langkah Semangat Ilmu',
    fact: 'Menuntut ilmu memudahkan jalan menuju kebaikan. Maju otomatis +2 langkah!',
  },
  35: {
    effect: 'points_20',
    title: 'Mutiara Sedekah Subuh',
    fact: 'Berbagi di pagi hari mengundang doa kebaikan malaikat. Bonus +20 poin!',
  },
  47: {
    effect: 'shield',
    title: 'Perisai Kejujuran',
    fact: 'Kejujuran menenangkan hati dan melindungi diri dari kesulitan. Perisai Anti-Ular aktif!',
  },
  59: {
    effect: 'points_15',
    title: 'Taman Syukur',
    fact: 'Bersyukur atas nikmat kecil membuat Allah menambah keberkahan. Bonus +15 poin!',
  },
  70: {
    effect: 'step_2',
    title: 'Dorongan Amal Saleh',
    fact: 'Istiqamah berbuat baik mempercepat langkahmu. Maju otomatis +2 langkah!',
  },
  82: {
    effect: 'shield',
    title: 'Perisai Tawakal',
    fact: 'Bertawakal setelah berusaha membentengi hati dari putus asa. Perisai Anti-Ular aktif!',
  },
  88: {
    effect: 'points_20',
    title: 'Lentera Al-Qur’an',
    fact: 'Satu huruf Al-Qur’an yang dibaca bernilai sepuluh kebaikan. Bonus +20 poin!',
  },
  94: {
    effect: 'points_20',
    title: 'Bekal Akhir Perjalanan',
    fact: 'Sedikit lagi menuju Istana Hikmah! Terima tambahan +20 poin keberkahan!',
  },
};

const ISLAMIC_TILE_FACTS: string[] = [
  'Setiap langkah kebaikan yang diniatkan karena Allah akan bernilai pahala.',
  'Rukun Iman pertama: Beriman kepada Allah Yang Maha Esa dan Maha Pencipta.',
  'Rukun Islam pertama: Mengucapkan dua kalimat syahadat dengan sepenuh hati.',
  'Asmaul Husna Ar-Rahman mengingatkan kita untuk menyayangi sesama makhluk.',
  'Berwudhu sebelum shalat membersihkan lahir sekaligus menenangkan hati.',
  'Malaikat Raqib dan Atid selalu mendampingi dan mencatat setiap amal kita.',
  'Shalat lima waktu sehari semalam berjumlah 17 rakaat sebagai tiang agama.',
  'Membaca Al-Qur’an meski satu ayat setiap hari melatih kecintaan pada wahyu Allah.',
  'Menjaga amanah membuat teman dan orang tua percaya kepada ucapan kita.',
  'Puasa Ramadhan melatih kesabaran, kejujuran, dan kepedulian kepada fakir miskin.',
  'Nabi Muhammad SAW dikenal dengan gelar Al-Amin karena kejujurannya.',
  'Zakat membersihkan harta dan menumbuhkan kasih sayang dalam masyarakat.',
  'Setelah berusaha belajar dengan tekun, berdoalah dan bertawakal kepada Allah.',
  'Lima Rasul Ulul Azmi adalah Nuh, Ibrahim, Musa, Isa, dan Muhammad SAW.',
  'Berbakti dan berkata lembut kepada orang tua adalah amalan yang sangat dicintai Allah.',
  'Setiap kesulitan selalu disertai kemudahan bagi hamba yang sabar dan berusaha.',
  'Mengucap Alhamdulillah atas nikmat kecil melatih hati yang selalu bersyukur.',
  'Ibadah haji menyatukan umat Islam dari seluruh penjuru dunia dalam pakaian ihram yang sama.',
  'Ilmu yang bermanfaat termasuk amal jariyah yang pahalanya terus mengalir.',
  'Kejujuran saat ujian jauh lebih mulia daripada nilai tinggi hasil mencontek.',
];

export const BOARD_TILES: TileConfig[] = Array.from({ length: 100 }, (_, i) => {
  const num = i + 1;
  if (num === 1) {
    return {
      index: 1,
      type: 'start',
      title: 'Gerbang Awal Petualangan',
      fact: 'Mulai perjalanan menelusuri Rukun Iman & Rukun Islam dengan niat yang tulus (Bismillah).',
    };
  }
  if (num === 100) {
    return {
      index: 100,
      type: 'finish',
      title: 'Istana Hikmah (Finish)',
      fact: 'Selamat! Mencapai kotak 100 memberi tambahan +100 poin bonus finish dan mengakhiri babak!',
    };
  }

  const connector = SNAKES_AND_LADDERS.find((item) => item.from === num);
  if (connector) {
    return {
      index: num,
      type: connector.kind,
      targetIndex: connector.to,
      title: connector.name,
      fact:
        connector.kind === 'ladder'
          ? `Naik tangga amal baik dari kotak ${connector.from} langsung menuju kotak ${connector.to}!`
          : `Hati-hati! Kepala ular mengarahkan turun dari kotak ${connector.from} ke ${connector.to} (kecuali memiliki Perisai Anti-Ular).`,
    };
  }

  const bonus = BONUS_TILE_MAP[num];
  if (bonus) {
    return {
      index: num,
      type: 'bonus',
      bonusEffect: bonus.effect,
      title: bonus.title,
      fact: bonus.fact,
    };
  }

  if (QUIZ_TILES.has(num)) {
    return {
      index: num,
      type: 'quiz',
      title: 'Tantangan Ilmu Iman & Islam',
      fact: 'Jawab pertanyaan acak Rukun Iman atau Rukun Islam: Benar +10 poin, Salah -5 poin.',
    };
  }

  return {
    index: num,
    type: 'normal',
    title: `Pos Hikmah #${num}`,
    fact: ISLAMIC_TILE_FACTS[num % ISLAMIC_TILE_FACTS.length],
  };
});

/**
 * Returns visual grid position (row 0 = top row 91..100, row 9 = bottom row 1..10)
 * and exact SVG center coordinates in a 1000 x 1000 viewBox.
 */
export function getTilePosition(tileNumber: number): {
  rowFromTop: number;
  colFromLeft: number;
  cx: number;
  cy: number;
} {
  const clamped = Math.max(1, Math.min(100, tileNumber));
  const zeroBased = clamped - 1;
  const rowFromBottom = Math.floor(zeroBased / 10); // 0..9
  const rowFromTop = 9 - rowFromBottom; // 9..0
  const indexInRow = zeroBased % 10;
  const colFromLeft = rowFromBottom % 2 === 0 ? indexInRow : 9 - indexInRow;

  return {
    rowFromTop,
    colFromLeft,
    cx: colFromLeft * 100 + 50,
    cy: rowFromTop * 100 + 50,
  };
}

/**
 * Returns tiles ordered top-left (100) to bottom-right (1 or 10) for CSS Grid rendering.
 */
export function getGridDisplayOrder(): TileConfig[] {
  const ordered: TileConfig[] = [];
  for (let rowFromTop = 0; rowFromTop < 10; rowFromTop += 1) {
    const rowFromBottom = 9 - rowFromTop;
    for (let col = 0; col < 10; col += 1) {
      const indexInRow = rowFromBottom % 2 === 0 ? col : 9 - col;
      const tileNum = rowFromBottom * 10 + indexInRow + 1;
      ordered.push(BOARD_TILES[tileNum - 1]);
    }
  }
  return ordered;
}
