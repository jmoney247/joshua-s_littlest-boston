import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Two audited pillar-box components, raised postal markings and outline shells.
// Keep face numbering and every earlier mask; never modify the source GLB.
const sourceFaces = {
  Object649_paintmat_0: [ [ 4208, 4867 ], [ 7182, 7841 ] ],
  Object649_normal_0: [ [ 19076, 19081 ], [ 23297, 23302 ] ],
  Object674_outline_0: [ [ 21959, 22624 ] ],
  Object674_outline_0_1: [ [ 6595, 7260 ] ]
};

export function addUSMailboxes( model ) {
  const anchor = model.getObjectByName( 'Object649' );
  if ( ! anchor ) throw new Error( 'Missing mailbox anchor' );
  for ( const [ name, ranges ] of Object.entries( sourceFaces ) ) {
    const mesh = model.getObjectByName( name ), original = mesh.geometry;
    const geometry = new THREE.BufferGeometry();
    for ( const [ key, attribute ] of Object.entries( original.attributes ) ) geometry.setAttribute( key, attribute );
    geometry.setIndex( original.index.clone() );
    geometry.groups = original.groups.map( group => ( { ...group } ) );
    for ( const [ first, last ] of ranges ) for ( let face = first; face <= last; face ++ ) {
      const vertex = geometry.index.getX( face * 3 );
      geometry.index.setX( face * 3 + 1, vertex ); geometry.index.setX( face * 3 + 2, vertex );
    }
    mesh.geometry = geometry;
  }
  const root = new THREE.Group(); root.name = 'bostonUSMailboxes'; anchor.add( root );
  const blue = new THREE.MeshStandardMaterial( { color: '#244f7c', roughness: 0.76, metalness: 0.12 } );
  const dark = new THREE.MeshStandardMaterial( { color: '#152535', roughness: 0.8 } );
  const canvas = document.createElement( 'canvas' ); canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext( '2d' ); ctx.fillStyle = '#244f7c'; ctx.fillRect( 0, 0, 256, 128 );
  ctx.fillStyle = '#f4f0e7'; ctx.textAlign = 'center'; ctx.font = 'bold 36px Arial'; ctx.fillText( 'U.S. MAIL', 128, 58 );
  ctx.font = '18px Arial'; ctx.fillText( 'COLLECTION BOX', 128, 95 );
  const texture = new THREE.CanvasTexture( canvas ); texture.colorSpace = THREE.SRGBColorSpace;
  texture.name = 'bostonUSMailLabel';
  const labelMaterial = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } );
  for ( const [ name, x, y, angle ] of [ [ 'Front', 177.88, -206.02, 0 ], [ 'Rear', -114.3, 38.92, -Math.PI / 3 ] ] ) {
    const group = new THREE.Group(); group.name = 'bostonUSMailbox' + name;
    group.position.set( x, y, -201.23 ); group.rotation.z = angle; root.add( group );
    // Same footprint as the old cylinder; flat-sided collection box with arched roof.
    const profile = new THREE.Shape(); profile.moveTo( -12.5, 8 ); profile.lineTo( 12.5, 8 );
    profile.lineTo( 12.5, 41 ); profile.absarc( 0, 41, 12.5, 0, Math.PI, false ); profile.lineTo( -12.5, 8 );
    const body = new THREE.ExtrudeGeometry( profile, { depth: 25, bevelEnabled: false, curveSegments: 8 } );
    body.rotateX( Math.PI / 2 ); body.translate( 0, 12.5, 0 );
    const door = new THREE.BoxGeometry( 21, .35, 25 ); door.translate( 0, -12.65, 23 );
    const doorFaces = door.toNonIndexed();
    const shell = new THREE.Mesh( mergeGeometries( [ body, doorFaces ] ), blue );
    shell.name = 'bostonMailboxShell' + name; group.add( shell ); body.dispose(); door.dispose(); doorFaces.dispose();
    const details = [];
    const box = ( w, d, h, px, py, pz ) => { const g = new THREE.BoxGeometry( w, d, h ); g.translate( px, py, pz ); details.push( g ); };
    for ( const px of [ -9, 9 ] ) for ( const py of [ -9, 9 ] ) box( 2.6, 2.6, 8, px, py, 4 );
    box( 18, .5, 2.6, 0, -12.8, 39 ); box( 3, .7, .8, 7, -13, 26 );
    group.add( new THREE.Mesh( mergeGeometries( details ), dark ) ); details.forEach( g => g.dispose() );
    const label = new THREE.Mesh( new THREE.PlaneGeometry( 18, 9 ), labelMaterial );
    label.rotation.x = Math.PI / 2; label.position.set( 0, -12.86, 27 ); group.add( label );
  }
}
