import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Original GLB face numbers, audited separately from the surrounding signs.
// The two animated artwork planes, hub, rim, and their outline shells form the disc.
const discFaces = {
  Object649_normal_0: [ [ 330, 337 ], [ 18276, 18358 ], [ 29226, 29226 ] ], // original ties and cradle
  Object649_metalmat_0: [ [ 2354, 2425 ], [ 13190, 13477 ] ],
  Object674_outline_0: [ [ 27264, 27551 ] ],
  Object674_outline_0_1: [ [ 2456, 2610 ], [ 9087, 9087 ] ]
};

export function addHarborAlley( model ) {
  const anchor = model.getObjectByName( 'Object649' );
  if ( ! anchor ) throw new Error( 'Missing harbor alley anchor' );
  for ( const name of [ 'Object531_normal_0', 'Object532_normal_0', 'Object081_normal_0', 'Object332_normal_0', 'Object682_normal_0' ] ) {
    const mesh = model.getObjectByName( name );
    if ( ! mesh?.isMesh ) throw new Error( `Missing harbor alley prop: ${name}` );
    mesh.visible = false;
  }
  for ( const [ name, ranges ] of Object.entries( discFaces ) ) {
    const mesh = model.getObjectByName( name ), original = mesh?.geometry;
    if ( ! original?.index ) throw new Error( `Missing harbor disc surface: ${name}` );
    const geometry = new THREE.BufferGeometry();
    for ( const [ key, attribute ] of Object.entries( original.attributes ) ) geometry.setAttribute( key, attribute );
    geometry.setIndex( original.index.clone() );
    geometry.groups = original.groups.map( group => ( { ...group } ) );
    for ( const [ first, last ] of ranges ) {
      if ( last * 3 + 2 >= geometry.index.count ) throw new Error( 'Harbor disc face range changed' );
      for ( let face = first; face <= last; face ++ ) {
        const vertex = geometry.index.getX( face * 3 );
        geometry.index.setX( face * 3 + 1, vertex ); geometry.index.setX( face * 3 + 2, vertex );
      }
    }
    mesh.geometry = geometry;
  }

  const wheel = new THREE.Group(); wheel.name = 'bostonHarborWheel';
  wheel.position.set( 55.5, - 17.3, - 44.3 );
  const normal = new THREE.Vector3( 0.76604444, - 0.64278761, 0 );
  wheel.quaternion.setFromRotationMatrix( new THREE.Matrix4().makeBasis(
    new THREE.Vector3( 0.64278761, 0.76604444, 0 ), new THREE.Vector3( 0, 0, 1 ), normal
  ) );
  anchor.add( wheel );
  const rotor = new THREE.Group(); rotor.name = 'bostonHarborWheelRotor'; wheel.add( rotor );
  const wood = new THREE.MeshStandardMaterial( { color: '#65442e', roughness: 0.88, vertexColors: true } );
  const brass = new THREE.MeshStandardMaterial( { color: '#8e7850', metalness: 0.62, roughness: 0.65 } );
  wood.name = 'bostonHarborWeatheredWood'; brass.name = 'bostonHarborAgedBrass';
  const woodenParts = [], brassParts = [];
  const add = ( parts, geometry, x = 0, y = 0, z = 0, angle = 0 ) => {
    geometry.rotateZ( angle ); geometry.translate( x, y, z ); parts.push( geometry );
  };
  for ( let i = 0; i < 8; i ++ ) {
    const a = i * Math.PI / 4, sin = Math.sin( a ), cos = Math.cos( a );
    const rim = new THREE.TorusGeometry( 27.4, 2.35, 6, 6, Math.PI / 4 ); rim.rotateZ( a ); woodenParts.push( rim );
    add( woodenParts, new THREE.CylinderGeometry( 1.1, 1.6, 23, 8 ), sin * 17.4, cos * 17.4, 0, - a );
    add( woodenParts, new THREE.CylinderGeometry( 1.25, 1.45, 6.5, 8 ), sin * 33.4, cos * 33.4, 0, - a );
    const grip = new THREE.SphereGeometry( 1, 8, 5 ); grip.scale( 1.6, 3.1, 1.6 );
    add( woodenParts, grip, sin * 34.6, cos * 34.6, 0, - a );
    for ( const radius of [ 8.8, 30.3 ] ) add( brassParts, new THREE.CylinderGeometry( 1.65, 1.65, 0.9, 8 ), sin * radius, cos * radius, 0, - a );
    add( brassParts, new THREE.SphereGeometry( 0.65, 6, 4 ), sin * 27.4, cos * 27.4, 2.35 );
  }
  // Subtle segment variation gives the small wooden object a worn finish.
  woodenParts.forEach( ( geometry, i ) => {
    const shade = new THREE.Color().setScalar( [ 0.86, 1, 0.92, 0.97 ][ i % 4 ] );
    const colors = new Float32Array( geometry.attributes.position.count * 3 );
    for ( let j = 0; j < colors.length; j += 3 ) { colors[ j ] = shade.r; colors[ j + 1 ] = shade.g; colors[ j + 2 ] = shade.b; }
    geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
  } );
  const merge = ( parent, name, parts, material ) => {
    const mesh = new THREE.Mesh( mergeGeometries( parts ), material ); mesh.name = name; parent.add( mesh );
    parts.forEach( geometry => geometry.dispose() ); return mesh;
  };
  merge( rotor, 'bostonHarborWheelWood', woodenParts, wood );
  merge( rotor, 'bostonHarborWheelFittings', brassParts, brass );
  const hub = new THREE.Mesh( new THREE.CylinderGeometry( 10, 10, 5, 24 ), brass );
  hub.rotation.x = Math.PI / 2; hub.name = 'bostonHarborMedallion'; wheel.add( hub );
  const axle = new THREE.Mesh( new THREE.CylinderGeometry( 1.8, 1.8, 14, 8 ), brass );
  axle.rotation.x = Math.PI / 2; axle.position.z = - 9; axle.name = 'bostonHarborWallAxle'; wheel.add( axle );
  // One small generated inscription, shared by front and back medallions.
  const canvas = document.createElement( 'canvas' ); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext( '2d' );
  ctx.fillStyle = '#806b45'; ctx.fillRect( 0, 0, 256, 256 );
  ctx.strokeStyle = '#bba779'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc( 128, 128, 118, 0, Math.PI * 2 ); ctx.stroke();
  ctx.fillStyle = '#eee3c5'; ctx.textAlign = 'center'; ctx.font = 'bold 32px Georgia, serif';
  ctx.fillText( 'BOSTON', 128, 57 ); ctx.fillText( 'HARBOR', 128, 221 );
  ctx.strokeStyle = '#eee3c5'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc( 128, 87, 10, 0, Math.PI * 2 ); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 128, 97 ); ctx.lineTo( 128, 176 ); ctx.moveTo( 105, 116 ); ctx.lineTo( 151, 116 );
  ctx.moveTo( 83, 145 ); ctx.quadraticCurveTo( 85, 173, 128, 180 ); ctx.quadraticCurveTo( 171, 173, 173, 145 ); ctx.stroke();
  for ( const x of [ 83, 173 ] ) { ctx.beginPath(); ctx.moveTo( x, 138 ); ctx.lineTo( x - 10, 153 ); ctx.lineTo( x + 10, 153 ); ctx.closePath(); ctx.fill(); }
  const texture = new THREE.CanvasTexture( canvas ); texture.colorSpace = THREE.SRGBColorSpace; texture.name = 'bostonHarborMedallionText';
  const inscription = new THREE.MeshStandardMaterial( { map: texture, roughness: 0.78, metalness: 0.15 } );
  for ( const side of [ - 1, 1 ] ) {
    const face = new THREE.Mesh( new THREE.CircleGeometry( 9.5, 24 ), inscription );
    face.position.z = side * 2.53; if ( side < 0 ) face.rotation.y = Math.PI;
    face.name = side > 0 ? 'bostonHarborInscriptionFront' : 'bostonHarborInscriptionBack'; wheel.add( face );
  }

  const lights = new THREE.Group(); lights.name = 'bostonFestoonLights'; anchor.add( lights );
  const cableMaterial = new THREE.MeshStandardMaterial( { color: '#272620', roughness: 0.88 } );
  const bulbMaterial = new THREE.MeshStandardMaterial( { color: '#ffd28b', emissive: '#ffb64f', emissiveIntensity: 1.2, roughness: 0.4 } );
  const cableParts = [], bulbParts = [];
  const curve = new THREE.QuadraticBezierCurve3( new THREE.Vector3( 47, - 80, - 58 ), new THREE.Vector3( 98, - 27, - 76 ), new THREE.Vector3( 151, 26, - 52 ) );
  cableParts.push( new THREE.TubeGeometry( curve, 24, 0.34, 4, false ) );
  for ( const [ i, t ] of [ 0.13, 0.32, 0.5, 0.71, 0.88 ].entries() ) {
    const p = curve.getPoint( t ), drop = [ 3, 5, 2.5, 4.3, 3.6 ][ i ];
    const lead = new THREE.CylinderGeometry( 0.23, 0.23, drop, 5 ); lead.rotateX( Math.PI / 2 ); lead.translate( p.x, p.y, p.z - drop / 2 ); cableParts.push( lead );
    const socket = new THREE.CylinderGeometry( 0.95, 0.95, 1.6, 8 ); socket.rotateX( Math.PI / 2 ); socket.translate( p.x, p.y, p.z - drop - 0.8 ); cableParts.push( socket );
    const bulb = new THREE.SphereGeometry( 1, 8, 6 ); bulb.scale( 1.5, 1.5, 2.15 ); bulb.translate( p.x, p.y, p.z - drop - 3.15 ); bulbParts.push( bulb );
  }
  merge( lights, 'bostonFestoonCableAndSockets', cableParts, cableMaterial );
  merge( lights, 'bostonFestoonAmberBulbs', bulbParts, bulbMaterial );
  // Called by the existing scene animation loop. The medallion stays readable.
  return delta => { rotor.rotation.z = ( rotor.rotation.z - delta * 0.08 ) % ( Math.PI * 2 ); };
}
