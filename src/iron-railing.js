import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Audited connected components: the two rear panels and three side panels,
// including posts, lower feet, and their complete outline shells. Not the postbox.
const railingFaces = {
  Object649_Plastic_Soft_0: [ [ 9492, 10207 ], [ 12894, 13924 ], [ 16816, 16818 ], [ 16843, 16844 ] ],
  Object674_outline_0: [ [ 10131, 10848 ], [ 18642, 19675 ] ]
};

export function addBostonIronRailing( model ) {
  const anchor = model.getObjectByName( 'Object649' );
  if ( ! anchor ) throw new Error( 'Missing Boston railing anchor' );
  for ( const [ name, ranges ] of Object.entries( railingFaces ) ) {
    const mesh = model.getObjectByName( name ), original = mesh?.geometry;
    if ( ! original?.index ) throw new Error( `Missing Boston railing surface: ${name}` );
    // Retain all earlier masking and original face IDs used by approved signs.
    const geometry = new THREE.BufferGeometry();
    for ( const [ key, attribute ] of Object.entries( original.attributes ) ) geometry.setAttribute( key, attribute );
    geometry.setIndex( original.index.clone() );
    geometry.groups = original.groups.map( group => ( { ...group } ) );
    for ( const [ first, last ] of ranges ) {
      if ( last * 3 + 2 >= geometry.index.count ) throw new Error( 'Boston railing face range changed' );
      for ( let face = first; face <= last; face ++ ) {
        const vertex = geometry.index.getX( face * 3 );
        geometry.index.setX( face * 3 + 1, vertex );
        geometry.index.setX( face * 3 + 2, vertex );
      }
    }
    mesh.geometry = geometry;
  }

  const railing = new THREE.Group(); railing.name = 'bostonIronRailing'; anchor.add( railing );
  const material = new THREE.MeshStandardMaterial( { color: '#1c201e', metalness: 0.25, roughness: 0.85 } );
  material.name = 'bostonWeatheredIron';
  const parts = [];
  const box = ( width, depth, height, x, y, z, angle = 0 ) => {
    const geometry = new THREE.BoxGeometry( width, depth, height );
    geometry.rotateZ( angle ); geometry.translate( x, y, z ); parts.push( geometry );
  };
  // Source coordinates are Z-up. Bases and post centers match the old railing.
  const base = - 201.337;
  const runs = [
    [ [ - 130.5375, 61.6097 ], [ - 92.9132, 99.2005 ], [ - 55.1887, 136.9251 ] ],
    [ [ - 172.7395, - 21.4077 ], [ - 172.7395, - 74.3356 ], [ - 172.7395, - 127.6812 ], [ - 172.7395, - 180.8598 ] ]
  ];
  for ( const posts of runs ) {
    const angle = Math.atan2( posts[ 1 ][ 1 ] - posts[ 0 ][ 1 ], posts[ 1 ][ 0 ] - posts[ 0 ][ 0 ] );
    for ( const [ x, y ] of posts ) {
      box( 4.6, 4.6, 1.2, x, y, base + 0.6, angle );
      box( 3, 3, 31.4, x, y, base + 16.7, angle );
      box( 4.1, 4.1, 1, x, y, base + 32.1, angle );
    }
    for ( let i = 1; i < posts.length; i ++ ) {
      const a = posts[ i - 1 ], b = posts[ i ];
      const length = Math.hypot( b[ 0 ] - a[ 0 ], b[ 1 ] - a[ 1 ] );
      for ( const z of [ base + 7.5, base + 26.5 ] ) box( length, 2.1, 2.1, ( a[ 0 ] + b[ 0 ] ) / 2, ( a[ 1 ] + b[ 1 ] ) / 2, z, angle );
      for ( let bar = 1; bar <= 6; bar ++ ) {
        const t = bar / 7;
        box( 1.25, 1.25, 19, a[ 0 ] + ( b[ 0 ] - a[ 0 ] ) * t, a[ 1 ] + ( b[ 1 ] - a[ 1 ] ) * t, base + 17, angle );
      }
    }
  }
  const mesh = new THREE.Mesh( mergeGeometries( parts ), material );
  mesh.name = 'bostonIronRailingSections'; railing.add( mesh );
  parts.forEach( geometry => geometry.dispose() );
}
