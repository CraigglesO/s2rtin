const fs = require('fs')
const { PNG } = require('pngjs')

const png = PNG.sync.read(fs.readFileSync('./fixtures/s2/14.png'))
const { data } = png

// decode terrain values
for (let y = 0; y < 512; y++) {
  for (let x = 0; x < 512; x++) {
    const k = (y * 512 + x) * 4
    const r = data[k + 0]
    const g = data[k + 1]
    const b = data[k + 2]
    const elev = (r * 256 * 256 + g * 256 + b) / 10 - 10000
    const newElev = encode(elev)
    data[k + 0] = newElev[0] // red
    data[k + 1] = newElev[1] // green
    data[k + 2] = newElev[2] // blue
  }
}

const buffer = PNG.sync.write(png)
fs.writeFileSync('./14New.png', buffer)

function encode (elev) {
  elev = Math.round((elev + 83886) * 100)

  return [(elev >> 16) & 255, (elev >> 8) & 255, elev & 255]
}
