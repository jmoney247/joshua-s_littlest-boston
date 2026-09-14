import * as THREE from 'three';

// Local material enhancement only: existing tower dimensions and transforms stay.
export function enhancePrudential( model ) {
  const tower = model.getObjectByName( 'bostonPrudentialCatCover' );
  if ( ! tower ) return () => {};
  const body = tower.getObjectByName( 'bostonPrudentialCatCoverBody' );
  const glass = body.material[ 0 ];
  const canvas = glass.map.image, ctx = canvas.getContext( '2d' );
  ctx.fillStyle = '#172731'; ctx.fillRect( 0, 0, 512, 1024 );
  const litCanvas = document.createElement( 'canvas' ); litCanvas.width = 512; litCanvas.height = 1024;
  const lit = litCanvas.getContext( '2d' ); lit.fillStyle = '#000000'; lit.fillRect( 0, 0, 512, 1024 );
  for ( let row = 0; row < 64; row ++ ) for ( let col = 0; col < 32; col ++ ) {
    const on = ( row * 19 + col * 7 ) % 53 === 0;
    ctx.fillStyle = on ? '#c9bb91' : ( col % 4 === 0 ? '#394c58' : '#293b47' );
    ctx.fillRect( col * 16 + 3, row * 16 + 2, 10, 12 );
    if ( on ) { lit.fillStyle = '#b7a477'; lit.fillRect( col * 16 + 3, row * 16 + 2, 10, 12 ); }
  }
  glass.map.needsUpdate = true;
  glass.metalness = 0.05; glass.envMapIntensity = 0.25;
  glass.color.set( '#8e9ca6' );
  const windowGlow = new THREE.CanvasTexture( litCanvas ); windowGlow.colorSpace = THREE.SRGBColorSpace;
  windowGlow.name = 'bostonPrudentialSparseWindowGlow';
  glass.emissive.set( '#ffffff' ); glass.emissiveMap = windowGlow; glass.emissiveIntensity = 0.55; glass.needsUpdate = true;

  const crown = new THREE.MeshStandardMaterial( {
    color: '#000000', emissive: '#0ada7d', emissiveIntensity: 1.3,
    metalness: 0.1, roughness: 0.5, toneMapped: false
  } ); crown.name = 'bostonPrudentialGreenCrown';
  const roof = new THREE.MeshStandardMaterial( { color: '#34434a', roughness: 0.8, metalness: 0.05 } );
  roof.name = 'bostonPrudentialCrownRoof';
  for ( const name of [ 'bostonPrudentialCatCoverLowerLedge', 'bostonPrudentialCatCoverUpperLedge', 'bostonPrudentialCatCoverNeck' ] ) {
    const ledge = tower.getObjectByName( name );
    // BoxGeometry's four vertical faces are contiguous: two draws, not six.
    ledge.geometry.clearGroups(); ledge.geometry.addGroup( 0, 24, 0 ); ledge.geometry.addGroup( 24, 12, 1 );
    ledge.material = [ crown, roof ];
  }
  const observation = tower.getObjectByName( 'bostonPrudentialCatCoverObservationDeck' ).material[ 0 ];
  const face = observation.map.image, faceCtx = face.getContext( '2d' );
  faceCtx.fillStyle = '#b5b5b5'; faceCtx.fillRect( 0, 0, 1024, 128 );
  for ( let col = 0; col < 32; col ++ ) {
    faceCtx.fillStyle = '#ababab';
    faceCtx.fillRect( col * 32 + 4, 4, 25, 120 );
    faceCtx.fillStyle = '#858585'; faceCtx.fillRect( col * 32, 0, 3, 128 );
  }
  faceCtx.fillStyle = '#bdbdbd'; faceCtx.fillRect( 35, 10, 954, 91 );
  faceCtx.textAlign = 'center'; faceCtx.textBaseline = 'middle';
  faceCtx.font = 'bold 76px Georgia, serif';
  faceCtx.strokeStyle = '#28332f'; faceCtx.lineWidth = 4;
  faceCtx.strokeText( 'PRUDENTIAL', 512, 59, 930 );
  // Pack fascia shading into red and fixed white lettering into green.
  // Keep alpha opaque so canvas premultiplication preserves background shading.
  // Reuses the existing texture, with a dark keyline for the white color phase.
  const mask = document.createElement( 'canvas' ); mask.width = 1024; mask.height = 128;
  const ink = mask.getContext( '2d' ); ink.textAlign = 'center'; ink.textBaseline = 'middle';
  ink.font = faceCtx.font; ink.fillStyle = '#ffffff'; ink.fillText( 'PRUDENTIAL', 512, 59, 930 );
  const pixels = faceCtx.getImageData( 0, 0, 1024, 128 );
  const letters = ink.getImageData( 0, 0, 1024, 128 ).data;
  for ( let i = 0; i < pixels.data.length; i += 4 ) {
    pixels.data[ i + 1 ] = letters[ i + 3 ];
    pixels.data[ i + 2 ] = 0;
    pixels.data[ i + 3 ] = 255;
  }
  faceCtx.putImageData( pixels, 0, 0 );
  observation.map.needsUpdate = true;
  observation.emissive.copy( crown.emissive ); observation.emissiveMap = observation.map;
  observation.emissiveIntensity = 1.3; observation.toneMapped = false; observation.needsUpdate = true;
  observation.metalness = 0; observation.envMapIntensity = 0;
  observation.color.set( '#000000' );
  observation.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace( '#include <emissivemap_fragment>', `
      #ifdef USE_EMISSIVEMAP
        vec4 crownPrint = texture2D( emissiveMap, vEmissiveMapUv );
        totalEmissiveRadiance = mix( totalEmissiveRadiance * crownPrint.r,
          vec3( 1.0, 0.98, 0.92 ), crownPrint.g );
      #endif
    ` );
  };
  observation.customProgramCacheKey = () => 'bostonCrownWhiteLetterMask-v2';

  const beacon = new THREE.Mesh( new THREE.SphereGeometry( 0.8, 6, 4 ), new THREE.MeshBasicMaterial( { color: '#ff473e', toneMapped: false } ) );
  beacon.name = 'bostonPrudentialBeacon'; beacon.position.set( 0, 0, 265.5 ); tower.add( beacon );
  // A new color is reached every 3 seconds, blending over the last 0.75s.
  // Reuse both local materials; the white letter mask and windows never change.
  const colors = [ '#0ada7d', '#287cf2', '#9959dc', '#e74442', '#e4ad42', '#19c8cb', '#f0eee3' ].map( value => new THREE.Color( value ) );
  let elapsed = 0;
  return delta => {
    elapsed = ( elapsed + delta ) % 21;
    const index = Math.floor( elapsed / 3 );
    const t = Math.max( 0, ( elapsed % 3 - 2.25 ) / 0.75 );
    const smooth = t * t * ( 3 - 2 * t );
    crown.emissive.copy( colors[ index ] ).lerp( colors[ ( index + 1 ) % colors.length ], smooth );
    observation.emissive.copy( crown.emissive );
  };
}
