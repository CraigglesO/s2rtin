const fs = require('fs')
const { PNG } = require('pngjs')
const { S2Rtin, terrainToGrid } = require('./lib')

const ZOOM = 14

const fuji = PNG.sync.read(fs.readFileSync(`./fixtures/s2/${ZOOM}.png`))
const terrain = terrainToGrid(fuji)
// console.log('terrain', terrain)

console.time('rtin')
const s2rtin = new S2Rtin(fuji.width)
const tile = s2rtin.createTile(terrain)
const approxBestError = s2rtin.approximateBestError(ZOOM)
console.log('approxBestError', approxBestError)
const mesh = tile.getMesh(approxBestError)
console.timeEnd('rtin')

console.log('MESH', mesh)
console.log(mesh.vertices.length)
// console.log('tile', tile)

// 14: 1.8
// 15: 1.5
// 16: 1.2
// 17: 1
