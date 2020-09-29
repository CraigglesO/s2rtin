// Real-time Right-Triangulated Irregular Networks for S2 Projected RGB Elevation Encoded Tiles
class S2Rtin {
  constructor (tileSize = 512) {
    this.gridSize = tileSize + 1

    this.numTriangles = tileSize * tileSize * 2 - 2
    this.numParentTriangles = this.numTriangles - tileSize * tileSize

    this.indices = new Uint32Array(this.gridSize * this.gridSize)

    // coordinates for all possible triangles in an RTIN tile
    this.coords = new Uint16Array(this.numTriangles * 4)

    // get triangle coordinates from its index in an implicit binary tree
    for (let i = 0; i < this.numTriangles; i++) {
      let id = i + 2
      let ax = 0; let ay = 0; let bx = 0; let by = 0; let cx = 0; let cy = 0
      if (id & 1) {
        bx = by = cx = tileSize // bottom-left triangle
      } else {
        ax = ay = cy = tileSize // top-right triangle
      }
      while ((id >>= 1) > 1) {
        const mx = (ax + bx) >> 1
        const my = (ay + by) >> 1

        if (id & 1) { // left half
          bx = ax; by = ay
          ax = cx; ay = cy
        } else { // right half
          ax = bx; ay = by
          bx = cx; by = cy
        }
        cx = mx; cy = my
      }
      const k = i * 4
      this.coords[k + 0] = ax
      this.coords[k + 1] = ay
      this.coords[k + 2] = bx
      this.coords[k + 3] = by
    }
  }

  createTile (terrain) {
    if (terrain.length !== this.gridSize * this.gridSize) throw new Error(`incompatable dimension. Image must be of size: ${this.gridSize - 1}`)
    return new Tile(terrain, this)
  }

  // 7842KM is the rough edge length of one S2 cell at zoom 0 (a face or 1/4 the circumferance of the earth)
  // this is a quick and dirty way of approximating an appropriate maxError for generating a mesh
  approximateBestError (zoom) {
    if (zoom >= 14) {
      switch (zoom) {
        case 14: return 1.6
        case 15: return 1.5
        case 16: return 1.2
        case 17:
        default: return 1
      }
    } else { return Math.floor(7842000 / (1 << zoom) / (this.gridSize - 1)) }
  }
}

class Tile {
  constructor (terrain, martini) {
    const size = martini.gridSize
    if (terrain.length !== size * size) {
      throw new Error(`Expected terrain data of length ${size * size} (${size} x ${size}), got ${terrain.length}.`)
    }

    this.terrain = terrain
    this.martini = martini
    this.errors = new Float32Array(terrain.length)
    this.update()
  }

  update () {
    const { numTriangles, numParentTriangles, coords, gridSize: size } = this.martini
    const { terrain, errors } = this

    // iterate over all possible triangles, starting from the smallest level
    let k, ax, ay, bx, by, mx, my, cx, cy,
      interpolatedHeight, middleIndex,
      leftChildIndex, rightChildIndex
    for (let i = numTriangles - 1; i >= 0; i--) {
      k = i * 4
      ax = coords[k + 0]
      ay = coords[k + 1]
      bx = coords[k + 2]
      by = coords[k + 3]
      mx = (ax + bx) >> 1
      my = (ay + by) >> 1
      cx = mx + my - ay
      cy = my + ax - mx

      // calculate error in the middle of the long edge of the triangle
      interpolatedHeight = (terrain[ay * size + ax] + terrain[by * size + bx]) / 2
      middleIndex = my * size + mx
      errors[middleIndex] = Math.max(errors[middleIndex], Math.abs(interpolatedHeight - terrain[middleIndex]))

      if (i < numParentTriangles) { // bigger triangles; accumulate error with children
        leftChildIndex = ((ay + cy) >> 1) * size + ((ax + cx) >> 1)
        rightChildIndex = ((by + cy) >> 1) * size + ((bx + cx) >> 1)
        errors[middleIndex] = Math.max(errors[middleIndex], errors[leftChildIndex], errors[rightChildIndex])
      }
    }
  }

  getMesh (maxError = 0, extent = 4096, radius = 6371008.8) {
    const { gridSize: size, indices } = this.martini
    const { terrain, errors } = this
    let numVertices = 0
    let numTriangles = 0
    const max = size - 1

    // use an index grid to keep track of vertices that were already used to avoid duplication
    indices.fill(0)

    // retrieve mesh in two stages that both traverse the error map:
    // - countElements: find used vertices (and assign each an index), and count triangles (for minimum allocation)
    // - processTriangle: fill the allocated vertices & triangles typed arrays

    function countElements (ax, ay, bx, by, cx, cy) {
      const mx = (ax + bx) >> 1
      const my = (ay + by) >> 1

      if (Math.abs(ax - cx) + Math.abs(ay - cy) > 1 && errors[my * size + mx] > maxError) {
        countElements(cx, cy, ax, ay, mx, my)
        countElements(bx, by, cx, cy, mx, my)
      } else {
        indices[ay * size + ax] = indices[ay * size + ax] || ++numVertices
        indices[by * size + bx] = indices[by * size + bx] || ++numVertices
        indices[cy * size + cx] = indices[cy * size + cx] || ++numVertices
        numTriangles++
      }
    }

    countElements(0, 0, max, max, max, 0)
    countElements(max, max, 0, 0, 0, max)

    const vertices = new Int16Array(numVertices * 2)
    const radii = new Float32Array(numVertices)
    const triangles = new Uint32Array(numTriangles * 3)
    let triIndex = 0

    function processTriangle (ax, ay, bx, by, cx, cy) {
      const mx = (ax + bx) >> 1
      const my = (ay + by) >> 1

      if (Math.abs(ax - cx) + Math.abs(ay - cy) > 1 && errors[my * size + mx] > maxError) {
        // triangle doesn't approximate the surface well enough; drill down further
        processTriangle(cx, cy, ax, ay, mx, my)
        processTriangle(bx, by, cx, cy, mx, my)
      } else {
        // add a triangle
        const a = indices[ay * size + ax] - 1
        const b = indices[by * size + bx] - 1
        const c = indices[cy * size + cx] - 1

        vertices[2 * a] = Math.round(ax / max * extent)
        vertices[2 * a + 1] = Math.round((1 - (ay / max)) * extent)
        radii[a] = terrain[ay * size + ax] / radius

        vertices[2 * b] = Math.round(bx / max * extent)
        vertices[2 * b + 1] = Math.round((1 - (by / max)) * extent)
        radii[b] = terrain[by * size + bx] / radius

        vertices[2 * c] = Math.round(cx / max * extent)
        vertices[2 * c + 1] = Math.round((1 - (cy / max)) * extent)
        radii[c] = terrain[cy * size + cx] / radius

        triangles[triIndex++] = a
        triangles[triIndex++] = b
        triangles[triIndex++] = c
      }
    }
    processTriangle(0, 0, max, max, max, 0)
    processTriangle(max, max, 0, 0, 0, max)

    return { vertices, triangles, radii }
  }
}

function terrainToGrid (image) {
  const { width, data } = image
  const tileSize = width
  const gridSize = tileSize + 1
  const terrain = new Float32Array(gridSize * gridSize)
  // decode terrain values
  for (let y = 0; y < tileSize; y++) {
    for (let x = 0; x < tileSize; x++) {
      const k = (y * tileSize + x) * 4
      const r = data[k + 0]
      const g = data[k + 1]
      const b = data[k + 2]
      terrain[y * gridSize + x] = ((r << 16) + (g << 8) + b) / 100 - 83886
    }
  }
  // backfill right and bottom borders
  for (let x = 0; x < gridSize - 1; x++) {
    terrain[gridSize * (gridSize - 1) + x] = terrain[gridSize * (gridSize - 2) + x]
  }
  for (let y = 0; y < gridSize; y++) {
    terrain[gridSize * y + gridSize - 1] = terrain[gridSize * y + gridSize - 2]
  }

  return terrain
}

exports.S2Rtin = S2Rtin
exports.terrainToGrid = terrainToGrid
