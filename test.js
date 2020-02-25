const fs = require('fs')
const { PNG } = require('pngjs')
const S2Rtin = require('./lib').default
const { terrainToGrid } = require('./lib')

const ZOOM = 8

const fuji = PNG.sync.read(fs.readFileSync(`./fixtures/s2/${ZOOM}.png`))
const terrain = terrainToGrid(fuji)

console.time('rtin')
const s2rtin = new S2Rtin(fuji.width + 1)
const tile = s2rtin.createTile(terrain)
const approxBestError = s2rtin.approximateBestError(ZOOM)
// console.log('approxBestError', approxBestError)
const mesh = tile.getMesh(approxBestError)
console.timeEnd('rtin')

console.log('MESH', mesh)
// console.log('tile', tile)
