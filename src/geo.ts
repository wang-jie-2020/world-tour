import * as THREE from "three";

export function latLonToVector3(
  latDeg: number,
  lonDeg: number,
  radius = 1
): THREE.Vector3 {
  const lat = THREE.MathUtils.degToRad(latDeg);
  const lon = THREE.MathUtils.degToRad(lonDeg);
  const cosLat = Math.cos(lat);

  return new THREE.Vector3(
    radius * cosLat * Math.sin(lon),
    radius * Math.sin(lat),
    radius * cosLat * Math.cos(lon)
  );
}

export function randomPointInCap(
  center: THREE.Vector3,
  angularRadiusDeg: number,
  radius = 1
): THREE.Vector3 {
  const angle = THREE.MathUtils.degToRad(angularRadiusDeg);
  const u = Math.random();
  const v = Math.random();
  const cosTheta = 1 - u * (1 - Math.cos(angle));
  const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
  const phi = 2 * Math.PI * v;

  const tangent = new THREE.Vector3(0, 1, 0);
  if (Math.abs(center.dot(tangent)) > 0.95) {
    tangent.set(1, 0, 0);
  }

  const bitangent = new THREE.Vector3().crossVectors(center, tangent).normalize();
  tangent.crossVectors(bitangent, center).normalize();

  return new THREE.Vector3()
    .copy(center)
    .multiplyScalar(cosTheta)
    .addScaledVector(tangent, sinTheta * Math.cos(phi))
    .addScaledVector(bitangent, sinTheta * Math.sin(phi))
    .normalize()
    .multiplyScalar(radius);
}

export function buildRegionBoundary(
  center: THREE.Vector3,
  angularRadiusDeg: number,
  segments = 90,
  radius = 1
): THREE.BufferGeometry {
  const capAngle = THREE.MathUtils.degToRad(angularRadiusDeg);
  const points: THREE.Vector3[] = [];

  const tangent = new THREE.Vector3(0, 1, 0);
  if (Math.abs(center.dot(tangent)) > 0.95) {
    tangent.set(1, 0, 0);
  }
  const bitangent = new THREE.Vector3().crossVectors(center, tangent).normalize();
  tangent.crossVectors(bitangent, center).normalize();

  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2;
    const ringDir = new THREE.Vector3()
      .copy(tangent)
      .multiplyScalar(Math.cos(t))
      .addScaledVector(bitangent, Math.sin(t));

    const point = new THREE.Vector3()
      .copy(center)
      .multiplyScalar(Math.cos(capAngle))
      .addScaledVector(ringDir, Math.sin(capAngle))
      .normalize()
      .multiplyScalar(radius);

    points.push(point);
  }

  return new THREE.BufferGeometry().setFromPoints(points);
}

