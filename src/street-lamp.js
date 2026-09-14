import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Audited connected components of the front-right utility pole at
// Object649-local (230.08, -214.47). These are original GLB triangle numbers.
// Both pole systems are isolated; trolley lines and street signs stay intact.
const removedFaces = {
  Object649_normal_0: [ [ 19054, 19075 ], [ 27124, 27208 ], [ 29088, 29088 ], [ 29215, 29216 ] ],
  Object649_Plastic_Soft_0: [
    [ 308, 747 ], [ 16926, 16929 ], // three complete outgoing runs and crossarm loop
    [ 5204, 5533 ], [ 16883, 16888 ], // pole boxes and six insulators
    [ 15919, 15997 ], [ 16790, 16790 ] // conduit and foot collar
  ],
  Object649_metalmat_0: [ [ 3183, 3198 ] ], // diagonal crossarm braces
  Object649_paintmat_0: [ [ 4087, 4207 ], [ 9415, 9415 ] ], // old green lamp and neck
  Object649_glassmat_0: [ [ 0, 29 ] ], // separate lens underneath the old green lamp
  Object674_outline_0: [ [ 34925, 35089 ], [ 40345, 40345 ] ],
  Object674_outline_0_1: [
    [ 6020, 6109 ], [ 6196, 6594 ], [ 9045, 9053 ] // hardware outlines; retain sign borders
  ]
};

// Rear pole at (-124.42, 254.21), independently audited. Includes all three
// outgoing runs and their short opposite stubs, not the lower trolley lines.
const rearFaces = {
  Object649_normal_0: [ [ 6160, 6266 ], [ 29250, 29252 ] ],
  Object649_Plastic_Soft_0: [ [ 1529, 2404 ], [ 16909, 16920 ] ],
  Object649_metalmat_0: [ [ 252, 267 ] ],
  Object649_paintmat_0: [ [ 344, 464 ], [ 9437, 9437 ] ],
  Object649_glassmat_0: [ [ 34, 63 ] ],
  Object674_outline_0_1: [ [ 0, 469 ], [ 556, 706 ], [ 9113, 9113 ], [ 9116, 9123 ] ]
};

export function addBostonStreetLamp( model ) {
  const anchor = model.getObjectByName( 'Object649' );
  if ( ! anchor ) return;
  // These two birds and four animated wings perched on the removed crossarm.
  // Hide only their meshes; the shared skeleton and all other birds remain.
  for ( const name of [ 'Object698_normal_0', 'Object699_normal_0', 'Plane107_normal_0', 'Plane108_normal_0', 'Plane109_normal_0', 'Plane110_normal_0' ] ) {
    const mesh = model.getObjectByName( name );
    if ( mesh?.isMesh ) mesh.visible = false;
  }
  const combinedFaces = { ...removedFaces };
  for ( const [ name, ranges ] of Object.entries( rearFaces ) ) combinedFaces[ name ] = [ ...( combinedFaces[ name ] || [] ), ...ranges ];
  for ( const [ name, ranges ] of Object.entries( combinedFaces ) ) {
    const mesh = model.getObjectByName( name );
    if ( ! mesh?.geometry.index ) throw new Error( `Missing audited utility-pole mesh: ${name}` );
    // Share read-only vertex data, but use a private index buffer. Degenerate
    // only selected triangles, preserving every other face and its numbering.
    const original = mesh.geometry;
    const geometry = new THREE.BufferGeometry();
    for ( const [ key, attribute ] of Object.entries( original.attributes ) ) geometry.setAttribute( key, attribute );
    geometry.setIndex( original.index.clone() );
    geometry.groups = original.groups.map( group => ( { ...group } ) );
    for ( const [ first, last ] of ranges ) {
      if ( last * 3 + 2 >= geometry.index.count ) throw new Error( `Utility-pole face range changed: ${name}` );
      for ( let face = first; face <= last; face ++ ) {
        const vertex = geometry.index.getX( face * 3 );
        geometry.index.setX( face * 3 + 1, vertex );
        geometry.index.setX( face * 3 + 2, vertex );
      }
    }
    mesh.geometry = geometry;
  }

  const lamp = new THREE.Group();
  lamp.name = 'bostonStreetLamp';
  lamp.position.set( 230.08, - 214.47, - 201 );
  lamp.rotation.x = Math.PI / 2; // primitives are Y-up; Object649 is Z-up
  anchor.add( lamp );
  const metal = new THREE.MeshStandardMaterial( { color: '#202725', roughness: 0.72, metalness: 0.25 } );
  metal.name = 'bostonStreetLampIron';
  const parts = [];
  const add = ( geometry, x = 0, y = 0, z = 0 ) => {
    geometry.translate( x, y, z );
    parts.push( geometry );
  };
  const profile = [ [ 4.8, 0 ], [ 4.8, 2 ], [ 4.2, 3 ], [ 3.6, 4 ], [ 3.6, 16 ], [ 4, 17 ], [ 4, 19 ], [ 3.2, 20 ], [ 2.8, 27 ], [ 2.4, 29 ], [ 2.4, 31 ], [ 1.7, 33 ] ];
  add( new THREE.LatheGeometry( profile.map( ( [ radius, y ] ) => new THREE.Vector2( radius, y ) ), 8 ) );
  add( new THREE.CylinderGeometry( 1.35, 1.7, 88, 8 ), 0, 77 );
  for ( const [ y, radius, height ] of [ [ 34, 2.1, 2 ], [ 116, 2.1, 2 ], [ 120, 2.8, 2 ], [ 124, 4.4, 2 ], [ 128, 5.9, 1.7 ] ] ) {
    add( new THREE.CylinderGeometry( radius, radius, height, 8 ), 0, y );
  }
  add( new THREE.CylinderGeometry( 4.4, 2.8, 4, 8 ), 0, 122 );
  // Narrow brackets keep the existing Fenway and traffic signs attached.
  for ( const y of [ 48, 62, 81 ] ) add( new THREE.BoxGeometry( 1.4, 1.4, 5.5 ), 0, y, 2.5 );
  const bottom = 129, top = 149, lowerRadius = 6, upperRadius = 8;
  const paneGeometry = new THREE.CylinderGeometry( upperRadius, lowerRadius, top - bottom, 4, 1, true );
  paneGeometry.rotateY( Math.PI / 4 );
  paneGeometry.translate( 0, ( bottom + top ) / 2, 0 );
  for ( let i = 0; i < 4; i ++ ) {
    const angle = Math.PI / 4 + i * Math.PI / 2;
    const a = new THREE.Vector3( Math.sin( angle ) * lowerRadius, bottom, Math.cos( angle ) * lowerRadius );
    const b = new THREE.Vector3( Math.sin( angle ) * upperRadius, top, Math.cos( angle ) * upperRadius );
    const direction = b.clone().sub( a );
    const bar = new THREE.CylinderGeometry( 0.48, 0.48, direction.length(), 5 );
    bar.applyQuaternion( new THREE.Quaternion().setFromUnitVectors( new THREE.Vector3( 0, 1, 0 ), direction.normalize() ) );
    const middle = a.add( b ).multiplyScalar( 0.5 );
    add( bar, middle.x, middle.y, middle.z );
  }
  for ( const [ y, radius ] of [ [ bottom, lowerRadius ], [ top, upperRadius ] ] ) {
    const rail = new THREE.CylinderGeometry( radius + 0.3, radius + 0.3, 1.3, 4 );
    rail.rotateY( Math.PI / 4 ); add( rail, 0, y );
  }
  const roof = new THREE.ConeGeometry( 9.7, 6.5, 4 );
  roof.rotateY( Math.PI / 4 ); add( roof, 0, 153 );
  add( new THREE.CylinderGeometry( 1.3, 2.3, 3, 8 ), 0, 157 );
  add( new THREE.SphereGeometry( 1.4, 8, 4 ), 0, 159.2 );
  add( new THREE.ConeGeometry( 1.2, 3, 8 ), 0, 161 );
  const frame = new THREE.Mesh( mergeGeometries( parts ), metal );
  frame.name = 'bostonStreetLampFrame';
  lamp.add( frame );
  parts.forEach( geometry => geometry.dispose() );
  const glass = new THREE.MeshStandardMaterial( {
    color: '#F4B34A', emissive: '#F4B34A', emissiveIntensity: 1.1,
    roughness: 0.5, side: THREE.DoubleSide
  } );
  glass.name = 'bostonStreetLampAmber';
  const panes = new THREE.Mesh( paneGeometry, glass );
  panes.name = 'bostonStreetLampPanes';
  lamp.add( panes );

  const rearLamp = lamp.clone( true );
  rearLamp.name = 'bostonStreetLamp2';
  rearLamp.position.set( - 124.42, 254.21, - 201 );
  rearLamp.quaternion.premultiply( new THREE.Quaternion().setFromAxisAngle( new THREE.Vector3( 0, 0, 1 ), Math.PI / 2 ) );
  rearLamp.children.forEach( child => { child.name = child.name.replace( 'bostonStreetLamp', 'bostonStreetLamp2' ); } );
  // A lower bracket supports the rear pole's retained traffic plate.
  const rearFrame = rearLamp.children[ 0 ];
  const bracket = new THREE.BoxGeometry( 1.4, 1.4, 7 );
  bracket.translate( 0, 35, 3.2 );
  rearFrame.geometry = mergeGeometries( [ frame.geometry, bracket ] );
  bracket.dispose();
  anchor.add( rearLamp );
}
