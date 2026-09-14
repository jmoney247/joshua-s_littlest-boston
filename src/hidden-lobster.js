import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function addHiddenLobster( model ) {
  const anchor = model.getObjectByName( 'body' );
  if ( ! anchor?.getObjectByName( 'body_normal_0' ) ) return null;
  // Keep the original animated parent, hiding only the replaced mascot meshes.
  for ( const name of [ 'body_normal_0', 'leaf_normal_0', 'hand1_normal_0', 'hand2_normal_0', 'foot1_normal_0', 'foot2_normal_0' ] ) {
    const mesh = anchor.getObjectByName( name );
    if ( mesh?.isMesh ) mesh.visible = false;
  }
  const lobster = new THREE.Group();
  lobster.name = 'bostonHiddenLobster';
  // Character-local Z is upright; match its foot level and inherit its motion.
  lobster.position.set( 0, 0, - 0.23 );
  lobster.scale.setScalar( 1.2 );
  lobster.rotation.z = - 0.45;
  anchor.add( lobster );
  const shellParts = [], eyeParts = [];
  function oval( parts, x, y, z, sx, sy, sz ) {
    const geometry = new THREE.SphereGeometry( 1, 8, 6 );
    geometry.scale( sx, sy, sz ); geometry.translate( x, y, z ); parts.push( geometry );
  }
  function limb( ax, ay, az, bx, by, bz, radius ) {
    const a = new THREE.Vector3( ax, ay, az ), b = new THREE.Vector3( bx, by, bz );
    const direction = b.clone().sub( a );
    const geometry = new THREE.CylinderGeometry( radius * 0.7, radius, direction.length(), 5 );
    geometry.applyQuaternion( new THREE.Quaternion().setFromUnitVectors( new THREE.Vector3( 0, 1, 0 ), direction.normalize() ) );
    geometry.translate( ( ax + bx ) / 2, ( ay + by ) / 2, ( az + bz ) / 2 ); shellParts.push( geometry );
  }
  oval( shellParts, 0, 0, 2, 2.8, 4.5, 1.9 );
  for ( let i = 0; i < 4; i ++ ) oval( shellParts, 0, - 4 - i * 1.35, 1.45, 2.3 - i * 0.25, 0.95, 1.1 );
  for ( const x of [ - 1.6, 0, 1.6 ] ) oval( shellParts, x, - 9.2, 0.7, 1.25, 1.6, 0.45 );
  for ( const side of [ - 1, 1 ] ) {
    for ( let i = 0; i < 4; i ++ ) {
      const y = 2 - i * 1.7;
      limb( side * 2.1, y, 1.5, side * 4, y - 0.4, 1, 0.24 );
      limb( side * 4, y - 0.4, 1, side * 4.8, y - 1.5, 0.2, 0.18 );
    }
    limb( side * 2, 2.5, 2, side * 5, 4, 1.8, 0.5 );
    limb( side * 5, 4, 1.8, side * 5.3, 6.7, 2, 0.6 );
    oval( shellParts, side * 5.3, 7.5, 2, 1.8, 2.3, 1.05 );
    // Two separated fingertips give each claw a readable open pincer.
    limb( side * 6.5, 8.4, 2, side * 6.1, 11, 2, 0.65 );
    limb( side * 4.2, 8.6, 2, side * 4.7, 10.7, 2, 0.55 );
    limb( side * 1.25, 3.3, 2.6, side * 1.4, 4.3, 3.2, 0.25 );
    oval( eyeParts, side * 1.4, 4.3, 3.2, 0.42, 0.42, 0.42 );
    limb( side * 0.8, 3.8, 2.6, side * 1.8, 7, 3, 0.12 );
    limb( side * 1.8, 7, 3, side * 3.1, 9.4, 3.2, 0.09 );
  }
  for ( const [ name, parts, color, roughness ] of [
    [ 'bostonHiddenLobsterShell', shellParts, '#c51c12', 0.7 ],
    [ 'bostonHiddenLobsterEyes', eyeParts, '#171612', 0.4 ]
  ] ) {
    const mesh = new THREE.Mesh( mergeGeometries( parts ), new THREE.MeshStandardMaterial( { color, roughness } ) );
    mesh.name = name; lobster.add( mesh ); parts.forEach( geometry => geometry.dispose() );
  }
  return lobster;
}
