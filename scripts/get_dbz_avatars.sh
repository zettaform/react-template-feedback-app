#!/usr/bin/env bash
set -euo pipefail

# Downloads 32 license-safe placeholder PNG avatars from the DiceBear API
# and maps them to DBZ-styled filenames used by the backend allowed_avatars().
# NOTE: These are NOT Dragon Ball Z artworks. They are procedurally generated,
# license-friendly avatars seeded with character names to keep filenames stable.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/public/dbz"
mkdir -p "$OUT_DIR"

BASE_URL="https://api.dicebear.com/7.x/adventurer/png"

# Map generated avatars to the backend's allowed DBZ filenames using stable seeds.
SEEDS=(
  Goku Vegeta Gohan Piccolo Trunks Goten Krillin Android18
  Frieza Cell MajinBuu Beerus Whis Broly Tien Yamcha
  Nappa Raditz Zarbon Dodoria Ginyu Recoome Burter Jeice
  Hit Jiren Toppo Caulifla Kale Cabba Zamasu GokuBlack
)

# Target filenames expected by backend/database.allowed_avatars()
DST=(
  goku.png vegeta.png gohan.png piccolo.png trunks.png goten.png krillin.png android18.png
  frieza.png cell.png majin_buu.png beerus.png whis.png broly.png tien.png yamcha.png
  nappa.png raditz.png zarbon.png dodoria.png ginyu.png recoome.png burter.png jeice.png
  hit.png jiren.png toppo.png caulifla.png kale.png cabba.png zamasu.png goku_black.png
)

count=${#SEEDS[@]}
for ((i=0; i<count; i++)); do
  seed="${SEEDS[$i]}"
  dst="${DST[$i]}"
  echo "Generating $seed -> $dst"
  # You can adjust size/bg if you want: size=256&backgroundType=gradientLinear
  curl -fsSL "$BASE_URL?seed=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$seed")&size=256&backgroundType=gradientLinear&radius=50" -o "$OUT_DIR/$dst"

done

echo "Done. Avatars saved to $OUT_DIR"
