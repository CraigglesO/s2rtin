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


// function encode (elev, precision = 2) {
//   elev = Math.round((elev + 83886) * Math.pow(10, precision))
//
//   return [(elev >> 16) & 255, (elev >> 8) & 255, elev & 255]
// }
//
// function decode (r, g, b, precision = 2) {
//   return ((r << 16) + (g << 8) + b) / Math.pow(10, precision) - 83886
// }

// 16777216 (1 << 24)
// 8388608 (16777216 / 2)

// assuming a precions of 2, than our largest number can be 83886

function encode (elev, precision = 2) {
  const multiplier = Math.pow(10, precision)
  const shift = Math.floor(8388608 / multiplier)
  elev = Math.round((elev + shift) * multiplier)

  return [(elev >> 16) & 255, (elev >> 8) & 255, elev & 255, 255 - precision]
}

function decode (r, g, b, precision = 2) {
  const multiplier = Math.pow(10, precision)
  const shift = Math.floor(8388608 / multiplier)

  return ((r << 16) + (g << 8) + b) / multiplier - shift
}

// range: [-8388608, 8388607)
// 8388607 -> considered a "dead" pixel, meaning it's not valid and should be ignored

// consider: 4 decimal places 838.8607

const elevation = 838820.3
const e = encode(elevation, 1)
const d = decode(e[0], e[1], e[2], 255 - e[3])

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
