export const ASCII_CHARS =
  " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@";
export const CHAR_PIXEL_ASPECT = 0.55;
export const DEFAULT_COLUMNS = 96;

const LUMINANCE_RED_COEFF = 0.2126;
const LUMINANCE_GREEN_COEFF = 0.7152;
const LUMINANCE_BLUE_COEFF = 0.0722;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function convertImageDataToAscii(imageData: ImageData) {
  const { width, height, data } = imageData;
  let ascii = "";

  for (let y = 0; y < height; y += 1) {
    let row = "";
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const luminance =
        LUMINANCE_RED_COEFF * r +
        LUMINANCE_GREEN_COEFF * g +
        LUMINANCE_BLUE_COEFF * b;
      const normalized = clamp(luminance / 255, 0, 1);
      const index = Math.min(
        ASCII_CHARS.length - 1,
        Math.floor((1 - normalized) * (ASCII_CHARS.length - 1))
      );
      row += ASCII_CHARS[index];
    }
    ascii += row + "\n";
  }

  return ascii;
}
