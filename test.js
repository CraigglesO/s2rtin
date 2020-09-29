const fs = require('fs')
const { PNG } = require('pngjs')
// const jpeg = require('jpeg-js')
// const { S2Rtin, terrainToGrid } = require('./lib')

// const ZOOM = 17

const png = PNG.sync.read(fs.readFileSync('./fixtures/raw.png'))
const { data } = png

const terrain = new Uint8Array(512 * 512 * 3)

// decode terrain values
for (let y = 0; y < 512; y++) {
  for (let x = 0; x < 512; x++) {
    const k = (y * 512 + x) * 4
    const r = data[k + 0]
    const g = data[k + 1]
    const b = data[k + 2]
    terrain[y * 512 + x] = r
    terrain[y * 512 + x + 1] = g
    terrain[y * 512 + x + 2] = b
  }
}
fs.writeFileSync('./res.raw', terrain)

// const dem = PNG.sync.read(fs.readFileSync(`./fixtures/s2/${ZOOM}.png`))
// const dem = jpeg.decode(fs.readFileSync(`./fixtures/s2/${ZOOM}.jpg`))
// console.log('dem', dem)
// const terrain = terrainToGrid(dem)
// console.log('terrain', terrain)

// console.time('rtin')
// const s2rtin = new S2Rtin(dem.width)
// const tile = s2rtin.createTile(terrain)
// const approxBestError = s2rtin.approximateBestError(ZOOM)
// console.log('approxBestError', approxBestError)
// const mesh = tile.getMesh(approxBestError)
// console.timeEnd('rtin')
//
// console.log('MESH', mesh)
// console.log(mesh.vertices.length)
// console.log('tile', tile)

// 14: 1.8
// 15: 1.5
// 16: 1.2
// 17: 1
