import { latLngToCartesian } from './geo'

describe('latLngToCartesian', () => {
  it('maps equator and prime meridian to +X axis', () => {
    const point = latLngToCartesian(0, 0, 1)
    expect(point.x).toBeCloseTo(1, 4)
    expect(point.y).toBeCloseTo(0, 4)
    expect(point.z).toBeCloseTo(0, 4)
  })

  it('maps north pole to +Y axis', () => {
    const point = latLngToCartesian(90, 0, 1)
    expect(point.x).toBeCloseTo(0, 4)
    expect(point.y).toBeCloseTo(1, 4)
    expect(point.z).toBeCloseTo(0, 4)
  })
})
