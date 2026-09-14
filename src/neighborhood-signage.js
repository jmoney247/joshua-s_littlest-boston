import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import faces from './signage-faces.json';

// A separate small print sheet is used only by the audited replacement faces.
// The original atlas, approved artwork, frames and sign locations stay intact.
const designs = {
  wharfSign: [ 'WHARF', 'sail', '#243f51', '#e5c78a', '#b68d52' ],
  northEndBakery: [ 'NORTH END BAKERY', 'coffee', '#e9dfc8', '#384d43', '#b78f51' ],
  harborWalk: [ 'HARBOR|WALK', 'sail', '#345767', '#efe5cc', '#c4a164' ],
  collectionNotice: [ 'POSTAL|COLLECTION', 'letter', '#35506c', '#efe6cf', '#ad915b' ],
  utilityNotice: [ 'SERVICE', 'molecule', '#435861', '#e5dfc9', '#b69c68' ],
  harborFlags: [ 'HARBOR', 'sail', '#315d70', '#f0dec0', '#c79852' ],
  mangaPoster: [ 'BOSTON|JAZZ NIGHT', 'jazz', '#702e46', '#f2dec2', '#d1a14f' ],
  bubbleMural: [ 'CHARLES|ROWING CLUB', 'rowing', '#8aaeba', '#f4e7d1', '#ac583e' ],
  bubbleDoor: [ 'BEACON|BOOKS', 'book', '#8f4936', '#f2e3c7', '#d2aa55' ],
  bubbleHeader: [ 'BEACON BOOKS', 'book', '#b89148', '#202f43', '#f4e7ce' ],
  alleyHeader: [ 'HARBOR COFFEE', 'coffee', '#314a62', '#f1dfba', '#c48652' ],
  alleyCurtain: [ '', 'waves', '#357778', '#bfd4ce', '#d2a260' ],
  whiteVertical: [ 'SEAFOOD', 'fish', '#345b68', '#f4ead6', '#d39b58' ],
  tinyEaves: [ 'CAFE', 'coffee', '#773c45', '#f2e0c8', '#d69c55' ],
  blueAlley: [ 'JAZZ', 'jazz', '#67404f', '#f2d7ad', '#c88746' ],
  whiteAlley: [ 'BOOKS', 'book', '#b08042', '#192f47', '#f0e4cc' ],
  greenAlley: [ 'BAKED', 'coffee', '#a2603e', '#f5e4c6', '#593a36' ],
  orangeAlley: [ 'FLOWERS', 'flower', '#43634f', '#f0dbbb', '#c37a64' ],
  pinkNotice: [ '', 'flower', '#b58260', '#f6e4c6', '#466a5d' ],
  bikeCaption: [ 'ONE WAY', 'arrow', '#e4dbbc', '#293747', '#293747' ],
  bikeNotice: [ 'NO CYCLING', 'bike', '#e7ddc6', '#273746', '#925244' ],
  recordCover: [ 'FENWAY|RECORDS', 'record', '#b87848', '#f0dbb5', '#344c5d' ],
  lighthousePoster: [ '', 'lighthouse', '#618b9c', '#f0e4ce', '#a95341' ],
  floristPoster: [ 'NEW ENGLAND|FLORIST', 'flower', '#8c4550', '#f0ddbc', '#7d9f86' ],
  designPoster: [ 'BOSTON|DESIGN WEEK', 'brownstone', '#c5ac7f', '#263d50', '#a85940' ],
  chalkMenu: [ 'BAKED', 'coffee', '#334a42', '#e3d3ad', '#c59c51' ],
  vendingPoster: [ '', 'molecule', '#6993a4', '#f5e9d2', '#cc8056' ],
  seafoodBanner0: [ 'HARBOR|FISH MARKET', 'fish', '#254b66', '#f2e2bf', '#8bafa7' ],
  seafoodBanner1: [ 'LOBSTER|ROLL', 'lobster', '#bd7849', '#f4e6cc', '#84392f' ],
  seafoodBanner2: [ 'NORTH SHORE|SEAFOOD', 'sail', '#467b78', '#f0e0c2', '#c89b53' ]
};

function drawPrint( ctx, width, height, design ) {
  const [ label, icon, bg, ink, accent ] = design;
  const size = Math.min( width, height );
  ctx.fillStyle = bg; ctx.fillRect( 0, 0, width, height );
  ctx.strokeStyle = ink; ctx.lineWidth = size * 0.018;
  if ( ! [ 'jazz', 'molecule', 'flower', 'record', 'brownstone', 'waves' ].includes( icon ) ) ctx.strokeRect( size * 0.055, size * 0.055, width - size * 0.11, height - size * 0.11 );
  const text = ( value, x, y, fontSize, maxWidth ) => {
    const type = [ 'jazz', 'molecule', 'record', 'brownstone' ].includes( icon ) ? 'Arial, sans-serif' : 'Georgia, serif';
    ctx.fillStyle = ink; ctx.font = `${icon === 'flower' ? 'italic 600' : '700'} ${fontSize}px ${type}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText( value, x, y, maxWidth );
  };
  if ( icon === 'arrow' ) {
    text( label, width / 2, height * 0.29, height * 0.26, width * 0.84 );
    ctx.strokeStyle = ink; ctx.lineWidth = height * 0.075; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo( width * 0.76, height * 0.67 ); ctx.lineTo( width * 0.25, height * 0.67 );
    ctx.lineTo( width * 0.36, height * 0.52 ); ctx.moveTo( width * 0.25, height * 0.67 ); ctx.lineTo( width * 0.36, height * 0.82 ); ctx.stroke(); return;
  }
  if ( height > width * 2.1 && label ) {
    const letters = label.replaceAll( '|', '' ).replaceAll( ' ', '' );
    const step = height * 0.77 / letters.length;
    for ( let i = 0; i < letters.length; i ++ ) text( letters[ i ], width / 2, height * 0.11 + step * ( i + 0.5 ), Math.min( width * 0.56, step * 0.76 ), width * 0.77 );
    return;
  }
  if ( width > height * 2.5 && label ) {
    text( label.replaceAll( '|', ' ' ), width * 0.5, height * 0.46, height * 0.45, width * 0.86 );
    ctx.strokeStyle = accent; ctx.lineWidth = height * 0.035;
    ctx.beginPath(); ctx.moveTo( width * 0.15, height * 0.78 ); ctx.lineTo( width * 0.85, height * 0.78 ); ctx.stroke();
    return;
  }
  if ( label ) {
    const lines = label.split( '|' );
    lines.forEach( ( line, i ) => text( line, width / 2, height * ( 0.14 + i * 0.105 ), size * 0.105, width * 0.82 ) );
  }
  // Each poster has one simple illustrative idea, not another corporate logo.
  const radius = Math.min( width * 0.40, height * ( label ? 0.30 : 0.4 ) );
  ctx.save(); ctx.translate( width / 2, height * ( label ? 0.62 : 0.5 ) ); ctx.scale( radius, radius );
  ctx.lineWidth = 0.05; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = ink; ctx.fillStyle = ink;
  const line = points => { ctx.beginPath(); points.forEach( ( p, i ) => i ? ctx.lineTo( ...p ) : ctx.moveTo( ...p ) ); ctx.stroke(); };
  const circle = ( x, y, r, fill = ink ) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc( x, y, r, 0, Math.PI * 2 ); ctx.fill(); };
  const polygon = ( points, fill = ink ) => { ctx.fillStyle = fill; ctx.beginPath(); points.forEach( ( p, i ) => i ? ctx.lineTo( ...p ) : ctx.moveTo( ...p ) ); ctx.closePath(); ctx.fill(); };
  const waves = y => { for ( let j = 0; j < 3; j ++ ) { ctx.beginPath(); ctx.moveTo( - 0.92, y + j * 0.15 ); for ( let i = 0; i < 4; i ++ ) ctx.quadraticCurveTo( - 0.7 + i * 0.45, y - 0.12 + j * 0.15, - 0.47 + i * 0.45, y + j * 0.15 ); ctx.stroke(); } };
  if ( icon === 'rowing' ) {
    circle( 0.57, - 0.65, 0.22, accent );
    ctx.fillStyle = '#36586b'; ctx.fillRect( - 1, 0.2, 2, 0.65 );
    polygon( [ [ - 0.98, 0.12 ], [ 1, 0.12 ], [ 0.74, 0.3 ], [ - 0.72, 0.3 ] ], accent );
    for ( let i = 0; i < 4; i ++ ) { const x = - 0.55 + i * 0.35; circle( x, - 0.15, 0.09 ); line( [ [ x, - 0.03 ], [ x + 0.12, 0.13 ], [ x - 0.2, 0.52 ] ] ); }
    waves( 0.59 );
  } else if ( icon === 'sail' ) {
    circle( 0.6, - 0.63, 0.2, accent );
    polygon( [ [ - 0.13, - 0.8 ], [ - 0.13, 0.21 ], [ - 0.84, 0.21 ] ] );
    polygon( [ [ 0, - 0.57 ], [ 0.69, 0.21 ], [ 0, 0.21 ] ], accent );
    line( [ [ - 0.07, - 0.88 ], [ - 0.07, 0.5 ] ] );
    polygon( [ [ - 0.95, 0.34 ], [ 0.88, 0.34 ], [ 0.65, 0.54 ], [ - 0.67, 0.54 ] ] ); waves( 0.65 );
  } else if ( icon === 'waves' ) {
    circle( 0.42, - 0.48, 0.28, accent ); waves( - 0.07 ); waves( 0.46 );
  } else if ( icon === 'fish' ) {
    ctx.beginPath(); ctx.ellipse( - 0.08, - 0.08, 0.65, 0.33, 0, 0, Math.PI * 2 ); ctx.fill();
    polygon( [ [ 0.38, - 0.08 ], [ 0.87, - 0.49 ], [ 0.87, 0.3 ] ], accent );
    circle( - 0.48, - 0.15, 0.065, bg ); ctx.strokeStyle = accent;
    line( [ [ - 0.18, - 0.3 ], [ - 0.27, 0.03 ], [ - 0.13, 0.19 ] ] ); ctx.strokeStyle = ink; waves( 0.51 );
  } else if ( icon === 'lobster' ) {
    ctx.fillStyle = accent; ctx.beginPath(); ctx.ellipse( 0, 0.12, 0.23, 0.57, 0, 0, Math.PI * 2 ); ctx.fill();
    for ( const side of [ - 1, 1 ] ) {
      ctx.strokeStyle = accent; line( [ [ side * 0.13, - 0.25 ], [ side * 0.48, - 0.46 ], [ side * 0.58, - 0.7 ] ] );
      circle( side * 0.6, - 0.65, 0.22, accent );
      polygon( [ [ side * 0.59, - 0.85 ], [ side * 0.7, - 0.98 ], [ side * 0.7, - 0.67 ] ], bg );
      for ( let i = 0; i < 4; i ++ ) line( [ [ side * 0.18, i * 0.16 - 0.1 ], [ side * 0.42, i * 0.16 - 0.17 ], [ side * 0.57, i * 0.16 - 0.02 ] ] );
      circle( side * 0.11, - 0.37, 0.045, ink );
    }
    polygon( [ [ 0, 0.58 ], [ - 0.34, 0.9 ], [ 0.34, 0.9 ] ], accent );
  } else if ( icon === 'book' ) {
    polygon( [ [ 0, - 0.5 ], [ - 0.84, - 0.77 ], [ - 0.84, 0.53 ], [ 0, 0.75 ] ] );
    polygon( [ [ 0.06, - 0.5 ], [ 0.9, - 0.77 ], [ 0.9, 0.53 ], [ 0.06, 0.75 ] ], accent );
    ctx.strokeStyle = bg; for ( let i = 0; i < 4; i ++ ) { line( [ [ - 0.68, - 0.46 + i * 0.21 ], [ - 0.17, - 0.3 + i * 0.21 ] ] ); line( [ [ 0.22, - 0.3 + i * 0.21 ], [ 0.7, - 0.46 + i * 0.21 ] ] ); }
  } else if ( icon === 'jazz' ) {
    circle( 0.4, - 0.38, 0.53, accent ); ctx.strokeStyle = ink; ctx.lineWidth = 0.13;
    ctx.beginPath(); ctx.moveTo( - 0.45, - 0.87 ); ctx.lineTo( - 0.23, - 0.8 ); ctx.lineTo( - 0.07, 0.47 ); ctx.bezierCurveTo( 0.02, 0.94, 0.71, 0.74, 0.58, 0.2 ); ctx.stroke();
    polygon( [ [ 0.38, 0.2 ], [ 0.79, 0.06 ], [ 0.69, 0.4 ] ] );
    for ( let i = 0; i < 4; i ++ ) circle( - 0.17 + i * 0.03, - 0.42 + i * 0.2, 0.065, bg );
  } else if ( icon === 'coffee' ) {
    circle( 0.55, - 0.1, 0.28, accent );
    polygon( [ [ - 0.65, - 0.35 ], [ 0.4, - 0.35 ], [ 0.25, 0.48 ], [ - 0.49, 0.48 ] ] );
    ctx.lineWidth = 0.1; line( [ [ - 0.83, 0.61 ], [ 0.68, 0.61 ] ] ); ctx.lineWidth = 0.05;
    for ( const x of [ - 0.38, - 0.02 ] ) { ctx.beginPath(); ctx.moveTo( x, - 0.53 ); ctx.bezierCurveTo( x - 0.24, - 0.72, x + 0.22, - 0.76, x, - 0.98 ); ctx.stroke(); }
  } else if ( icon === 'flower' ) {
    ctx.strokeStyle = accent; line( [ [ 0, 0.86 ], [ 0, - 0.17 ] ] );
    polygon( [ [ 0, 0.55 ], [ - 0.58, 0.17 ], [ - 0.23, 0.62 ] ], accent );
    polygon( [ [ 0, 0.37 ], [ 0.53, 0.01 ], [ 0.28, 0.45 ] ], accent );
    for ( let i = 0; i < 6; i ++ ) { const a = i * Math.PI / 3; circle( Math.cos( a ) * 0.3, - 0.4 + Math.sin( a ) * 0.3, 0.24 ); }
    circle( 0, - 0.4, 0.19, accent );
  } else if ( icon === 'molecule' ) {
    const nodes = [ [ - 0.73, - 0.22 ], [ - 0.21, - 0.63 ], [ 0.49, - 0.43 ], [ 0.76, 0.26 ], [ 0.15, 0.69 ], [ - 0.55, 0.47 ] ];
    nodes.forEach( ( p, i ) => line( [ p, nodes[ ( i + 1 ) % nodes.length ] ] ) ); line( [ nodes[ 1 ], nodes[ 4 ] ] );
    nodes.forEach( ( p, i ) => circle( ...p, i % 2 ? 0.14 : 0.2, i % 2 ? accent : ink ) );
  } else if ( icon === 'lighthouse' ) {
    circle( 0.63, - 0.66, 0.2, '#ddba75' );
    polygon( [ [ - 0.16, - 0.59 ], [ 0.16, - 0.59 ], [ 0.33, 0.64 ], [ - 0.33, 0.64 ] ] );
    polygon( [ [ - 0.31, - 0.57 ], [ 0, - 0.9 ], [ 0.31, - 0.57 ] ], accent );
    polygon( [ [ - 0.24, - 0.02 ], [ 0.24, - 0.02 ], [ 0.27, 0.23 ], [ - 0.27, 0.23 ] ], accent );
    ctx.fillStyle = bg; ctx.fillRect( - 0.07, - 0.45, 0.14, 0.18 ); ctx.fillRect( - 0.08, 0.4, 0.16, 0.24 ); waves( 0.66 );
  } else if ( icon === 'brownstone' ) {
    for ( let i = 0; i < 3; i ++ ) {
      const x = - 0.9 + i * 0.62, top = - 0.76 + ( i % 2 ) * 0.14;
      ctx.fillStyle = accent; ctx.fillRect( x, top, 0.56, 1.38 ); ctx.fillStyle = ink; ctx.fillRect( x - 0.03, top, 0.62, 0.08 );
      for ( let j = 0; j < 3; j ++ ) for ( let k = 0; k < 2; k ++ ) { ctx.fillStyle = '#dfbd79'; ctx.fillRect( x + 0.08 + k * 0.23, top + 0.18 + j * 0.27, 0.12, 0.17 ); }
      ctx.fillStyle = ink; ctx.fillRect( x + 0.19, 0.31, 0.17, 0.34 );
      for ( let step = 0; step < 3; step ++ ) ctx.fillRect( x + 0.1 - step * 0.03, 0.65 + step * 0.06, 0.35 + step * 0.06, 0.04 );
    }
  } else if ( icon === 'record' ) {
    circle( 0, 0, 0.84, accent );
    ctx.strokeStyle = ink; ctx.lineWidth = 0.025;
    for ( const r of [ 0.48, 0.59, 0.72 ] ) { ctx.beginPath(); ctx.arc( 0, 0, r, 0, Math.PI * 2 ); ctx.stroke(); }
    circle( 0, 0, 0.26 ); circle( 0, 0, 0.065, bg );
  } else if ( icon === 'bike' ) {
    for ( const x of [ - 0.55, 0.55 ] ) { ctx.beginPath(); ctx.arc( x, 0.23, 0.32, 0, Math.PI * 2 ); ctx.stroke(); }
    line( [ [ - 0.55, 0.23 ], [ - 0.2, - 0.37 ], [ 0.12, 0.23 ], [ - 0.55, 0.23 ], [ 0.39, - 0.32 ], [ 0.55, 0.23 ] ] );
    line( [ [ 0.4, - 0.29 ], [ 0.33, - 0.6 ], [ 0.65, - 0.6 ] ] );
    ctx.strokeStyle = accent; ctx.lineWidth = 0.14; line( [ [ - 0.9, - 0.83 ], [ 0.92, 0.86 ] ] );
  }
  ctx.restore();
}

export function addNeighborhoodSignage( model ) {
  const anchor = model.getObjectByName( 'Object649' );
  if ( ! anchor ) throw new Error( 'Missing neighborhood signage anchor' );
  model.updateWorldMatrix( true, true );
  const protectedMeshes = [];
  model.traverse( o => { if ( o.isMesh && o.name.startsWith( 'boston' ) ) protectedMeshes.push( o ); } );
  const ray = new THREE.Raycaster(), geometries = [], records = [];
  const canvas = document.createElement( 'canvas' ); canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext( '2d' ), tiles = new Map();
  const inverse = anchor.matrixWorld.clone().invert();
  const getTile = ( kind, aspect ) => {
    const key = kind + ':' + ( aspect > 2.5 ? 'wide' : aspect < 0.47 ? 'vertical' : 'poster' );
    if ( tiles.has( key ) ) return tiles.get( key );
    if ( tiles.size >= 64 ) throw new Error( 'Neighborhood print sheet is full' );
    const slot = tiles.size, x = slot % 8 * 128, y = Math.floor( slot / 8 ) * 128;
    // Four-pixel edge bleed separates each print's mipmapped neighbors.
    const w = 256, h = w / aspect;
    ctx.save(); ctx.beginPath(); ctx.rect( x, y, 128, 128 ); ctx.clip();
    ctx.fillStyle = designs[ kind ][ 2 ]; ctx.fillRect( x, y, 128, 128 );
    ctx.translate( x + 4, y + 4 ); ctx.scale( 120 / w, 120 / h ); drawPrint( ctx, w, h, designs[ kind ] ); ctx.restore();
    const tile = { x: ( x + 4 ) / 1024, y: 1 - ( y + 124 ) / 1024, w: 120 / 1024, h: 120 / 1024 };
    tiles.set( key, tile ); return tile;
  };
  for ( const spec of faces ) {
    const source = model.getObjectByName( spec.mesh );
    if ( ! source?.geometry?.index ) throw new Error( `Missing signage surface: ${spec.mesh}` );
    const g = source.geometry, p = g.attributes.position, clusters = [];
    for ( const f of spec.faces ) {
      if ( f * 3 + 2 >= g.index.count ) throw new Error( 'Signage face range changed' );
      const points = [ 0, 1, 2 ].map( k => new THREE.Vector3().fromBufferAttribute( p, g.index.getX( f * 3 + k ) ) );
      const cross = new THREE.Vector3().crossVectors( points[ 1 ].clone().sub( points[ 0 ] ), points[ 2 ].clone().sub( points[ 0 ] ) );
      const area = cross.length() / 2; if ( area < 0.001 ) continue;
      const normal = cross.normalize();
      let cluster = clusters.find( c => c.normal.dot( normal ) > 0.98 );
      if ( ! cluster ) { cluster = { normal, area: 0, points: [], faces: [] }; clusters.push( cluster ); }
      cluster.area += area; cluster.points.push( ...points ); cluster.faces.push( f );
    }
    const largest = Math.max( ...clusters.map( c => c.area ) );
    for ( const cluster of clusters ) {
      // Keep edge bevels and hardware, which are not printed artwork.
      if ( cluster.area < largest * 0.2 ) continue;
      for ( const direction of spec.reverse ? [ - 1 ] : [ 1, - 1 ] ) {
        const normal = cluster.normal.clone().multiplyScalar( direction );
        // Preserve the complete approved front faces, including their margins.
        if ( spec.id.startsWith( 'orangeAlley_' ) && normal.dot( new THREE.Vector3( - 0.7071, - 0.7071, 0 ) ) > 0.5 ) continue;
        if ( [ 'greenAlley', 'whiteVertical' ].includes( spec.kind ) && normal.y < - 0.5 ) continue;
        const upHint = new THREE.Vector3( 0, Math.abs( normal.z ) > 0.9 ? 1 : 0, Math.abs( normal.z ) > 0.9 ? 0 : 1 );
        const right = new THREE.Vector3().crossVectors( upHint, normal ).normalize();
        const up = new THREE.Vector3().crossVectors( normal, right ).normalize();
        const xs = cluster.points.map( p => p.dot( right ) ), ys = cluster.points.map( p => p.dot( up ) );
        const left = Math.min( ...xs ), bottom = Math.min( ...ys ), width = Math.max( ...xs ) - left, height = Math.max( ...ys ) - bottom;
        if ( width < 1 || height < 1 ) continue;
        const center = new THREE.Box3().setFromPoints( cluster.points ).getCenter( new THREE.Vector3() );
        const origin = source.localToWorld( center.clone().addScaledVector( normal, 3 ) );
        const worldCenter = source.localToWorld( center.clone() );
        ray.set( origin, worldCenter.clone().sub( origin ).normalize() ); ray.far = origin.distanceTo( worldCenter ) + 0.0002;
        // A prior Boston print in front of this exact face takes precedence.
        if ( ray.intersectObjects( protectedMeshes, false ).some( h => h.object.visible ) ) continue;
        const tile = getTile( spec.kind, width / height ), positions = [], uvs = [];
        for ( let i = 0; i < cluster.points.length; i += 3 ) for ( const k of direction > 0 ? [ 0, 1, 2 ] : [ 0, 2, 1 ] ) {
          const point = cluster.points[ i + k ];
          positions.push( ...point.clone().addScaledVector( normal, spec.offset || 0.12 ).toArray() );
          uvs.push( tile.x + ( point.dot( right ) - left ) / width * tile.w, tile.y + ( point.dot( up ) - bottom ) / height * tile.h );
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
        geometry.applyMatrix4( new THREE.Matrix4().multiplyMatrices( inverse, source.matrixWorld ) );
        geometries.push( geometry ); records.push( { id: spec.id, kind: spec.kind, sourceMesh: spec.mesh, sourceFaces: cluster.faces, direction } );
      }
    }
  }
  // The small food poster is the exposed bottom of a much taller shared panel.
  // Cover only that square, not the approved MARKET sign in front of the panel.
  const lighthouseTile = getTile( 'lighthousePoster', 1 );
  for ( const [ y, reverse ] of [ [ -90.06, false ], [ -84.25, true ] ] ) {
    const geometry = new THREE.PlaneGeometry( 18.07, 18.4 );
    geometry.rotateX( reverse ? -Math.PI / 2 : Math.PI / 2 );
    geometry.translate( 64.2477, y, -75.2 );
    geometry.deleteAttribute( 'normal' );
    const uv = geometry.attributes.uv;
    for ( let i = 0; i < uv.count; i ++ ) uv.setXY( i, lighthouseTile.x + uv.getX( i ) * lighthouseTile.w, lighthouseTile.y + uv.getY( i ) * lighthouseTile.h );
    geometries.push( geometry.toNonIndexed() ); geometry.dispose();
  }
  const texture = new THREE.CanvasTexture( canvas ); texture.colorSpace = THREE.SRGBColorSpace;
  texture.name = 'bostonNeighborhoodPrintSheet';
  const material = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } ); material.name = 'bostonNeighborhoodPrints';
  const group = new THREE.Group(); group.name = 'bostonNeighborhoodSignage';
  const mesh = new THREE.Mesh( mergeGeometries( geometries ), material ); mesh.name = 'bostonNeighborhoodPrintedFaces';
  group.userData.replacements = records; group.add( mesh ); anchor.add( group );
  geometries.forEach( g => g.dispose() );

  // Audited road glyphs, WHOOP backing letters and the tall alley sign's relief.
  // Keep the street itself, the plaque backing, its fixtures and WHOOP intact.
  const removedLettering = {
    Object649_Plastic_Soft_0: [ [ 13925, 14124 ], [ 16810, 16815 ] ],
    Object674_outline_0: [ [ 19947, 20146 ], [ 40513, 40518 ] ],
    'Object705_Material_#5516_0': [ [ 1009, 1233 ], [ 1238, 1322 ] ],
    Object649_metalmat_0: [ [ 3585, 3864 ], [ 17309, 17311 ] ],
    Object674_outline_0_1: [ [ 8629, 8908 ], [ 9015, 9017 ] ]
  };
  for ( const [ name, ranges ] of Object.entries( removedLettering ) ) {
    const source = model.getObjectByName( name ), original = source?.geometry;
    if ( ! original?.index ) throw new Error( `Missing lettering surface: ${name}` );
    const clean = new THREE.BufferGeometry();
    for ( const [ key, attribute ] of Object.entries( original.attributes ) ) clean.setAttribute( key, attribute );
    clean.setIndex( original.index.clone() ); clean.groups = original.groups.map( group => ( { ...group } ) );
    for ( const [ first, last ] of ranges ) {
      if ( last * 3 + 2 >= clean.index.count ) throw new Error( 'Lettering face range changed' );
      for ( let f = first; f <= last; f ++ ) {
        const index = clean.index.getX( f * 3 ); clean.index.setX( f * 3 + 1, index ); clean.index.setX( f * 3 + 2, index );
      }
    }
    source.geometry = clean;
  }
}
