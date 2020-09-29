// Highest Altitude (Terrestrial): 8,848m
// Lowest Depth (Bathymetry): 10,928m

// function encode (elev) {
//   elev += 83886 // increment to a positive value
//   elev *= 100 // multiply to store two decimals
//   elev = Math.round(elev) // flatten for 8 bit parsing
//   const r = (elev >> 16) & 255 // get red
//   const g = (elev >> 8) & 255 // get green
//   const b = elev & 255 // get blue
//   return [r, g, b]
// }
function encode (elev) {
  elev = Math.round((elev + 83886) * 100)

  return [(elev >> 16) & 255, (elev >> 8) & 255, elev & 255]
}

function decode (r, g, b) {
  return ((r << 16) + (g << 8) + b) / 100 - 83886
}

const elevation = 83886.01
const e = encode(elevation)
const d = decode(e[0], e[1], e[2])

console.log('original', elevation)
console.log('encoding', e)
console.log('decoding', d)

// function oldEncode () {
//
// }
//
// function oldDecode (r, g, b) {
//   return (r * 256 * 256 + g * 256 + b) / 10 - 10000
// }
