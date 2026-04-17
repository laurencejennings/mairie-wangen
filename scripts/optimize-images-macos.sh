#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Optimize images in a folder for web use on macOS.

Usage:
  scripts/optimize-images-macos.sh [options] <input_dir> [output_dir]

Examples:
  scripts/optimize-images-macos.sh public/events-src public/events
  scripts/optimize-images-macos.sh --to-webp --max-width 1600 --max-kb 350 public/events-src public/events
  scripts/optimize-images-macos.sh --in-place --max-width 1400 public/events/notrevillagemonvillage

Options:
  --max-width <px>       Max image width/height via sips -Z (default: 1920)
  --jpeg-quality <1-100> JPEG quality for non-PNG outputs (default: 80)
  --webp-quality <1-100> WebP quality when --to-webp is enabled (default: 78)
  --max-kb <n>           Fail if optimized file is larger than this KB (default: 500)
  --to-webp              Convert outputs to .webp (requires cwebp)
  --in-place             Write optimized files back into input folder
  --dry-run              Print actions without writing files
  -h, --help             Show this help

Supported input types:
  .jpg .jpeg .png .tif .tiff .heic .heif
USAGE
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: required command not found: $1" >&2
    exit 1
  fi
}

is_positive_int() {
  case "$1" in
    ''|*[!0-9]*) return 1 ;;
    0) return 1 ;;
    *) return 0 ;;
  esac
}

bytes_human() {
  awk -v b="$1" 'BEGIN {
    split("B KB MB GB", u, " ");
    i=1;
    while (b >= 1024 && i < 4) { b = b / 1024; i++ }
    printf("%.1f %s", b, u[i]);
  }'
}

ratio_percent() {
  awk -v before="$1" -v after="$2" 'BEGIN {
    if (before <= 0) { printf("0%%"); exit }
    v = ((before - after) / before) * 100;
    printf("%.1f%%", v);
  }'
}

is_subpath() {
  case "$2/" in
    "$1/"*) return 0 ;;
    *) return 1 ;;
  esac
}

MAX_WIDTH=1920
JPEG_QUALITY=80
WEBP_QUALITY=78
MAX_KB=500
TO_WEBP=0
IN_PLACE=0
DRY_RUN=0

POSITIONAL=()
while [ "$#" -gt 0 ]; do
  case "$1" in
    --max-width)
      [ "$#" -ge 2 ] || { echo "Error: --max-width requires a value" >&2; exit 1; }
      MAX_WIDTH="$2"
      shift 2
      ;;
    --jpeg-quality)
      [ "$#" -ge 2 ] || { echo "Error: --jpeg-quality requires a value" >&2; exit 1; }
      JPEG_QUALITY="$2"
      shift 2
      ;;
    --webp-quality)
      [ "$#" -ge 2 ] || { echo "Error: --webp-quality requires a value" >&2; exit 1; }
      WEBP_QUALITY="$2"
      shift 2
      ;;
    --max-kb)
      [ "$#" -ge 2 ] || { echo "Error: --max-kb requires a value" >&2; exit 1; }
      MAX_KB="$2"
      shift 2
      ;;
    --to-webp)
      TO_WEBP=1
      shift
      ;;
    --in-place)
      IN_PLACE=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      while [ "$#" -gt 0 ]; do
        POSITIONAL+=("$1")
        shift
      done
      ;;
    -*)
      echo "Error: unknown option: $1" >&2
      usage
      exit 1
      ;;
    *)
      POSITIONAL+=("$1")
      shift
      ;;
  esac
done

if [ "${#POSITIONAL[@]}" -lt 1 ] || [ "${#POSITIONAL[@]}" -gt 2 ]; then
  usage
  exit 1
fi

INPUT_DIR="${POSITIONAL[0]}"
OUTPUT_DIR="${POSITIONAL[1]:-}"

if ! [ -d "$INPUT_DIR" ]; then
  echo "Error: input directory does not exist: $INPUT_DIR" >&2
  exit 1
fi

if ! is_positive_int "$MAX_WIDTH" || ! is_positive_int "$JPEG_QUALITY" || ! is_positive_int "$WEBP_QUALITY" || ! is_positive_int "$MAX_KB"; then
  echo "Error: numeric options must be positive integers." >&2
  exit 1
fi

if [ "$JPEG_QUALITY" -gt 100 ] || [ "$WEBP_QUALITY" -gt 100 ]; then
  echo "Error: quality values must be <= 100." >&2
  exit 1
fi

if [ "$IN_PLACE" -eq 1 ]; then
  OUTPUT_DIR="$INPUT_DIR"
elif [ -z "$OUTPUT_DIR" ]; then
  OUTPUT_DIR="${INPUT_DIR%/}-optimized"
fi

require_cmd sips

if [ "$TO_WEBP" -eq 1 ]; then
  if ! command -v cwebp >/dev/null 2>&1; then
    echo "Error: --to-webp requested but cwebp is not installed." >&2
    echo "Install with: brew install webp" >&2
    exit 1
  fi
fi

mkdir -p "$OUTPUT_DIR"

INPUT_ABS="$(cd "$INPUT_DIR" && pwd)"
OUTPUT_ABS="$(cd "$OUTPUT_DIR" && pwd)"

if [ "$IN_PLACE" -eq 0 ] && is_subpath "$INPUT_ABS" "$OUTPUT_ABS"; then
  echo "Error: output directory must not be inside input directory (to avoid recursive reprocessing)." >&2
  echo "Input:  $INPUT_ABS" >&2
  echo "Output: $OUTPUT_ABS" >&2
  exit 1
fi

MAX_BYTES=$((MAX_KB * 1024))

if [ "$DRY_RUN" -eq 1 ]; then
  echo "[dry-run] input:  $INPUT_ABS"
  echo "[dry-run] output: $OUTPUT_ABS"
else
  echo "input:  $INPUT_ABS"
  echo "output: $OUTPUT_ABS"
fi

echo "settings: max-width=${MAX_WIDTH}px jpeg-quality=${JPEG_QUALITY} webp-quality=${WEBP_QUALITY} max-size=${MAX_KB}KB to-webp=${TO_WEBP} in-place=${IN_PLACE}"

total=0
optimized=0
oversized=0
skipped=0
before_sum=0
after_sum=0

while IFS= read -r -d '' src; do
  total=$((total + 1))

  rel="${src#"$INPUT_ABS"/}"
  rel_dir="$(dirname "$rel")"
  file_name="$(basename "$src")"
  base_name="${file_name%.*}"
  ext_raw="${file_name##*.}"
  ext="$(printf '%s' "$ext_raw" | tr '[:upper:]' '[:lower:]')"

  if [ "$TO_WEBP" -eq 1 ]; then
    out_ext="webp"
  else
    case "$ext" in
      jpg|jpeg|heic|heif|tif|tiff) out_ext="jpg" ;;
      png) out_ext="png" ;;
      *)
        skipped=$((skipped + 1))
        echo "skip: unsupported extension for $src" >&2
        continue
        ;;
    esac
  fi

  if [ "$rel_dir" = "." ]; then
    dst_dir="$OUTPUT_ABS"
  else
    dst_dir="$OUTPUT_ABS/$rel_dir"
  fi
  dst="$dst_dir/$base_name.$out_ext"

  if [ "$DRY_RUN" -eq 0 ]; then
    mkdir -p "$dst_dir"
  fi

  before_bytes=$(wc -c < "$src" | tr -d ' ')
  before_sum=$((before_sum + before_bytes))

  if [ "$DRY_RUN" -eq 1 ]; then
    echo "[dry-run] $src -> $dst"
    continue
  fi

  tmp_resized="$(mktemp /tmp/wangen-img-resized.XXXXXX)"
  tmp_jpeg=""

  sips -Z "$MAX_WIDTH" "$src" --out "$tmp_resized" >/dev/null 2>&1

  if [ "$TO_WEBP" -eq 1 ]; then
    tmp_jpeg="$(mktemp /tmp/wangen-img-jpeg.XXXXXX.jpg)"
    sips -s format jpeg -s formatOptions "$JPEG_QUALITY" "$tmp_resized" --out "$tmp_jpeg" >/dev/null 2>&1
    cwebp -quiet -q "$WEBP_QUALITY" "$tmp_jpeg" -o "$dst" >/dev/null
  else
    if [ "$out_ext" = "jpg" ]; then
      sips -s format jpeg -s formatOptions "$JPEG_QUALITY" "$tmp_resized" --out "$dst" >/dev/null 2>&1
    else
      sips -s format png "$tmp_resized" --out "$dst" >/dev/null 2>&1
    fi
  fi

  rm -f "$tmp_resized"
  if [ -n "$tmp_jpeg" ]; then
    rm -f "$tmp_jpeg"
  fi

  if [ "$IN_PLACE" -eq 1 ] && [ "$dst" != "$src" ]; then
    rm -f "$src"
  fi

  after_bytes=$(wc -c < "$dst" | tr -d ' ')
  after_sum=$((after_sum + after_bytes))
  optimized=$((optimized + 1))

  if [ "$after_bytes" -gt "$MAX_BYTES" ]; then
    oversized=$((oversized + 1))
    status="OVERSIZE"
  else
    status="ok"
  fi

  echo "$status: $rel -> $(bytes_human "$after_bytes") (was $(bytes_human "$before_bytes"), saved $(ratio_percent "$before_bytes" "$after_bytes"))"
done < <(find "$INPUT_ABS" -type f \( \
  -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o \
  -iname '*.tif' -o -iname '*.tiff' -o -iname '*.heic' -o -iname '*.heif' \
\) -print0)

if [ "$DRY_RUN" -eq 1 ]; then
  echo "dry-run complete: scanned $total files"
  exit 0
fi

echo
echo "Done. files scanned: $total, optimized: $optimized, skipped: $skipped"
if [ "$optimized" -gt 0 ]; then
  echo "Total size: $(bytes_human "$before_sum") -> $(bytes_human "$after_sum")"
fi

if [ "$oversized" -gt 0 ]; then
  echo "Error: $oversized optimized file(s) are still larger than ${MAX_KB}KB." >&2
  exit 2
fi
