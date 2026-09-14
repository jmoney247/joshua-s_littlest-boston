import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { addBostonStreetLamp } from './street-lamp.js';
import { addHiddenLobster } from './hidden-lobster.js';
import { addHarborAlley } from './harbor-alley.js';
import { addBostonIronRailing } from './iron-railing.js';
import { addNeighborhoodSignage } from './neighborhood-signage.js';
import { addUSMailboxes } from './us-mailboxes.js';
import { enhancePrudential } from './prudential-lighting.js';

const assetURL = path => new URL( import.meta.env.BASE_URL + path, document.baseURI ).href;

export async function createExperience( container, { onProgress = () => {}, onFailure = () => {}, onLobsterFound = () => {} } = {} ) {
  let renderer, scene, controls, timer, dracoLoader, resizeObserver, environmentTarget, visibilityChanged, removeLobsterInteraction;
  let disposed = false;
  const assetTasks = [];
  function createArtwork() {
    const image = new Image();
    let handler;
    const task = new Promise( ( resolve, reject ) => {
      Object.defineProperty( image, 'onload', { set( callback ) { handler = callback; } } );
      image.addEventListener( 'load', () => {
        try { handler?.call( image ); resolve(); } catch ( error ) { reject( error ); }
      }, { once: true } );
      image.addEventListener( 'error', () => reject( new Error( 'A required artwork image could not load' ) ), { once: true } );
    } );
    task.catch( () => {} );
    assetTasks.push( task );
    return image;
  }
  function loadTexture( url ) {
    let texture;
    const task = new Promise( ( resolve, reject ) => {
      texture = new THREE.TextureLoader().load( url, resolve, undefined, reject );
    } );
    task.catch( () => {} );
    assetTasks.push( task );
    return texture;
  }
  function contextLost( event ) {
    event.preventDefault();
    dispose();
    onFailure( new Error( 'WebGL context lost' ) );
  }
  function dispose() {
    if ( disposed ) return;
    disposed = true;
    renderer?.setAnimationLoop( null );
    removeLobsterInteraction?.();
    if ( visibilityChanged ) document.removeEventListener( 'visibilitychange', visibilityChanged );
    resizeObserver?.disconnect();
    controls?.dispose();
    timer?.dispose();
    dracoLoader?.dispose();
    const geometries = new Set(), materials = new Set(), textures = new Set();
    scene?.traverse( object => {
      if ( object.geometry ) geometries.add( object.geometry );
      for ( const value of [ ...( Array.isArray( object.material ) ? object.material : [ object.material ] ), ...Object.values( object.userData || {} ) ] ) {
        if ( value?.isMaterial ) materials.add( value );
      }
    } );
    for ( const material of materials ) {
      for ( const value of Object.values( material ) ) if ( value?.isTexture ) textures.add( value );
      material.dispose();
    }
    for ( const geometry of geometries ) geometry.dispose();
    for ( const texture of textures ) texture.dispose();
    environmentTarget?.dispose();
    if ( renderer ) {
      renderer.domElement.removeEventListener( 'webglcontextlost', contextLost );
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
  }
  try {




let mixer;

timer = new THREE.Timer();
timer.connect( document );




renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( Math.min( window.devicePixelRatio || 1, 2 ) );
renderer.setSize( Math.max( container.clientWidth, 1 ), Math.max( container.clientHeight, 1 ) );
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild( renderer.domElement );

scene = new THREE.Scene();

// Sky

const sky = new Sky();
sky.scale.setScalar( 10000 );
scene.add( sky );

const uniforms = sky.material.uniforms;
uniforms[ 'turbidity' ].value = 0;
uniforms[ 'rayleigh' ].value = 3;
uniforms[ 'mieDirectionalG' ].value = 0.7;
uniforms[ 'cloudElevation' ].value = 1;
uniforms[ 'sunPosition' ].value.set( - 0.8, 0.19, 0.56 ); // elevation: 11, azimuth: -55

const pmremGenerator = new THREE.PMREMGenerator( renderer );
environmentTarget = pmremGenerator.fromScene( sky );
const environment = environmentTarget.texture;
pmremGenerator.dispose();
scene.environment = environment;

const camera = new THREE.PerspectiveCamera( 40, Math.max( container.clientWidth, 1 ) / Math.max( container.clientHeight, 1 ), 1, 100 );
camera.position.set( 5, 2, 8 );

controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.target.set( 0, 0.7, 0 );
controls.update();

dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( assetURL( 'draco/' ) );
dracoLoader.setWorkerLimit( 2 );

const loader = new GLTFLoader();
loader.setDRACOLoader( dracoLoader );

// Boston reskin Phase 1: all additions in this file are isolated to the
// animated trolley hierarchy. The source GLB and its texture atlas remain
// read-only; shared GLTF materials are cloned before being changed.
function createBostonCanvasTexture( width, height, drawCanvas, textureName ) {

	const canvas = document.createElement( 'canvas' );
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext( '2d' );
	drawCanvas( context, width, height );

	const texture = new THREE.CanvasTexture( canvas );
	texture.name = textureName;
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.minFilter = THREE.LinearFilter;
	texture.magFilter = THREE.LinearFilter;
	texture.needsUpdate = true;

	return texture;

}

function createBostonDestinationTexture() {

	return createBostonCanvasTexture( 512, 128, function ( context, width, height ) {

		context.fillStyle = '#090d0c';
		context.fillRect( 0, 0, width, height );

		context.strokeStyle = '#d9d8c9';
		context.lineWidth = 8;
		context.strokeRect( 8, 8, width - 16, height - 16 );

		context.fillStyle = '#f4f0df';
		context.font = '700 58px Arial, sans-serif';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillText( 'COPLEY', width / 2, height / 2 + 2 );

	}, 'bostonCopleyDestinationTexture' );

}

function createBostonRoundelTexture() {

	return createBostonCanvasTexture( 256, 256, function ( context, width, height ) {

		const center = width / 2;
		const radius = 105;

		context.clearRect( 0, 0, width, height );
		context.beginPath();
		context.arc( center, center, radius, 0, Math.PI * 2 );
		context.fillStyle = '#f4f1e8';
		context.fill();
		context.strokeStyle = '#202426';
		context.lineWidth = 10;
		context.stroke();

		context.fillStyle = '#202426';
		context.fillRect( 72, 78, 112, 28 );
		context.fillRect( 113, 78, 30, 108 );

	}, 'bostonTrolleyRoundelTexture' );

}
const gltf = await loader.loadAsync( assetURL( 'models/LittlestTokyo.glb' ), onProgress );

	const model = gltf.scene;
	model.position.set( 1, 1, 0 );
	model.scale.set( 0.01, 0.01, 0.01 );
	scene.add( model );

	// Boston reskin Phase 1: preserve Object675's transform and animation.
	const trolley = model.getObjectByName( 'Object675' );
	const trolleyPaint = model.getObjectByName( 'Object675_paintmat_0' );

	if ( trolley && trolleyPaint && trolleyPaint.isMesh ) {

		const bostonOverlayGroup = new THREE.Group();
		bostonOverlayGroup.name = 'bostonOverlayGroup';
		bostonOverlayGroup.userData.bostonPhase = 'phase-1';
		trolley.add( bostonOverlayGroup );

		// paintmat is shared by the environment and other GLB meshes. Remove
		// the shared atlas only on this cloned trolley material.
		const originalTrolleyPaint = trolleyPaint.material;
		const bostonTrolleyPaint = trolleyPaint.material.clone();
		bostonTrolleyPaint.name = 'bostonTrolleyPaint';
		bostonTrolleyPaint.map = null;
		bostonTrolleyPaint.color.set( 0x177b62 );
		bostonTrolleyPaint.metalness = 0;
		bostonTrolleyPaint.roughness = 0.55;
		bostonTrolleyPaint.needsUpdate = true;
		trolleyPaint.userData.bostonPhase1OriginalMaterial = originalTrolleyPaint;
		trolleyPaint.material = bostonTrolleyPaint;

		const destinationMaterial = new THREE.MeshBasicMaterial( {
			map: createBostonDestinationTexture(),
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
			toneMapped: false
		} );
		destinationMaterial.name = 'bostonCopleyDestinationMaterial';

		const destinationDisplay = new THREE.Mesh(
			new THREE.PlaneGeometry( 44, 12 ),
			destinationMaterial
		);
		destinationDisplay.name = 'bostonCopleyDestinationDisplay';
		destinationDisplay.position.set( 0, 29, - 0.8 );
		destinationDisplay.rotation.y = Math.PI;
		bostonOverlayGroup.add( destinationDisplay );

		const roundelMaterial = new THREE.MeshBasicMaterial( {
			map: createBostonRoundelTexture(),
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
			toneMapped: false
		} );
		roundelMaterial.name = 'bostonTrolleyRoundelMaterial';

		const roundelStarboard = new THREE.Mesh(
			new THREE.PlaneGeometry( 18, 18 ),
			roundelMaterial
		);
		roundelStarboard.name = 'bostonTrolleyRoundelStarboard';
		roundelStarboard.position.set( 98.7, - 12, 66 );
		roundelStarboard.rotation.y = Math.PI / 2;
		bostonOverlayGroup.add( roundelStarboard );

		const roundelPort = roundelStarboard.clone();
		roundelPort.name = 'bostonTrolleyRoundelPort';
		roundelPort.position.x = - 98.7;
		roundelPort.rotation.y = - Math.PI / 2;
		bostonOverlayGroup.add( roundelPort );

		const creamBandMaterial = new THREE.MeshBasicMaterial( {
			color: 0xe7e4d8,
			depthWrite: false,
			side: THREE.DoubleSide,
			toneMapped: false
		} );
		creamBandMaterial.name = 'bostonTrolleyCreamBandMaterial';

		const creamBandStarboard = new THREE.Mesh(
			new THREE.PlaneGeometry( 116, 7 ),
			creamBandMaterial
		);
		creamBandStarboard.name = 'bostonTrolleyCreamBandStarboard';
		creamBandStarboard.position.set( 98.8, 28, 76 );
		creamBandStarboard.rotation.y = Math.PI / 2;
		bostonOverlayGroup.add( creamBandStarboard );

		const creamBandPort = creamBandStarboard.clone();
		creamBandPort.name = 'bostonTrolleyCreamBandPort';
		creamBandPort.position.x = - 98.8;
		creamBandPort.rotation.y = - Math.PI / 2;
		bostonOverlayGroup.add( creamBandPort );

	}

	// BEGIN Boston Phase 2B: independent CITGO display overlay.
	// Set false and reload, or remove this entire marked block, to undo.
	const BOSTON_CITGO_ENABLED = true;

	if ( BOSTON_CITGO_ENABLED ) {

		const billboardSurface = model.getObjectByName( 'Object649_normal_0' );

		if ( billboardSurface?.isMesh ) {

			const canvas = document.createElement( 'canvas' );
			canvas.width = 1024;
			canvas.height = 712;
			const context = canvas.getContext( '2d' );

			// Transparent clipped corners keep the original frame exposed.
			context.beginPath();
			context.moveTo( 22, 0 );
			context.lineTo( 1002, 0 );
			context.lineTo( 1024, 22 );
			context.lineTo( 1024, 690 );
			context.lineTo( 1002, 712 );
			context.lineTo( 22, 712 );
			context.lineTo( 0, 690 );
			context.lineTo( 0, 22 );
			context.closePath();
			context.fillStyle = '#fffef8';
			context.fill();

			// Three red facets recreate the reference's triangular mark.
			const facets = [
				{ color: '#e31b08', points: [ [ 512, 45 ], [ 282, 443 ], [ 512, 310 ] ] },
				{ color: '#bb1005', points: [ [ 512, 45 ], [ 512, 310 ], [ 742, 443 ] ] },
				{ color: '#870b04', points: [ [ 282, 443 ], [ 742, 443 ], [ 512, 310 ] ] }
			];

			for ( const facet of facets ) {

				context.beginPath();
				context.moveTo( ...facet.points[ 0 ] );
				context.lineTo( ...facet.points[ 1 ] );
				context.lineTo( ...facet.points[ 2 ] );
				context.closePath();
				context.fillStyle = facet.color;
				context.fill();

			}

			context.fillStyle = '#24276b';
			context.font = '900 150px Arial, sans-serif';
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillText( 'CITGO', 512, 570, 760 );

			const texture = new THREE.CanvasTexture( canvas );
			texture.name = 'bostonCitgoTexture';
			texture.colorSpace = THREE.SRGBColorSpace;

			const material = new THREE.MeshStandardMaterial( {
				map: texture,
				emissiveMap: texture,
				emissive: 0xffffff,
				emissiveIntensity: 0.25,
				metalness: 0,
				roughness: 0.85,
				alphaTest: 0.5
			} );
			material.name = 'bostonCitgoMaterial';

			// Confirmed six-triangle patch: local X/Z face, outward +Y.
			// Inset dimensions retain its frame; +0.08 clears its slight tilt.
			const bostonCitgoBillboard = new THREE.Mesh(
				new THREE.PlaneGeometry( 84.9, 58.95 ), material
			);
			bostonCitgoBillboard.name = 'bostonCitgoBillboard';
			bostonCitgoBillboard.userData.bostonPhase = '2B';
			bostonCitgoBillboard.position.set( 28.276, 123.437 + 0.08, 137.134 );
			// Right = -X, up = +Z: upright lettering viewed from +Y.
			bostonCitgoBillboard.rotation.set( Math.PI / 2, Math.PI, 0 );
			billboardSurface.add( bostonCitgoBillboard );

		} else {


		}

	}
	// END Boston Phase 2B.

	// BEGIN Boston Phase 3: five independently removable street-sign faces.
	// Set false and reload, or remove this marked block, to undo Phase 3.
	const BOSTON_STREET_SIGNS_ENABLED = true;

	if ( BOSTON_STREET_SIGNS_ENABLED ) {

		const environmentRoot = model.getObjectByName( 'Object649' );
		const normalSurface = model.getObjectByName( 'Object649_normal_0' );
		const plasticSurface = model.getObjectByName( 'Object649_Plastic_Soft_0' );

		if ( environmentRoot && normalSurface?.parent === environmentRoot && plasticSurface?.parent === environmentRoot ) {

			const bostonStreetSignGroup = new THREE.Group();
			bostonStreetSignGroup.name = 'bostonStreetSignGroup';
			bostonStreetSignGroup.userData.bostonPhase = '3';
			environmentRoot.add( bostonStreetSignGroup );

			// Positions use Object649-local coordinates shared by its two mesh
			// children. Each face was confirmed through its atlas UVs and geometry.
			// Sizes are inset 0.08 on every edge; original frames stay visible.
			const signs = [
				{
					name: 'bostonNewburyStSign', label: 'NEWBURY ST',
					street: 'NEWBURY', layout: 'street',
					source: 'Object649_normal_0', triangles: [ 23695, 29139 ],
					position: [ 147.84668, - 44.51681, 58.75748 ], size: [ 52.035, 17.507 ]
				},
				{
					name: 'bostonMarlboroughStSign', label: 'MARLBOROUGH ST',
					street: 'MARLBOROUGH', layout: 'twoLine',
					source: 'Object649_normal_0', triangles: [ 24024, 24025 ],
					position: [ 149.05585, - 49.03432, 34.92723 ], size: [ 59.995, 24.930 ]
				},
				{
					name: 'bostonBackBaySign', label: 'BACK BAY',
					letters: [ 'B', 'A', 'C', 'K', '', 'B', 'A', 'Y' ], layout: 'vertical',
					source: 'Object649_normal_0', triangles: [ 18200, 18201 ],
					position: [ 188.65536, - 57.66628, - 3.46316 ], size: [ 17.272, 84.648 ]
				},
				{
					name: 'bostonCopleyStreetSign', label: 'COPLEY',
					letters: [ 'C', 'O', 'P', 'L', 'E', 'Y' ], layout: 'vertical',
					source: 'Object649_normal_0', triangles: [ 23696, 23697 ],
					position: [ 165.51367, 17.35117, - 52.03052 ], size: [ 17.910, 88.813 ]
				},
				{
					name: 'bostonStateStreetSign', label: 'STATE STREET',
					street: 'BOYLSTON', layout: 'twoLine',
					source: 'Object649_Plastic_Soft_0', triangles: [ 16595, 16596 ],
					position: [ 216.76874, - 153.79436, - 98.77252 ], size: [ 48.524, 37.030 ]
				}
			];

			for ( const sign of signs ) {

				const canvas = document.createElement( 'canvas' );
				const vertical = sign.layout === 'vertical';
				canvas.width = vertical ? Math.round( 1024 * sign.size[ 0 ] / sign.size[ 1 ] ) : 1024;
				canvas.height = vertical ? 1024 : Math.round( 1024 * sign.size[ 1 ] / sign.size[ 0 ] );
				const context = canvas.getContext( '2d' );
				const width = canvas.width, height = canvas.height;
				const margin = Math.min( width, height ) * 0.055;

				context.fillStyle = '#006b63';
				context.fillRect( 0, 0, width, height );
				context.strokeStyle = '#f4f3e9';
				context.lineWidth = Math.max( 2, margin * 0.2 );
				context.strokeRect( margin, margin, width - margin * 2, height - margin * 2 );
				context.fillStyle = '#f4f3e9';
				context.textAlign = 'center';
				context.textBaseline = 'middle';

				if ( vertical ) {

					const spacing = height * 0.86 / sign.letters.length;
					const fontSize = Math.min( width * 0.65, spacing * 0.79 );
					context.font = '700 ' + fontSize + 'px Arial, sans-serif';

					for ( let i = 0; i < sign.letters.length; i ++ ) {

						context.fillText( sign.letters[ i ], width / 2, height * 0.07 + spacing * ( i + 0.5 ) );

					}

				} else if ( sign.layout === 'street' ) {

					// Smaller ST suffix follows the supplied Boston street-sign reference.
					let fontSize = height * 0.49;
					context.font = '700 ' + fontSize + 'px Arial, sans-serif';
					const gap = width * 0.025;
					const mainWidth = context.measureText( sign.street ).width;
					context.font = '700 ' + fontSize * 0.60 + 'px Arial, sans-serif';
					fontSize *= Math.min( 1, width * 0.86 / ( mainWidth + context.measureText( 'ST' ).width + gap ) );
					context.font = '700 ' + fontSize + 'px Arial, sans-serif';
					const fittedWidth = context.measureText( sign.street ).width;
					context.font = '700 ' + fontSize * 0.60 + 'px Arial, sans-serif';
					const suffixWidth = context.measureText( 'ST' ).width;
					const left = ( width - fittedWidth - gap - suffixWidth ) / 2;
					context.font = '700 ' + fontSize + 'px Arial, sans-serif';
					context.fillText( sign.street, left + fittedWidth / 2, height * 0.50 );
					context.font = '700 ' + fontSize * 0.60 + 'px Arial, sans-serif';
					context.fillText( 'ST', left + fittedWidth + gap + suffixWidth / 2, height * 0.57 );

				} else {

					let fontSize = Math.min( height * 0.32, width * 0.18 );
					context.font = '700 ' + fontSize + 'px Arial, sans-serif';
					fontSize *= Math.min( 1, width * 0.86 / context.measureText( sign.street ).width );
					context.font = '700 ' + fontSize + 'px Arial, sans-serif';
					context.fillText( sign.street, width / 2, height * 0.40 );
					context.font = '700 ' + fontSize * 0.70 + 'px Arial, sans-serif';
					context.fillText( 'ST', width / 2, height * 0.69 );

				}

				const texture = new THREE.CanvasTexture( canvas );
				texture.name = sign.name + 'Texture';
				texture.colorSpace = THREE.SRGBColorSpace;
				if ( sign.name === 'bostonStateStreetSign' ) {
					context.fillStyle = '#ffffff'; context.fillRect( 0, 0, width, height );
					const artwork = createArtwork();
					artwork.onload = () => {
						const fit = Math.min( width * 0.92 / artwork.naturalWidth, height * 0.9 / artwork.naturalHeight );
						const dw = artwork.naturalWidth * fit, dh = artwork.naturalHeight * fit;
						context.drawImage( artwork, ( width - dw ) / 2, ( height - dh ) / 2, dw, dh );
						texture.needsUpdate = true;
					};
					artwork.src = assetURL( 'assets/no-yankees.png' );
				}
				const material = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } );
				material.name = sign.name + 'Material';
				const overlay = new THREE.Mesh( new THREE.PlaneGeometry( ...sign.size ), material );
				overlay.name = sign.name;
				overlay.position.fromArray( sign.position );
				overlay.position.x += 0.08;
				// All five confirmed faces point +X. Right is +Y; up is +Z.
				overlay.rotation.set( Math.PI / 2, Math.PI / 2, 0 );
				overlay.userData = { bostonPhase: '3', label: sign.label, sourceMesh: sign.source, sourceTriangles: sign.triangles };
				bostonStreetSignGroup.add( overlay );

			}

		} else {


		}

	}
	// END Boston Phase 3.

	// BEGIN Boston Phase 3B: minimal cleanup of the remaining prominent
	// Japanese sign faces. This block only adds overlays; it does not
	// edit the shared atlas, GLB geometry, or any shared material.
	const BOSTON_SIGN_CLEANUP_ENABLED = true;

	if ( BOSTON_SIGN_CLEANUP_ENABLED ) {

		const environmentRoot = model.getObjectByName( 'Object649' );

		if ( environmentRoot ) {

			const bostonSignCleanupGroup = new THREE.Group();
			bostonSignCleanupGroup.name = 'bostonSignCleanupGroup';
			bostonSignCleanupGroup.userData.bostonPhase = '3B';
			environmentRoot.add( bostonSignCleanupGroup );

			const cleanupSigns = [
				{
					name: 'bostonNewBalanceSign', label: 'NEW BALANCE', lines: [ 'NEW BALANCE' ],
					source: 'Object649_normal_0', triangles: [ 25443, 25444 ],
					position: [ 150.81918, - 204.33820, - 68.27590 ],
					size: [ 91.19, 30.99 ], rotation: [ Math.PI / 2 + 0.0734, 0, 0 ]
				},
				{
					name: 'bostonReginaPizzaSign', label: 'REGINA PIZZA', lines: [ 'REGINA', 'PIZZA' ], kind: 'reginaPizza',
					source: 'Object649_normal_0', triangles: [ 23981, 23982 ],
					position: [ 24.84967, - 139.44760, - 28.25065 ],
					size: [ 22.74, 91.42 ], rotation: [ Math.PI / 2, 0, 0 ]
				},
				{
					name: 'bostonBostonCleanupBanner', label: 'BOSTON', lines: [ 'B', 'O', 'S', 'T', 'O', 'N' ],
					source: 'Object649_normal_0', triangles: [ 22821, 22822, 22837, 22838 ],
					position: [ - 162.28246, - 51.21353, - 139.39132 ],
					size: [ 19.54, 70.31 ], rotation: [ Math.PI / 2, 0, 0 ]
				},
				{
					name: 'bostonMarketCleanupBanner', label: 'MARKET', lines: [ 'M', 'A', 'R', 'K', 'E', 'T' ],
					source: 'Object649_normal_0', triangles: [ 22873, 22874, 22889, 22890 ],
					position: [ - 167.89156, - 100.72134, - 139.71050 ],
					size: [ 25.59, 71.76 ], rotation: [ Math.PI / 2, 0, 0 ]
				},
				{
					name: 'bostonBackBayCleanupBanner', label: 'BACK BAY', lines: [ 'B', 'A', 'C', 'K', '', 'B', 'A', 'Y' ],
					source: 'Object649_normal_0', triangles: [ 22925, 22926, 22941, 22942 ],
					position: [ - 162.28246, - 146.70248, - 139.39132 ],
					size: [ 19.54, 70.31 ], rotation: [ Math.PI / 2, 0, 0 ]
				}
			];

			for ( const sign of cleanupSigns ) {

				const canvas = document.createElement( 'canvas' );
				const vertical = sign.size[ 1 ] > sign.size[ 0 ];
				canvas.width = vertical ? 384 : 1024;
				canvas.height = vertical ? 1024 : Math.max( 256, Math.round( 1024 * sign.size[ 1 ] / sign.size[ 0 ] ) );
				const context = canvas.getContext( '2d' );
				const width = canvas.width, height = canvas.height;
				const margin = Math.min( width, height ) * 0.055;

				context.fillStyle = '#006b63';
				context.fillRect( 0, 0, width, height );
				context.strokeStyle = '#f4f3e9';
				context.lineWidth = Math.max( 3, margin * 0.18 );
				context.strokeRect( margin, margin, width - margin * 2, height - margin * 2 );
				context.fillStyle = '#f4f3e9';
				context.textAlign = 'center';
				context.textBaseline = 'middle';

				if ( vertical ) {

					const spacing = height * 0.88 / sign.lines.length;
					const fontSize = Math.min( width * 0.70, spacing * 0.78 );
					context.font = '700 ' + fontSize + 'px Arial, sans-serif';

					for ( let i = 0; i < sign.lines.length; i ++ ) {

						context.fillText( sign.lines[ i ], width / 2, height * 0.06 + spacing * ( i + 0.5 ) );

					}

				} else {

					let fontSize = Math.min( height * 0.43, width * 0.18 );
					context.font = '700 ' + fontSize + 'px Arial, sans-serif';
					fontSize *= Math.min( 1, width * 0.86 / context.measureText( sign.lines[ 0 ] ).width );
					context.font = '700 ' + fontSize + 'px Arial, sans-serif';
					context.fillText( sign.lines[ 0 ], width / 2, height / 2 );

				}

				if ( sign.kind === 'reginaPizza' ) {

					// A dedicated, opaque canvas face replaces only the former CAFE art.
					// The simple red blade follows the supplied Regina Pizza reference while
					// remaining legible at the scene's miniature viewing distance.
					context.fillStyle = '#f7f4ed';
					context.fillRect( 0, 0, width, height );
					context.fillStyle = '#c92d1f';
					context.fillRect( width * 0.18, height * 0.06, width * 0.64, height * 0.88 );
					context.fillStyle = '#9f2118';
					context.fillRect( width * 0.18, height * 0.06, width * 0.055, height * 0.88 );
					context.fillRect( width * 0.765, height * 0.06, width * 0.055, height * 0.88 );
					context.strokeStyle = '#ffffff';
					context.lineWidth = width * 0.025;
					context.strokeRect( width * 0.205, height * 0.085, width * 0.59, height * 0.83 );

					context.fillStyle = '#ffffff';
					context.font = '700 ' + Math.round( width * 0.115 ) + 'px Arial, sans-serif';
					context.fillText( 'REGINA', width / 2, height * 0.155 );
					context.font = '700 ' + Math.round( width * 0.10 ) + 'px Arial, sans-serif';
					context.fillText( 'PIZZA', width / 2, height * 0.255 );

					context.font = '900 ' + Math.round( width * 0.20 ) + 'px Arial, sans-serif';
					const pizzaLetters = [ 'P', 'I', 'Z', 'Z', 'A' ];
					for ( let i = 0; i < pizzaLetters.length; i ++ ) {

						context.fillText( pizzaLetters[ i ], width / 2, height * ( 0.39 + i * 0.105 ) );

					}

					context.font = '700 ' + Math.round( width * 0.07 ) + 'px Arial, sans-serif';
					context.fillText( 'SINCE 1926', width / 2, height * 0.86 );

				}

				const texture = new THREE.CanvasTexture( canvas );
				texture.name = sign.name + 'Texture';
				texture.colorSpace = THREE.SRGBColorSpace;
				if ( sign.name === 'bostonNewBalanceSign' ) {
					// Exact supplied artwork, contained without cropping or stretching.
					context.fillStyle = '#ffffff'; context.fillRect( 0, 0, width, height );
					const artwork = createArtwork();
					artwork.onload = () => {
						const fit = Math.min( width * 0.90 / artwork.naturalWidth, height * 0.88 / artwork.naturalHeight );
						const w = artwork.naturalWidth * fit, h = artwork.naturalHeight * fit;
						context.drawImage( artwork, ( width - w ) / 2, ( height - h ) / 2, w, h );
						texture.needsUpdate = true;
					};
					artwork.src = assetURL( 'assets/artwork-01cdcc20cf8b.png' );
				}
				const material = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } );
				material.name = sign.name + 'Material';
				const overlay = new THREE.Mesh( new THREE.PlaneGeometry( ...sign.size ), material );
				overlay.name = sign.name;
				overlay.position.fromArray( sign.position );
				overlay.rotation.set( ...sign.rotation );
				overlay.userData = {
					bostonPhase: '3B', label: sign.label,
					sourceMesh: sign.source, sourceTriangles: sign.triangles
				};
				bostonSignCleanupGroup.add( overlay );

			}

		} else {


		}

	}
	// END Boston Phase 3B.

	// BEGIN Boston Phase 4: Back Bay / Newbury storefront overlays.
	// This pass covers only three prominent storefront graphics. The
	// original building, window, door, awning, and sign geometry remains
	// unchanged; each overlay has its own CanvasTexture and material.
	const BOSTON_STOREFRONTS_ENABLED = true;

	if ( BOSTON_STOREFRONTS_ENABLED ) {

		const environmentRoot = model.getObjectByName( 'Object649' );

		if ( environmentRoot ) {

			const bostonStorefrontGroup = new THREE.Group();
			bostonStorefrontGroup.name = 'bostonStorefrontGroup';
			bostonStorefrontGroup.userData.bostonPhase = '4';
			environmentRoot.add( bostonStorefrontGroup );
			const nimoyArtworkData = assetURL( 'assets/artwork-a9be4f133fe8.png' );

			const storefronts = [
				{
					name: 'bostonMikesPastrySign', label: 'MIKES PASTRY',
					lines: [ 'MIKES PASTRY' ], palette: 'green',
					source: 'Object649_Plastic_Soft_0', triangles: [ 16780, 16781 ],
					position: [ - 33.72028, - 182.35989, - 87.06092 ],
					size: [ 63.50, 29.10 ],
					right: [ 1, 0, 0 ], up: [ 0, 0, 1 ], normal: [ 0, - 1, 0 ]
				},
				{
					name: 'bostonBruinsSign', label: 'BOSTON BRUINS',
					lines: [ 'BOSTON', 'BRUINS' ], palette: 'burgundy', kind: 'bruinsRoundel',
					source: 'Object649_Plastic_Soft_0', triangles: [ 15799, 15800 ],
					position: [ - 139.60589, - 90.37439, - 24.59321 ],
					size: [ 47.30, 44.30 ],
					right: [ 0, - 1, 0 ], up: [ 0, 0, 1 ], normal: [ - 1, 0, 0 ]
				},
				{
					name: 'bostonMayorWuSign', label: 'MAYOR WU',
					lines: [ 'M', 'A', 'Y', 'O', 'R', '', 'W', 'U' ], palette: 'blueText',
					source: 'Object649_Plastic_Soft_0', triangles: [ 15910, 15911, 15912 ],
					position: [ - 147.80245, - 168.38616, 53.37861 ],
					size: [ 17.82, 88.60 ],
					right: [ 0.706, - 0.708, 0 ], up: [ 0, 0, 1 ], normal: [ - 0.708, - 0.706, 0 ]
				}
			];

			for ( const storefront of storefronts ) {

				const vertical = storefront.size[ 1 ] > storefront.size[ 0 ];
				const canvas = document.createElement( 'canvas' );
				canvas.width = vertical ? 384 : 1024;
				canvas.height = vertical ? 1024 : Math.max( 256, Math.round( 1024 * storefront.size[ 1 ] / storefront.size[ 0 ] ) );
				const context = canvas.getContext( '2d' );
				const width = canvas.width, height = canvas.height;
				const margin = Math.min( width, height ) * 0.055;

				context.fillStyle = storefront.palette === 'blueText' ? '#f3eee0' : storefront.palette === 'burgundy' ? '#643640' : '#183c36';
				context.fillRect( 0, 0, width, height );
				context.strokeStyle = '#c6a15b';
				context.lineWidth = Math.max( 3, margin * 0.16 );
				context.strokeRect( margin, margin, width - margin * 2, height - margin * 2 );
				context.strokeStyle = storefront.palette === 'blueText' ? '#1555b6' : '#f3eee0';
				context.lineWidth = Math.max( 2, margin * 0.08 );
				context.strokeRect( margin * 1.65, margin * 1.65, width - margin * 3.3, height - margin * 3.3 );
				context.fillStyle = storefront.palette === 'blueText' ? '#1555b6' : '#f3eee0';
				context.textAlign = 'center';
				context.textBaseline = 'middle';

				if ( vertical ) {

					const spacing = height * 0.72 / storefront.lines.length;
					const fontSize = Math.min( width * 0.70, spacing * 0.70 );
					context.font = '700 ' + fontSize + 'px Arial, sans-serif';

					for ( let i = 0; i < storefront.lines.length; i ++ ) {

						context.fillText( storefront.lines[ i ], width / 2, height * 0.14 + spacing * ( i + 0.5 ) );

					}

				} else {

					let fontSize = Math.min( height * 0.34, width * 0.16 );
					context.font = '700 ' + fontSize + 'px Arial, sans-serif';
					fontSize *= Math.min( 1, width * 0.86 / context.measureText( storefront.lines[ 0 ] ).width );
					context.font = '700 ' + fontSize + 'px Arial, sans-serif';
					context.fillText( storefront.lines[ 0 ], width / 2, height / 2 );

				}

				if ( storefront.kind === 'bruinsRoundel' ) {

					// Opaque Bruins-style roundel for the former Back Bay Cafe face.
					context.fillStyle = '#ffffff';
					context.fillRect( 0, 0, width, height );
					const radius = Math.min( width, height ) * 0.43;
					const centerX = width / 2, centerY = height / 2;
					context.fillStyle = '#000000';
					context.beginPath(); context.arc( centerX, centerY, radius, 0, Math.PI * 2 ); context.fill();
					context.fillStyle = '#ffb81c';
					context.beginPath(); context.arc( centerX, centerY, radius * 0.84, 0, Math.PI * 2 ); context.fill();
					context.fillStyle = '#ffffff';
					context.beginPath(); context.arc( centerX, centerY, radius * 0.66, 0, Math.PI * 2 ); context.fill();
					context.strokeStyle = '#ffb81c';
					context.lineWidth = Math.max( 6, radius * 0.10 );
					for ( let i = 0; i < 8; i ++ ) {

						const angle = i * Math.PI / 4;
						context.beginPath();
						context.moveTo( centerX + Math.cos( angle ) * radius * 0.16, centerY + Math.sin( angle ) * radius * 0.16 );
						context.lineTo( centerX + Math.cos( angle ) * radius * 0.66, centerY + Math.sin( angle ) * radius * 0.66 );
						context.stroke();

					}
					context.fillStyle = '#000000';
					context.font = '900 ' + Math.round( radius * 1.25 ) + 'px Arial Black, Arial, sans-serif';
					context.fillText( 'B', centerX, centerY + radius * 0.12 );

				}

				const texture = new THREE.CanvasTexture( canvas );
				texture.name = storefront.name + 'Texture';
				texture.colorSpace = THREE.SRGBColorSpace;
				if ( storefront.name === 'bostonMikesPastrySign' ) {
					// Preserve the supplied logo; fit it inside the existing display.
					context.fillStyle = '#ffffff'; context.fillRect( 0, 0, width, height );
					const artwork = createArtwork();
					artwork.onload = () => {
						const fit = Math.min( width * 0.94 / artwork.naturalWidth, height * 0.94 / artwork.naturalHeight );
						const w = artwork.naturalWidth * fit, h = artwork.naturalHeight * fit;
						context.drawImage( artwork, ( width - w ) / 2, ( height - h ) / 2, w, h );
						texture.needsUpdate = true;
					};
					artwork.src = assetURL( 'assets/artwork-19568f3438a5.png' );
				}
				if ( storefront.name === 'bostonBruinsSign' ) {
					// Swapped from the rear plaque: preserve the complete Nimoy image.
					context.fillStyle = '#170805'; context.fillRect( 0, 0, width, height );
					const artwork = createArtwork();
					artwork.onload = () => {
						const fit = Math.min( width * 0.96 / artwork.naturalWidth, height * 0.96 / artwork.naturalHeight );
						const w = artwork.naturalWidth * fit, h = artwork.naturalHeight * fit;
						context.drawImage( artwork, ( width - w ) / 2, ( height - h ) / 2, w, h );
						texture.needsUpdate = true;
					};
					artwork.src = nimoyArtworkData;
				}
				const material = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false, side: THREE.DoubleSide } );
				material.name = storefront.name + 'Material';
				const overlay = new THREE.Mesh( new THREE.PlaneGeometry( ...storefront.size ), material );
				overlay.name = storefront.name;
				overlay.position.fromArray( storefront.position );
				overlay.quaternion.setFromRotationMatrix( new THREE.Matrix4().makeBasis(
					new THREE.Vector3().fromArray( storefront.right ),
					new THREE.Vector3().fromArray( storefront.up ),
					new THREE.Vector3().fromArray( storefront.normal )
				) );
				overlay.userData = {
					bostonPhase: '4', label: storefront.label,
					sourceMesh: storefront.source, sourceTriangles: storefront.triangles
				};
				bostonStorefrontGroup.add( overlay );

			}

		} else {


		}

	}
	// END Boston Phase 4.

	// BEGIN Boston WHOOP: isolated replacement of the confirmed cream lettering.
	// Set false and reload to undo only this sign.
	const BOSTON_WHOOP_ENABLED = true;

	if ( BOSTON_WHOOP_ENABLED ) {

		const whoopSurface = model.getObjectByName( 'Object649_Plastic_Soft_0' );

		if ( whoopSurface?.isMesh ) {

			// Atlas UVs match the four characters in the supplied close-up.
			// Only the wide +Y-facing instance is covered; the diagonal copy stays.
			// Source triangles: 12195–12893 and 16819–16823.
			// Source bounds: X 78.80188–175.63596, Y 141.33572–143.90863,
			// Z -76.73592–-56.78769. Shared Plastic_Soft remains unchanged.
			const texture = loadTexture(
				assetURL( 'assets/artwork-4906f15ce859.png' )
			);
			texture.name = 'bostonWhoopTexture';
			texture.colorSpace = THREE.SRGBColorSpace;
			const material = new THREE.MeshBasicMaterial( {
				map: texture, toneMapped: false
			} );
			material.name = 'bostonWhoopMaterial';

			// Preserve the supplied artwork's aspect ratio, with a small border
			// beyond the raised letters. +0.12 clears their outermost face.
			const overlay = new THREE.Mesh(
				new THREE.PlaneGeometry( 99, 99 * 218 / 738 ), material
			);
			overlay.name = 'bostonWhoopSign';
			overlay.position.set( 127.21892, 144.02863, - 66.76180 );
			// Right = -X, up = +Z, outward normal = +Y.
			overlay.rotation.set( Math.PI / 2, Math.PI, 0 );
			overlay.userData = {
				bostonPhase: 'WHOOP',
				sourceMesh: 'Object649_Plastic_Soft_0',
				sourceTriangleRanges: [ [ 12195, 12893 ], [ 16819, 16823 ] ],
				surfaceOffset: 0.12
			};
			whoopSurface.add( overlay );

		}

	}
	// END Boston WHOOP.




	// BEGIN Paul Revere: running-watermelon poster immediately left of WHOOP.
	const vertexSource = model.getObjectByName( 'Object649_paintmat_0' );
	if ( vertexSource ) {
		const canvas = document.createElement( 'canvas' ); canvas.width = 512; canvas.height = 560;
		const ctx = canvas.getContext( '2d' ); ctx.fillStyle = '#16080c'; ctx.fillRect( 0, 0, 512, 560 );
		const texture = new THREE.CanvasTexture( canvas ); texture.name = 'bostonPaulRevereSignTexture'; texture.colorSpace = THREE.SRGBColorSpace;
		const artwork = createArtwork();
		artwork.onload = () => {
			const fit = Math.min( 512 / artwork.naturalWidth, 560 / artwork.naturalHeight );
			const dw = artwork.naturalWidth * fit, dh = artwork.naturalHeight * fit;
			ctx.drawImage( artwork, ( 512 - dw ) / 2, ( 560 - dh ) / 2, dw, dh ); texture.needsUpdate = true;
		};
		artwork.src = assetURL( 'assets/artwork-56d6324b4812.png' );
		const material = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } ); material.name = 'bostonPaulRevereSignMaterial';
		const normal = new THREE.Vector3( - 29.539093, - 12.53479, 0 ).normalize();
		const up = new THREE.Vector3( 0, 0, 1 );
		const right = new THREE.Vector3().crossVectors( up, normal ).normalize();
		const sign = new THREE.Mesh( new THREE.PlaneGeometry( 33.6, 37 ), material ); sign.name = 'bostonPaulRevereSign';
		sign.position.set( - 35.69807, 145.79729, - 58.50463 ).addScaledVector( normal, 0.18 );
		sign.quaternion.setFromRotationMatrix( new THREE.Matrix4().makeBasis( right, up, normal ) );
		vertexSource.add( sign );
	}
	// END Paul Revere.

	// BEGIN Newbury Comics: overlay only on the watermelon sign face.
	const newburySource = model.getObjectByName( 'Object649_paintmat_0' );
	if ( newburySource ) {
		const canvas = document.createElement( 'canvas' ); canvas.width = 512; canvas.height = 576;
		const ctx = canvas.getContext( '2d' );
		ctx.fillStyle = '#faf9f5'; ctx.fillRect( 0, 0, 512, 576 );
		ctx.fillStyle = '#151515'; ctx.textAlign = 'center';
		ctx.font = 'bold 47px Arial, sans-serif'; ctx.fillText( 'newbury comics', 256, 510, 460 );
		const texture = new THREE.CanvasTexture( canvas ); texture.name = 'bostonNewburyComicsTexture'; texture.colorSpace = THREE.SRGBColorSpace;
		const artwork = createArtwork();
		artwork.onload = () => {
			ctx.drawImage( artwork, 26, 42, 460, 346 );
			texture.needsUpdate = true;
		};
		artwork.src = assetURL( 'assets/artwork-bdee915d8a77.png' );
		const shape = new THREE.Shape();
		shape.moveTo( - 19, - 24 ); shape.lineTo( 19, - 24 );
		shape.quadraticCurveTo( 22, - 24, 22, - 21 ); shape.lineTo( 22, 21 );
		shape.quadraticCurveTo( 22, 24, 19, 24 ); shape.lineTo( - 19, 24 );
		shape.quadraticCurveTo( - 22, 24, - 22, 21 ); shape.lineTo( - 22, - 21 );
		shape.quadraticCurveTo( - 22, - 24, - 19, - 24 );
		const geometry = new THREE.ShapeGeometry( shape, 4 );
		const positions = geometry.attributes.position, uv = geometry.attributes.uv;
		for ( let i = 0; i < uv.count; i ++ ) uv.setXY( i, ( positions.getX( i ) + 22 ) / 44, ( positions.getY( i ) + 24 ) / 48 );
		const material = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } ); material.name = 'bostonNewburyComicsMaterial';
		const sign = new THREE.Mesh( geometry, material ); sign.name = 'bostonNewburyComicsSign';
		sign.position.set( 221.73575, 129.6, - 57.56367 ); sign.rotation.x = Math.PI / 2;
		newburySource.add( sign );
	}
	// END Newbury Comics.

	// BEGIN Boston Cleanup A–E: independent face overlays, source data read-only.
	// Disable any entry below and reload to undo that cleanup alone.
	const bostonCleanupFaces = [
		// WHOOP-side face of the projecting watermelon board; reverse is Newbury Comics.
		{ enabled: true, phase: 'C', name: 'bostonBigDigSign', mesh: 'Object649_paintmat_0', faces: [ 8744, 8745, 8759, 8760, 8766, 9359 ], normal: [ 0, 1, 0 ], kind: 'bigDig' },
		// Milkshake artwork only: atlas u=.8675–.9498, v=.5201–.5603.
		{ enabled: true, phase: 'C', name: 'bostonLorettasSign', mesh: 'Object649_Plastic_Soft_0', faces: [ 15913, 15914, 15915, 15916, 15917, 15918 ], normal: [ 0, 0.9659, - 0.2588 ], up: [ 0, 0.2588, 0.9659 ], kind: 'lorettas' },
		{ enabled: true, phase: 'A', name: 'bostonCelticsSign', mesh: 'Object649_normal_0', faces: [ 27233, 27234, 27235, 27236, 27237, 27238 ], normal: [ 0, 1, 0 ], kind: 'poster' },
		// Raycast-verified hanging plaque, atlas UVs u=.289–.329, v=.121–.144.
		// Only its two flat, rounded sign faces; exclude thickness, hooks and frame.
		{ enabled: true, phase: 'B', name: 'bostonApplesBoard', mesh: 'Object689_metalmat_0', faces: [ 161, 162, 172, 173, 191, 192, 198, 199, 200, 201 ], normal: [ - 1, 1, 0 ], kind: 'apples' },
		{ enabled: true, phase: 'B', name: 'bostonApplesBoardBack', mesh: 'Object689_metalmat_0', faces: [ 158, 165, 166, 176, 177, 178, 179, 180, 181, 182 ], normal: [ 1, - 1, 0 ], kind: 'apples' },
		{ enabled: true, phase: 'C', name: 'bostonRightCafeSign', mesh: 'Object649_paintmat_0', faces: [ 6195, 6196, 6210, 6211, 6217, 9387 ], normal: [ 0.921, 0.39, 0 ], kind: 'cafe' },
		{ enabled: true, phase: 'D', name: 'bostonGoSoxSign', mesh: 'Object649_paintmat_0', faces: Array.from( { length: 61 }, ( _, i ) => 8624 + i ), normal: [ - 1, 1, 0 ], kind: 'baseball' },
		{ enabled: true, phase: 'E', name: 'bostonTeaPartyMural', mesh: 'Object649_normal_0', faces: [ 26762, 26763, 26764, 26767, 26768, 26769, 26770 ], normal: [ 0, 1, 0 ], kind: 'teaParty' }
	];

	for ( const spec of bostonCleanupFaces ) {

		if ( ! spec.enabled ) continue;
		const source = model.getObjectByName( spec.mesh );
		if ( ! source?.isMesh ) continue;
		const normal = new THREE.Vector3( ...spec.normal ).normalize();
		const up = new THREE.Vector3( ...( spec.up || [ 0, 0, 1 ] ) ).normalize();
		const right = new THREE.Vector3().crossVectors( up, normal ).normalize();
		const attribute = source.geometry.getAttribute( 'position' );
		const index = source.geometry.index;
		const points = spec.faces.flatMap( face => [ 0, 1, 2 ].map( corner =>
			new THREE.Vector3().fromBufferAttribute( attribute, index ? index.getX( face * 3 + corner ) : face * 3 + corner )
		) );
		const xs = points.map( p => p.dot( right ) ), ys = points.map( p => p.dot( up ) );
		const minX = Math.min( ...xs ), minY = Math.min( ...ys );
		const width = Math.max( ...xs ) - minX, height = Math.max( ...ys ) - minY;
		const canvas = document.createElement( 'canvas' );
		canvas.width = 768;
		canvas.height = Math.round( 768 * height / width );
		const ctx = canvas.getContext( '2d' ), w = canvas.width, h = canvas.height;
		const text = ( label, y, size, color = '#f0eadb' ) => {
			ctx.fillStyle = color;
			ctx.font = '600 ' + size + 'px Arial, sans-serif';
			ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
			ctx.fillText( label, w / 2, y, w * 0.85 );
		};
		const roundel = ( y, radius ) => {
			ctx.beginPath(); ctx.arc( w / 2, y, radius, 0, Math.PI * 2 );
			ctx.fillStyle = '#faf9f3'; ctx.fill();
			ctx.strokeStyle = '#141b1a'; ctx.lineWidth = radius * 0.09; ctx.stroke();
			ctx.fillStyle = '#141b1a';
			ctx.fillRect( w / 2 - radius * 0.61, y - radius * 0.49, radius * 1.22, radius * 0.3 );
			ctx.fillRect( w / 2 - radius * 0.16, y - radius * 0.49, radius * 0.32, radius * 1.15 );
		};
		ctx.fillStyle = spec.kind === 'cafe' ? '#eeeadf' : '#203f3e';
		ctx.fillRect( 0, 0, w, h );
		if ( spec.kind === 'apples' ) {
			ctx.fillStyle = '#18253a'; ctx.fillRect( 0, 0, w, h );
			ctx.strokeStyle = '#c6a15b'; ctx.lineWidth = Math.max( 5, w * 0.025 );
			ctx.strokeRect( w * 0.045, h * 0.10, w * 0.91, h * 0.80 );
			ctx.fillStyle = '#f3eee0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
			ctx.font = '700 ' + Math.round( w * 0.095 ) + 'px Georgia, serif';
			ctx.fillText( 'HOW DO YOU LIKE', w / 2, h * 0.36, w * 0.83 );
			ctx.font = '700 ' + Math.round( w * 0.125 ) + 'px Georgia, serif';
			ctx.fillText( 'THEM APPLES?', w / 2, h * 0.64, w * 0.83 );
		} else if ( spec.kind === 'transit' ) {
			roundel( h * 0.4, Math.min( w * 0.34, h * 0.29 ) );
			text( 'GREEN LINE', h * 0.79, w * 0.095 );
			text( 'COPLEY', h * 0.9, w * 0.058 );
		} else if ( spec.kind === 'cafe' ) {
			ctx.strokeStyle = '#27374e'; ctx.lineWidth = 5;
			ctx.strokeRect( w * 0.06, h * 0.06, w * 0.88, h * 0.88 );
			text( 'CAFE', h * 0.46, w * 0.2, '#27374e' );
			text( 'BACK BAY', h * 0.65, w * 0.065, '#27374e' );
		} else if ( spec.kind === 'baseball' ) {
			// Painted-sign palette: aged cream, navy, and muted baseball red.
			ctx.fillStyle = '#e9dfc7'; ctx.fillRect( 0, 0, w, h );
			ctx.strokeStyle = '#24394c'; ctx.lineWidth = w * 0.027;
			ctx.strokeRect( w * 0.035, h * 0.035, w * 0.93, h * 0.93 );
			ctx.strokeStyle = '#ad3541'; ctx.lineWidth = w * 0.005;
			ctx.strokeRect( w * 0.065, h * 0.065, w * 0.87, h * 0.87 );
			ctx.font = '900 ' + w * 0.24 + 'px Georgia, serif';
			ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
			ctx.lineWidth = w * 0.008; ctx.strokeStyle = '#24394c'; ctx.fillStyle = '#ad3541';
			for ( const [ label, y ] of [ [ 'GO', h * 0.3 ], [ 'SOX', h * 0.59 ] ] ) {
				ctx.strokeText( label, w / 2, y, w * 0.8 ); ctx.fillText( label, w / 2, y, w * 0.8 );
			}
			text( 'FENWAY', h * 0.82, w * 0.065, '#24394c' );
		} else {
			const poster = spec.kind === 'poster';
			ctx.fillStyle = poster ? '#cfaa75' : '#8fa9a0'; ctx.fillRect( 0, 0, w, h );
			ctx.fillStyle = poster ? '#b96543' : '#c6ba92';
			ctx.beginPath(); ctx.arc( w * 0.77, h * 0.32, w * 0.12, 0, Math.PI * 2 ); ctx.fill();
			ctx.fillStyle = '#345653';
			const buildings = [ [ 0.07, 0.46, 0.09 ], [ 0.19, 0.34, 0.07 ], [ 0.3, 0.4, 0.08 ], [ 0.43, 0.29, 0.06 ], [ 0.53, 0.45, 0.11 ], [ 0.68, 0.4, 0.1 ], [ 0.82, 0.49, 0.08 ] ];
			for ( const [ x, y, bw ] of buildings ) ctx.fillRect( w * x, h * y, w * bw, h * ( 0.66 - y ) );
			ctx.fillStyle = '#416e68'; ctx.fillRect( 0, h * 0.65, w, h * 0.35 );
			ctx.fillStyle = '#b49472'; ctx.fillRect( 0, h * 0.63, w, h * 0.045 );
			for ( let i = 0; i < 5; i ++ ) ctx.fillRect( w * ( i * 0.23 + 0.02 ), h * 0.66, w * 0.035, h * 0.1 );
			ctx.strokeStyle = '#88a79a'; ctx.lineWidth = 2;
			for ( let i = 0; i < 13; i ++ ) { const x = ( i * 137 % 700 ) / 768 * w, y = h * ( 0.72 + i * 0.019 ); ctx.beginPath(); ctx.moveTo( x, y ); ctx.lineTo( x + w * 0.14, y ); ctx.stroke(); }
			if ( poster ) {
				text( 'BOSTON', h * 0.14, w * 0.13, '#203f3e' );
			} else {
				ctx.strokeStyle = '#eee6cd'; ctx.lineWidth = 4;
				ctx.beginPath(); ctx.moveTo( w * 0.18, h * 0.84 ); ctx.lineTo( w * 0.68, h * 0.84 ); ctx.stroke();
				for ( let i = 0; i < 4; i ++ ) { const x = w * ( 0.27 + i * 0.09 ); ctx.beginPath(); ctx.moveTo( x - w * 0.06, h * 0.91 ); ctx.lineTo( x, h * 0.82 ); ctx.stroke(); }
			}
		}
		const texture = new THREE.CanvasTexture( canvas );
		texture.name = spec.name + 'Texture'; texture.colorSpace = THREE.SRGBColorSpace;
		if ( spec.kind === 'teaParty' ) {
			ctx.fillStyle = '#ffffff'; ctx.fillRect( 0, 0, w, h );
			const artwork = createArtwork();
			artwork.onload = () => {
				// Keep the whole image in the exposed upper wall, above the bench.
				const fit = Math.min( w * 0.94 / artwork.naturalWidth, h * 0.65 / artwork.naturalHeight );
				const dw = artwork.naturalWidth * fit, dh = artwork.naturalHeight * fit;
				ctx.drawImage( artwork, w * 0.08, h * 0.025, dw, dh ); texture.needsUpdate = true;
			};
			artwork.src = assetURL( 'assets/boston-tea-party.png' );
		}
		if ( spec.kind === 'bigDig' ) {
			ctx.fillStyle = '#ffffff'; ctx.fillRect( 0, 0, w, h );
			const artwork = createArtwork();
			artwork.onload = () => {
				const fit = Math.min( w / artwork.naturalWidth, h / artwork.naturalHeight );
				const dw = artwork.naturalWidth * fit, dh = artwork.naturalHeight * fit;
				ctx.drawImage( artwork, ( w - dw ) / 2, ( h - dh ) / 2, dw, dh );
				texture.needsUpdate = true;
			};
			artwork.src = assetURL( 'assets/big-dig-new.png' );
		}
		if ( spec.kind === 'lorettas' ) {
			ctx.fillStyle = '#ffffff'; ctx.fillRect( 0, 0, w, h );
			const artwork = createArtwork();
			artwork.onload = () => {
				const fit = Math.min( w * 0.92 / artwork.naturalWidth, h * 0.92 / artwork.naturalHeight );
				const dw = artwork.naturalWidth * fit, dh = artwork.naturalHeight * fit;
				ctx.drawImage( artwork, ( w - dw ) / 2, ( h - dh ) / 2, dw, dh );
				texture.needsUpdate = true;
			};
			artwork.src = assetURL( 'assets/lorettas-last-call.png' );
		}
		if ( spec.name === 'bostonRightCafeSign' ) {
			// Supplied poster on the existing isolated CAFE / BACK BAY face only.
			ctx.fillStyle = '#f8bfd5'; ctx.fillRect( 0, 0, w, h );
			const artwork = createArtwork();
			artwork.onload = () => {
				const fit = Math.min( w / artwork.naturalWidth, h / artwork.naturalHeight );
				const dw = artwork.naturalWidth * fit, dh = artwork.naturalHeight * fit;
				ctx.drawImage( artwork, ( w - dw ) / 2, ( h - dh ) / 2, dw, dh );
				texture.needsUpdate = true;
			};
			artwork.src = assetURL( 'assets/artwork-6cd351f34d72.png' );
		}
		if ( spec.name === 'bostonCelticsSign' ) {
			// Exact supplied Celtics image on the former Boston skyline display.
			ctx.fillStyle = '#ffffff'; ctx.fillRect( 0, 0, w, h );
			const artwork = createArtwork();
			artwork.onload = () => {
				const fit = Math.min( w * 0.94 / artwork.naturalWidth, h * 0.94 / artwork.naturalHeight );
				const dw = artwork.naturalWidth * fit, dh = artwork.naturalHeight * fit;
				ctx.drawImage( artwork, ( w - dw ) / 2, ( h - dh ) / 2, dw, dh );
				texture.needsUpdate = true;
			};
			artwork.src = assetURL( 'assets/artwork-22ecf561c357.png' );
		}
		if ( spec.kind === 'baseball' ) {
			// Supplied artwork, contained without stretching on the existing panel.
			ctx.fillStyle = '#142638'; ctx.fillRect( 0, 0, w, h );
			const artwork = createArtwork();
			artwork.onload = () => {
				const fit = Math.min( w / artwork.width, h / artwork.height );
				const dw = artwork.width * fit, dh = artwork.height * fit;
				ctx.drawImage( artwork, ( w - dw ) / 2, ( h - dh ) / 2, dw, dh );
				texture.needsUpdate = true;
			};
			artwork.src = assetURL( 'assets/artwork-f743035b106b.png' );
		}
		const material = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } );
		material.name = spec.name + 'Material';
		// New buffers reproduce only the selected face, preserving clipped edges
		// and the mural wall's slight unevenness. No source buffer is edited.
		const geometry = spec.kind === 'baseball' ? new THREE.PlaneGeometry( width + 1, height + 1 ) : new THREE.BufferGeometry();
		if ( spec.kind !== 'baseball' ) {
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( points.flatMap( p => p.clone().addScaledVector( normal, 0.12 ).toArray() ), 3 ) );
		geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( points.flatMap( ( p, i ) => [ ( xs[ i ] - minX ) / width, ( ys[ i ] - minY ) / height ] ), 2 ) );
		geometry.computeVertexNormals();
		}
		const overlay = new THREE.Mesh( geometry, material );
		if ( spec.kind === 'baseball' ) {
			// One flat rectangle covers the original irregular artwork. The backing
			// remains intact; place just beyond its furthest outward vertex.
			overlay.position.copy( right ).multiplyScalar( minX + width / 2 )
				.addScaledVector( up, minY + height / 2 )
				.addScaledVector( normal, Math.max( ...points.map( p => p.dot( normal ) ) ) + 0.15 );
			overlay.quaternion.setFromRotationMatrix( new THREE.Matrix4().makeBasis( right, up, normal ) );
		}
		overlay.name = spec.name;
		overlay.userData = { bostonPhase: 'Cleanup ' + spec.phase, sourceMesh: spec.mesh, sourceTriangles: spec.faces, offset: spec.kind === 'baseball' ? 0.15 : 0.12 };
		source.add( overlay );

	}
	// END Boston Cleanup A–E.

	// BEGIN BCG replacement for the former MBTA / Boston Transit board.
	const BOSTON_BCG_SIGN_ENABLED = true;
	const bcgRoot = model.getObjectByName( 'Object649' );
	if ( BOSTON_BCG_SIGN_ENABLED && bcgRoot ) {
		const canvas = document.createElement( 'canvas' ); canvas.width = 1024; canvas.height = 512;
		const ctx = canvas.getContext( '2d' );
		ctx.fillStyle = '#17734f'; ctx.fillRect( 0, 0, 1024, 512 );
		const texture = new THREE.CanvasTexture( canvas ); texture.name = 'bostonBCGSignTexture'; texture.colorSpace = THREE.SRGBColorSpace;
		const artwork = createArtwork();
		artwork.onload = () => {
			// Match the supplied background exactly and preserve the logo proportions.
			ctx.drawImage( artwork, 0, 0, 1, 1 );
			const pixel = ctx.getImageData( 0, 0, 1, 1 ).data;
			ctx.fillStyle = 'rgb(' + pixel[ 0 ] + ',' + pixel[ 1 ] + ',' + pixel[ 2 ] + ')';
			ctx.fillRect( 0, 0, 1024, 512 );
			ctx.drawImage( artwork, 256, 0, 512, 512 );
			texture.needsUpdate = true;
		};
		artwork.src = assetURL( 'assets/artwork-004774fddcca.png' );
		const material = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } ); material.name = 'bostonBCGSignMaterial';
		const sign = new THREE.Mesh( new THREE.PlaneGeometry( 100, 52 ), material );
		sign.name = 'bostonBCGSign'; sign.position.set( 147.41, - 190, 42.84 ); sign.rotation.x = Math.PI / 2;
		bcgRoot.add( sign );
	}
	// END BCG sign.

	// BEGIN remaining prominent Japanese sign cleanup from normal views.
	const BOSTON_VISIBLE_JAPANESE_CLEANUP_ENABLED = true;
	if ( BOSTON_VISIBLE_JAPANESE_CLEANUP_ENABLED ) {
		const root = model.getObjectByName( 'Object649' );
		const verticalSource = model.getObjectByName( 'Object649_normal_0' );
		if ( root && verticalSource ) {
			const canvas = document.createElement( 'canvas' ); canvas.width = 384; canvas.height = 1024;
			const ctx = canvas.getContext( '2d' ); ctx.fillStyle = '#24384d'; ctx.fillRect( 0, 0, 384, 1024 );
			ctx.strokeStyle = '#d3b674'; ctx.lineWidth = 18; ctx.strokeRect( 18, 18, 348, 988 );
			ctx.fillStyle = '#f3ede0'; ctx.font = 'bold 112px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
			for ( const [ i, text ] of [ 'BACK', 'BAY' ].entries() ) ctx.fillText( text, 192, 350 + i * 310, 330 );
			const texture = new THREE.CanvasTexture( canvas ); texture.name = 'bostonBackBayVerticalTexture'; texture.colorSpace = THREE.SRGBColorSpace;
			const sign = new THREE.Mesh( new THREE.PlaneGeometry( 15.2, 39 ), new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } ) );
			sign.name = 'bostonBackBayVerticalSign'; sign.position.set( 238.35, - 103.05, - 30.99 ); sign.rotation.x = Math.PI / 2;
			sign.userData = { sourceMesh: verticalSource.name, sourceTriangles: [ 23798, 23810 ] };
			root.add( sign );
		}
		const noticeSource = model.getObjectByName( 'Object649_paintmat_0' );
		if ( noticeSource ) {
			const canvas = document.createElement( 'canvas' ); canvas.width = 768; canvas.height = 480;
			const ctx = canvas.getContext( '2d' ); ctx.fillStyle = '#31506b'; ctx.fillRect( 0, 0, 768, 480 );
			ctx.strokeStyle = '#d6c28e'; ctx.lineWidth = 18; ctx.strokeRect( 16, 16, 736, 448 );
			ctx.fillStyle = '#f5efe0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 108px Arial';
			ctx.fillText( 'FENWAY', 384, 205, 690 ); ctx.font = 'bold 55px Arial'; ctx.fillText( 'BOSTON', 384, 335 );
			const texture = new THREE.CanvasTexture( canvas ); texture.name = 'bostonFenwayNoticeTexture'; texture.colorSpace = THREE.SRGBColorSpace;
			const normal = new THREE.Vector3( 0.734694, - 0.673469, - 0.081633 ).normalize();
			const right = new THREE.Vector3().crossVectors( new THREE.Vector3( 0, 0, 1 ), normal ).normalize();
			const up = new THREE.Vector3().crossVectors( normal, right ).normalize();
			const sign = new THREE.Mesh( new THREE.PlaneGeometry( 24, 16.5 ), new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } ) );
			sign.name = 'bostonFenwayNotice'; sign.position.set( 234.69, - 217.68, - 119.67 ).addScaledVector( normal, 0.25 );
			sign.quaternion.setFromRotationMatrix( new THREE.Matrix4().makeBasis( right, up, normal ) );
			noticeSource.add( sign );
		}
		// Two raised character plaques on the rear storefront remain readable from
		// a common three-quarter view. Cover both with one restrained Boston panel.
		const canvas = document.createElement( 'canvas' ); canvas.width = 768; canvas.height = 512;
		const ctx = canvas.getContext( '2d' ); ctx.fillStyle = '#170805'; ctx.fillRect( 0, 0, 768, 512 );
		ctx.strokeStyle = '#c7ad76'; ctx.lineWidth = 22; ctx.strokeRect( 18, 18, 732, 476 );
		const texture = new THREE.CanvasTexture( canvas ); texture.name = 'bostonBruinsPlaqueTexture'; texture.colorSpace = THREE.SRGBColorSpace;
		const drawBruinsPlaque = () => {
			ctx.fillStyle = '#ffffff'; ctx.fillRect( 0, 0, 768, 512 );
			const centerX = 384, centerY = 256, radius = 215;
			ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.arc( centerX, centerY, radius, 0, Math.PI * 2 ); ctx.fill();
			ctx.fillStyle = '#ffb81c'; ctx.beginPath(); ctx.arc( centerX, centerY, radius * 0.84, 0, Math.PI * 2 ); ctx.fill();
			ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc( centerX, centerY, radius * 0.66, 0, Math.PI * 2 ); ctx.fill();
			ctx.strokeStyle = '#ffb81c'; ctx.lineWidth = 22;
			for ( let i = 0; i < 8; i ++ ) {
				const angle = i * Math.PI / 4;
				ctx.beginPath(); ctx.moveTo( centerX + Math.cos( angle ) * radius * 0.16, centerY + Math.sin( angle ) * radius * 0.16 );
				ctx.lineTo( centerX + Math.cos( angle ) * radius * 0.66, centerY + Math.sin( angle ) * radius * 0.66 ); ctx.stroke();
			}
			ctx.fillStyle = '#000000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
			ctx.font = '900 270px Arial Black, Arial, sans-serif'; ctx.fillText( 'B', centerX, centerY + 20 );
			ctx.strokeStyle = '#c7ad76'; ctx.lineWidth = 22; ctx.strokeRect( 18, 18, 732, 476 );
			texture.needsUpdate = true;
		};
		drawBruinsPlaque();
		const material = new THREE.MeshBasicMaterial( { map: texture, side: THREE.DoubleSide, toneMapped: false } );
		material.name = 'bostonBruinsPlaqueMaterial';
		const sign = new THREE.Mesh( new THREE.PlaneGeometry( 45, 42 ), material ); sign.name = 'bostonBruinsPlaque';
		sign.position.set( - 223.2, - 112.5, 50 );
		sign.quaternion.setFromRotationMatrix( new THREE.Matrix4().makeBasis(
			new THREE.Vector3( 0, 0, 1 ), new THREE.Vector3( 0, 1, 0 ), new THREE.Vector3( - 1, 0, 0 )
		) );
		model.add( sign );

	}
	// END remaining prominent Japanese sign cleanup.

	// BEGIN road lettering cover: right-side street surface.
	const BOSTON_BLACK_ROAD_PATCH_ENABLED = true;
	if ( BOSTON_BLACK_ROAD_PATCH_ENABLED ) {
		const material = new THREE.MeshBasicMaterial( { color: 0x100e10, toneMapped: false, side: THREE.DoubleSide } );
		material.name = 'bostonBlackAsphaltMaterial';
		// Model-local planes sit just above the road and stay inside their lanes.
		for ( const [ name, width, depth, x, z, y ] of [
			[ 'bostonBlackRoadPatchFront', 50, 20, - 37, 188, - 196.1 ],
			[ 'bostonBlackRoadPatchRight', 48, 120, 147, - 110, - 197.6 ]
		] ) {
			const patch = new THREE.Mesh( new THREE.PlaneGeometry( width, depth ), material ); patch.name = name;
			patch.position.set( x, y, z ); patch.rotation.x = - Math.PI / 2; model.add( patch );
		}
	}
	// END road lettering cover.

	// BEGIN Patriots poster: upper plaques above WHOOP, not the lower black sign.
	const BOSTON_PATRIOTS_POSTER_ENABLED = true;
	const patriotsRoot = model.getObjectByName( 'Object649' );
	if ( BOSTON_PATRIOTS_POSTER_ENABLED && patriotsRoot ) {
		const canvas = document.createElement( 'canvas' );
		canvas.width = 1000; canvas.height = 400;
		const ctx = canvas.getContext( '2d' );
		ctx.fillStyle = '#ffffff'; ctx.fillRect( 0, 0, 1000, 400 );
		const texture = new THREE.CanvasTexture( canvas );
		texture.name = 'bostonPatriotsPosterTexture'; texture.colorSpace = THREE.SRGBColorSpace;
		const artwork = createArtwork();
		artwork.onload = () => {
			ctx.fillStyle = '#081a30'; ctx.fillRect( 0, 0, 1000, 400 );
			// Remove only navy margins; retain the complete supplied logo.
			const sx = 0, sy = 45, sw = artwork.naturalWidth, sh = 135;
			const fit = Math.min( 960 / sw, 376 / sh );
			ctx.drawImage( artwork, sx, sy, sw, sh, ( 1000 - sw * fit ) / 2, ( 400 - sh * fit ) / 2, sw * fit, sh * fit );
			texture.needsUpdate = true;
		};
		artwork.src = assetURL( 'assets/patriots-navy.png' );
		const material = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } );
		material.name = 'bostonPatriotsPosterMaterial';
		const poster = new THREE.Mesh( new THREE.PlaneGeometry( 68, 27 ), material );
		poster.name = 'bostonPatriotsPoster';
		// Covers the upper metal plaques/medallion bounds without touching the awning.
		poster.position.set( 121.1472, 144.5, 6.6594 );
		poster.rotation.set( Math.PI / 2, Math.PI, 0 );
		patriotsRoot.add( poster );
	}
	// END Patriots poster.

	// BEGIN MGH poster over the raised gold letters below the Red Sox sign.
	const BOSTON_MGH_POSTER_ENABLED = true;
	const mghSource = model.getObjectByName( 'Object649_Plastic_Soft_0' );
	if ( BOSTON_MGH_POSTER_ENABLED && mghSource ) {
		const canvas = document.createElement( 'canvas' );
		canvas.width = 1200; canvas.height = 420;
		const context = canvas.getContext( '2d' );
		context.fillStyle = '#ffffff'; context.fillRect( 0, 0, 1200, 420 );
		const texture = new THREE.CanvasTexture( canvas );
		texture.name = 'bostonMGHPosterTexture'; texture.colorSpace = THREE.SRGBColorSpace;
		const artwork = createArtwork();
		artwork.onload = () => {
			const fit = Math.min( 1140 / artwork.naturalWidth, 392 / artwork.naturalHeight );
			const w = artwork.naturalWidth * fit, h = artwork.naturalHeight * fit;
			context.drawImage( artwork, ( 1200 - w ) / 2, ( 420 - h ) / 2, w, h );
			texture.needsUpdate = true;
		};
		artwork.src = assetURL( 'assets/artwork-c3fcf9413eaa.png' );
		const material = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } );
		material.name = 'bostonMGHPosterMaterial';
		const poster = new THREE.Mesh( new THREE.PlaneGeometry( 64, 23 ), material );
		poster.name = 'bostonMGHPoster';
		const up = new THREE.Vector3( 0, 0, 1 );
		const normal = new THREE.Vector3( - 1, 1, 0 ).normalize();
		const right = new THREE.Vector3().crossVectors( up, normal ).normalize();
		// Right-handed basis: right x up = normal. Cover the complete raised lettering.
		// Letter bounds: right [-47.164,9.022], Z [-74.430,-59.194].
		poster.position.copy( right ).multiplyScalar( - 19.071 ).addScaledVector( normal, 103.8 );
		poster.position.z = - 66.812;
		poster.quaternion.setFromRotationMatrix( new THREE.Matrix4().makeBasis( right, up, normal ) );
		poster.userData = { sourceMesh: mghSource.name, purpose: 'Cover gold lettering below Red Sox display; original geometry untouched' };
		mghSource.add( poster );
	}
	// END MGH poster.

	// BEGIN Boston Sam Adams sign: only the panel left of COMMON BOOKS.
	const BOSTON_SAM_ADAMS_SIGN_ENABLED = true;
	const samAdamsSource = model.getObjectByName( 'Object649_Plastic_Soft_0' );
	if ( BOSTON_SAM_ADAMS_SIGN_ENABLED && samAdamsSource ) {
		const canvas = document.createElement( 'canvas' );
		canvas.width = 768; canvas.height = 512;
		const ctx = canvas.getContext( '2d' );
		ctx.fillStyle = '#102c49'; ctx.fillRect( 0, 0, 768, 512 );
		ctx.strokeStyle = '#eee2c5'; ctx.lineWidth = 5;
		ctx.strokeRect( 28, 28, 712, 456 );
		ctx.fillStyle = '#eee2c5'; ctx.textAlign = 'center';
		ctx.font = 'bold 112px Georgia, serif';
		ctx.fillText( 'SAM', 384, 171 );
		ctx.fillText( 'ADAMS', 384, 299 );
		ctx.fillStyle = '#9c303b'; ctx.fillRect( 52, 350, 664, 95 );
		ctx.fillStyle = '#eee2c5'; ctx.font = 'bold 44px Georgia, serif';
		ctx.fillText( 'BOSTON LAGER', 384, 413 );
		const texture = new THREE.CanvasTexture( canvas );
		texture.name = 'bostonSamAdamsTexture'; texture.colorSpace = THREE.SRGBColorSpace;
		const material = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } );
		material.name = 'bostonSamAdamsMaterial';
		// Copy the rounded planar face only; retain its beveled casing and backing.
		const faces = [ 16642, 16669, 16670, 16671, 16683, 16689, 16690, 16694, 16695, 16788 ];
		const sourcePosition = samAdamsSource.geometry.getAttribute( 'position' );
		const index = samAdamsSource.geometry.index;
		const positions = [], uvs = [];
		for ( const face of faces ) for ( let corner = 0; corner < 3; corner ++ ) {
			const id = index ? index.getX( face * 3 + corner ) : face * 3 + corner;
			const x = sourcePosition.getX( id ), y = sourcePosition.getY( id ), z = sourcePosition.getZ( id );
			positions.push( x, y - 0.12, z );
			uvs.push( ( x + 121.88323974609375 ) / 52.861114501953125, ( z + 104.43621063232422 ) / 34.75066375732422 );
		}
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
		geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
		geometry.computeVertexNormals();
		const overlay = new THREE.Mesh( geometry, material );
		overlay.name = 'bostonSamAdamsSign';
		overlay.userData = { sourceMesh: samAdamsSource.name, sourceTriangles: faces, offset: 0.12 };
		samAdamsSource.add( overlay );
	}
	// END Boston Sam Adams sign.


	// BEGIN Legal Sea Foods: both circular mountain-and-sun sign faces.
	const legalSource = model.getObjectByName( 'Object649_paintmat_0' );
	if ( legalSource ) {
		const group = new THREE.Group(); group.name = 'bostonLegalSeaFoodsSign'; legalSource.add( group );
		const canvas = document.createElement( 'canvas' ); canvas.width = canvas.height = 512;
		const ctx = canvas.getContext( '2d' ); ctx.fillStyle = '#ffffff'; ctx.fillRect( 0, 0, 512, 512 );
		const texture = new THREE.CanvasTexture( canvas ); texture.name = 'bostonLegalSeaFoodsTexture'; texture.colorSpace = THREE.SRGBColorSpace;
		const artwork = createArtwork();
		artwork.onload = () => {
			// Fit the entire supplied artwork inside the circular face without cropping.
			const fit = 452 / Math.hypot( artwork.naturalWidth, artwork.naturalHeight );
			const w = artwork.naturalWidth * fit, h = artwork.naturalHeight * fit;
			ctx.drawImage( artwork, ( 512 - w ) / 2, ( 512 - h ) / 2, w, h ); texture.needsUpdate = true;
		};
		artwork.src = assetURL( 'assets/mass-ai.png' );
		const material = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } ); material.name = 'bostonLegalSeaFoodsMaterial';
		const g = legalSource.geometry, p = g.attributes.position;
		for ( const [ label, direction, faces ] of [
			[ 'Front', - 1, [ 8805,8806,8807,8808,8809,8836,8840,8841,8842,8843,8844,8845,8849,8857,8858,8859,8860,9357 ] ],
			[ 'Back', 1, [ 8862,8863,8864,8865,8866,8893,8897,8898,8899,8900,8901,8902,8906,8914,8915,8916,8917,9356 ] ]
		] ) {
			const positions = [], uvs = [];
			for ( const face of faces ) for ( let k = 0; k < 3; k ++ ) {
				const i = g.index ? g.index.getX( face * 3 + k ) : face * 3 + k;
				const x = p.getX( i ), y = p.getY( i ), z = p.getZ( i );
				positions.push( x, y + direction * 0.12, z );
				const u = ( x + 179.47859 ) / 32.83244;
				uvs.push( direction < 0 ? u : 1 - u, ( z + 66.90596 ) / 32.83243 );
			}
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
			geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) ); geometry.computeVertexNormals();
			const overlay = new THREE.Mesh( geometry, material ); overlay.name = 'bostonLegalSeaFoods' + label; group.add( overlay );
		}
	}
	// END Legal Sea Foods.

	// BEGIN Boston Dunkin sign: reversible, face-only overlays.
	const BOSTON_DUNKIN_SIGN_ENABLED = true;
	const dunkinSource = model.getObjectByName( 'Object649_normal_0' );
	if ( BOSTON_DUNKIN_SIGN_ENABLED && dunkinSource ) {
		const group = new THREE.Group();
		group.name = 'bostonDunkinSign';
		dunkinSource.add( group );
		const canvas = document.createElement( 'canvas' );
		canvas.width = 512; canvas.height = 1024;
		const ctx = canvas.getContext( '2d' );
		ctx.fillStyle = '#fff8ee'; ctx.fillRect( 0, 0, 512, 1024 );
		ctx.fillStyle = '#f58220'; ctx.fillRect( 0, 50, 256, 16 );
		ctx.fillStyle = '#e91e83'; ctx.fillRect( 256, 50, 256, 16 );
		ctx.font = '900 142px "Arial Rounded MT Bold", Arial, sans-serif';
		ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
		for ( const [ i, letter ] of Array.from( 'DUNKIN' ).entries() ) {
			ctx.fillStyle = i < 4 ? '#f58220' : '#e91e83';
			ctx.fillText( letter, 256, 165 + i * 137 );
		}
		ctx.fillStyle = '#e91e83'; ctx.fillRect( 0, 958, 256, 16 );
		ctx.fillStyle = '#f58220'; ctx.fillRect( 256, 958, 256, 16 );
		const texture = new THREE.CanvasTexture( canvas );
		texture.name = 'bostonDunkinSignTexture';
		texture.colorSpace = THREE.SRGBColorSpace;
		const material = new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } );
		material.name = 'bostonDunkinSignMaterial';
		const position = dunkinSource.geometry.getAttribute( 'position' );
		const index = dunkinSource.geometry.index;
		for ( const [ side, first, direction ] of [ [ 'Front', 27209, - 1 ], [ 'Back', 27221, 1 ] ] ) {
			// Copy only the 12 planar artwork triangles per side, preserving their contour.
			const points = [], uvs = [];
			for ( let face = first; face < first + 12; face ++ ) {
				for ( let corner = 0; corner < 3; corner ++ ) {
					const id = index ? index.getX( face * 3 + corner ) : face * 3 + corner;
					const x = position.getX( id ), y = position.getY( id ), z = position.getZ( id );
					points.push( x, y + direction * 0.12, z );
					const u = ( x + 167.37094116210938 ) / 43.3948974609375;
					uvs.push( direction < 0 ? u : 1 - u, ( z + 31.559005737304688 ) / 88.43559265136719 );
				}
			}
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( points, 3 ) );
			geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
			geometry.computeVertexNormals();
			const overlay = new THREE.Mesh( geometry, material );
			overlay.name = 'bostonDunkinSign' + side;
			overlay.userData = { sourceMesh: dunkinSource.name, sourceTriangles: [ first, first + 11 ], offset: 0.12 };
			group.add( overlay );
		}
	}
	// END Boston Dunkin sign.

	// BEGIN Boston object landmarks: additive props, independently reversible.
	// Coordinates are Object649-local, with Z up. No original materials,
	// geometry, animation tracks, or earlier Boston groups are changed.
	const BOSTON_OBJECT_PHASES = { tower: true, dome: true, stop: true, lamps: true, mailbox: true };
	// Set false to restore only the previous, smaller Prudential implementation.
	const BOSTON_PRUDENTIAL_CAT_COVER_ENABLED = true;
	const landmarkRoot = model.getObjectByName( 'Object649' );
	if ( landmarkRoot ) {
		const props = new THREE.Group();
		props.name = 'bostonLandmarkProps';
		landmarkRoot.add( props );
		const iron = new THREE.MeshStandardMaterial( { color: 0x26312f, roughness: 0.8 } );
		iron.name = 'bostonPropIron';
		const add = ( parent, name, geometry, material, x, y, z ) => {
			const mesh = new THREE.Mesh( geometry, material );
			mesh.name = name; mesh.position.set( x, y, z ); parent.add( mesh ); return mesh;
		};
		const cylinder = ( parent, name, radius, height, material, x, y, z, segments = 8 ) => {
			const mesh = add( parent, name, new THREE.CylinderGeometry( radius, radius, height, segments ), material, x, y, z );
			mesh.rotation.x = Math.PI / 2; return mesh;
		};

		if ( BOSTON_OBJECT_PHASES.tower && ! BOSTON_PRUDENTIAL_CAT_COVER_ENABLED ) {
			// Object707 is a small animated prop; use the authorized box fallback.
			const canvas = document.createElement( 'canvas' ); canvas.width = 128; canvas.height = 1024;
			const ctx = canvas.getContext( '2d' );
			ctx.fillStyle = '#253b48'; ctx.fillRect( 0, 0, 128, 1024 );
			for ( let row = 3; row < 63; row ++ ) for ( let col = 0; col < 10; col ++ ) {
				ctx.fillStyle = ( row * 13 + col * 7 ) % 29 === 0 ? '#a59872' : '#526a78';
				ctx.fillRect( col * 13 + 2, row * 16, 8, 11 );
			}
			ctx.fillStyle = '#adb8b7'; ctx.fillRect( 0, 0, 128, 12 ); ctx.fillRect( 0, 38, 128, 5 );
			ctx.fillStyle = '#778b92'; ctx.fillRect( 0, 12, 128, 24 );
			const texture = new THREE.CanvasTexture( canvas ); texture.colorSpace = THREE.SRGBColorSpace;
			texture.name = 'bostonPrudentialWindows';
			const glass = new THREE.MeshStandardMaterial( { map: texture, roughness: 0.4, metalness: 0.25 } );
			glass.name = 'bostonPrudentialGlass';
			const crown = new THREE.MeshStandardMaterial( { color: 0xadb8b7, roughness: 0.6 } ); crown.name = 'bostonPrudentialCrown';
			const tower = add( props, 'bostonPrudentialTower', new THREE.BoxGeometry( 30, 112, 26 ), [ glass, glass, crown, crown, glass, glass ], - 82, - 65, 180 );
			tower.rotation.x = Math.PI / 2;
			// Broad observation crown and restrained antenna identify Prudential.
			add( props, 'bostonPrudentialCrownLower', new THREE.BoxGeometry( 34, 30, 1.5 ), crown, - 82, - 65, 237 );
			add( props, 'bostonPrudentialObservationDeck', new THREE.BoxGeometry( 31, 27, 7 ), glass, - 82, - 65, 241 );
			add( props, 'bostonPrudentialCrownUpper', new THREE.BoxGeometry( 34, 30, 1.5 ), crown, - 82, - 65, 245 );
			cylinder( props, 'bostonPrudentialAntenna', 0.35, 13, iron, - 82, - 65, 252, 5 );
		}

		// BEGIN Prudential cat-cover revision. Original cat meshes remain untouched.
		if ( BOSTON_OBJECT_PHASES.tower && BOSTON_PRUDENTIAL_CAT_COVER_ENABLED ) {
			const tower = new THREE.Group();
			tower.name = 'bostonPrudentialCatCover';
			tower.position.set( 132, - 152, 116 );
			// Z-up: retain approved half-height; widen the previous footprint by 10%.
			tower.scale.set( 0.847, 0.847, 0.5 );
			props.add( tower );
			// Scaled body bounds: X [79.486,184.514], Y [-195.197,-108.803], Z [116,226].
			// Reduced footprint no longer guarantees complete cat/paw enclosure.
			// The roof/poster, atlas and original animation are not edited or hidden.
			const canvas = document.createElement( 'canvas' );
			canvas.width = 512; canvas.height = 1024;
			const ctx = canvas.getContext( '2d' );
			ctx.fillStyle = '#354550'; ctx.fillRect( 0, 0, 512, 1024 );
			for ( let row = 0; row < 64; row ++ ) {
				for ( let col = 0; col < 32; col ++ ) {
					ctx.fillStyle = ( row * 19 + col * 7 ) % 101 === 0 ? '#7d8075' : ( col % 4 === 0 ? '#50616b' : '#465762' );
					ctx.fillRect( col * 16 + 3, row * 16 + 2, 10, 12 );
				}
			}
			const texture = new THREE.CanvasTexture( canvas );
			texture.name = 'bostonPrudentialCatCoverWindows';
			texture.colorSpace = THREE.SRGBColorSpace;
			const glass = new THREE.MeshStandardMaterial( { map: texture, roughness: 0.48, metalness: 0.22 } );
			glass.name = 'bostonPrudentialCatCoverGlass';
			const crown = new THREE.MeshStandardMaterial( { color: 0xd4d2d5, roughness: 0.65, metalness: 0.15 } );
			crown.name = 'bostonPrudentialCatCoverCrown';
			const deck = new THREE.MeshStandardMaterial( { color: 0x61727c, roughness: 0.42, metalness: 0.22 } );
			deck.name = 'bostonPrudentialCatCoverDeck';
			const body = add( tower, 'bostonPrudentialCatCoverBody', new THREE.BoxGeometry( 124, 220, 102 ), [ glass, glass, crown, crown, glass, glass ], 0, 0, 110 );
			body.rotation.x = Math.PI / 2;
			// Reference-inspired glazed observation room and two pale cantilever ledges.
			// All crown details remain below the approved antenna tip at local Z=266.
			const observationCanvas = document.createElement( 'canvas' );
			observationCanvas.width = 1024; observationCanvas.height = 128;
			const observationContext = observationCanvas.getContext( '2d' );
			observationContext.fillStyle = '#263c47';
			observationContext.fillRect( 0, 0, 1024, 128 );
			for ( let col = 0; col < 32; col ++ ) {
				observationContext.fillStyle = col > 23 || col % 11 === 0 ? '#b7b69c' : '#557c88';
				observationContext.fillRect( col * 32 + 4, 6, 25, 114 );
				observationContext.fillStyle = '#a8b3ae';
				observationContext.fillRect( col * 32, 0, 3, 128 );
			}
			observationContext.fillStyle = '#a8b3ae';
			observationContext.fillRect( 0, 103, 1024, 3 );
			observationContext.font = 'bold 48px Georgia, serif';
			observationContext.textAlign = 'center';
			observationContext.fillStyle = '#f3eee2';
			observationContext.shadowColor = '#172d39';
			observationContext.shadowBlur = 3;
			observationContext.fillText( 'P R U D E N T I A L', 512, 57 );
			const observationTexture = new THREE.CanvasTexture( observationCanvas );
			observationTexture.name = 'bostonPrudentialObservationWindows';
			observationTexture.colorSpace = THREE.SRGBColorSpace;
			const observationMaterial = new THREE.MeshStandardMaterial( { map: observationTexture, roughness: 0.45, metalness: 0.18 } );
			observationMaterial.name = 'bostonPrudentialObservationGlass';
			add( tower, 'bostonPrudentialCatCoverNeck', new THREE.BoxGeometry( 108, 88, 2 ), deck, 0, 0, 221 );
			add( tower, 'bostonPrudentialCatCoverLowerLedge', new THREE.BoxGeometry( 132, 110, 2 ), crown, 0, 0, 222 );
			const observationRoom = add( tower, 'bostonPrudentialCatCoverObservationDeck', new THREE.BoxGeometry( 124, 16, 102 ), [ observationMaterial, observationMaterial, deck, deck, observationMaterial, observationMaterial ], 0, 0, 231 );
			observationRoom.rotation.x = Math.PI / 2;
			add( tower, 'bostonPrudentialCatCoverUpperLedge', new THREE.BoxGeometry( 132, 110, 2 ), crown, 0, 0, 240 );
			add( tower, 'bostonPrudentialRoofEquipment', new THREE.BoxGeometry( 72, 58, 6 ), deck, 0, 0, 244 );
			const mastMaterial = new THREE.MeshStandardMaterial( { color: 0x87434a, roughness: 0.7 } );
			mastMaterial.name = 'bostonPrudentialMastRed';
			const mast = add( tower, 'bostonPrudentialCatCoverAntenna', new THREE.CylinderGeometry( 0.45, 1.8, 19, 6 ), mastMaterial, 0, 0, 256.5 );
			mast.rotation.x = Math.PI / 2;
		}
		// END Prudential cat-cover revision.

		if ( BOSTON_OBJECT_PHASES.dome ) {
			const dome = new THREE.Group(); dome.name = 'bostonStateHouseDome'; props.add( dome );
			const stone = new THREE.MeshStandardMaterial( { color: 0xb9af96, roughness: 0.9 } ); stone.name = 'bostonDomeStone';
			const gold = new THREE.MeshStandardMaterial( { color: 0xb59a4d, metalness: 0.65, roughness: 0.42 } ); gold.name = 'bostonDomeGold';
			add( dome, 'bostonDomeBase', new THREE.BoxGeometry( 20, 20, 4 ), stone, - 90, 48, 85 );
			cylinder( dome, 'bostonDomeDrum', 9, 5, stone, - 90, 48, 89.5, 12 );
			const cap = add( dome, 'bostonDomeCap', new THREE.SphereGeometry( 9, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2 ), gold, - 90, 48, 92 );
			cap.rotation.x = Math.PI / 2;
		}

		if ( BOSTON_OBJECT_PHASES.stop ) {
			const stop = new THREE.Group(); stop.name = 'bostonTrolleyStopMarker'; props.add( stop );
			cylinder( stop, 'bostonStopPole', 0.65, 29, iron, 130, 175, - 189.5 );
			const material = new THREE.MeshBasicMaterial( { map: createBostonRoundelTexture(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, toneMapped: false } );
			material.name = 'bostonStopRoundelMaterial';
			const sign = add( stop, 'bostonStopRoundel', new THREE.PlaneGeometry( 12, 12 ), material, 130, 175, - 172 );
			sign.rotation.set( Math.PI / 2, Math.PI, 0 );
		}

		if ( BOSTON_OBJECT_PHASES.lamps ) {
			const lamps = new THREE.Group(); lamps.name = 'bostonStreetLamps'; props.add( lamps );
			const panes = new THREE.MeshStandardMaterial( { color: 0xd9c9a1, emissive: 0x70532a, emissiveIntensity: 0.15, roughness: 0.6 } ); panes.name = 'bostonLampPanes';
			for ( const [ i, x, y ] of [ [ 1, 110, 175 ], [ 2, - 160, - 130 ] ] ) {
				cylinder( lamps, 'bostonLampBase' + i, 1.5, 5, iron, x, y, - 201.5 );
				cylinder( lamps, 'bostonLampPole' + i, 0.65, 31, iron, x, y, - 188.5 );
				add( lamps, 'bostonLampHead' + i, new THREE.BoxGeometry( 3.5, 3.5, 5 ), panes, x, y, - 170.5 );
				const roof = add( lamps, 'bostonLampCap' + i, new THREE.ConeGeometry( 3.4, 3, 4 ), iron, x, y, - 166.5 ); roof.rotation.x = Math.PI / 2;
			}
		}


		if ( BOSTON_OBJECT_PHASES.mailbox ) {
			const mailbox = new THREE.Group(); mailbox.name = 'bostonBlueMailbox'; props.add( mailbox );
			const blue = new THREE.MeshStandardMaterial( { color: 0x245b86, roughness: 0.65 } ); blue.name = 'bostonMailboxBlue';
			add( mailbox, 'bostonMailboxBody', new THREE.BoxGeometry( 7, 5, 9 ), blue, - 160, - 115, - 195.5 );
			add( mailbox, 'bostonMailboxBase', new THREE.BoxGeometry( 5, 3, 4 ), iron, - 160, - 115, - 202 );
		}
	}
	// END Boston object landmarks.

	// BEGIN Boston refinement: remove this block to undo this pass's treatments.
	const BOSTON_REFINEMENT_ENABLED = true;
	if ( BOSTON_REFINEMENT_ENABLED ) {
		const ranges = ( a, b ) => Array.from( { length: b - a + 1 }, ( _, i ) => a + i );
		const surfaceCopy = ( source, faces, name, material, offset = 0.09 ) => {
			const g = source.geometry, p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
			const positions = [], normals = [], uvs = [];
			for ( const f of faces ) for ( let k = 0; k < 3; k ++ ) {
				const i = g.index ? g.index.getX( f * 3 + k ) : f * 3 + k;
				positions.push( p.getX( i ) + n.getX( i ) * offset, p.getY( i ) + n.getY( i ) * offset, p.getZ( i ) + n.getZ( i ) * offset );
				normals.push( n.getX( i ), n.getY( i ), n.getZ( i ) );
				uvs.push( uv.getX( i ), uv.getY( i ) );
			}
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
			geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
			geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );
			const overlay = new THREE.Mesh( geometry, material ); overlay.name = name;
			overlay.userData = { bostonPhase: 'refinement', sourceTriangles: faces };
			source.add( overlay ); return overlay;
		};
		const findUVFaces = ( source, rect, predicate = () => true ) => {
			const g = source.geometry, uv = g.attributes.uv, selected = [];
			for ( let f = 0; f < ( g.index ? g.index.count : g.attributes.position.count ) / 3; f ++ ) {
				const ids = [ 0, 1, 2 ].map( k => g.index ? g.index.getX( f * 3 + k ) : f * 3 + k );
				if ( ids.every( i => uv.getX( i ) >= rect[ 0 ] && uv.getX( i ) <= rect[ 2 ] && uv.getY( i ) >= rect[ 1 ] && uv.getY( i ) <= rect[ 3 ] && predicate( i, g ) ) ) selected.push( f );
			}
			return selected;
		};
		// Neutralize paint only: retain cat silhouette, supporting roof and outlines.
		const stoneCat = new THREE.MeshStandardMaterial( { color: 0x887b67, roughness: 0.94 } ); stoneCat.name = 'bostonNeutralRooftopStone';
		for ( const [ name, faces ] of [ [ 'Object649_Plastic_Soft_0', [ ...ranges( 15998, 16594 ), 16789 ] ], [ 'Object649_paintmat_0', [ ...ranges( 8256, 8314 ), 9365 ] ] ] ) {
			const source = model.getObjectByName( name );
			if ( source?.isMesh ) surfaceCopy( source, faces, 'bostonNeutralCat_' + name, stoneCat );
		}
		const metalSurface = model.getObjectByName( 'Object649_metalmat_0' );
		if ( metalSurface?.isMesh ) {
			const faces = findUVFaces( metalSurface, [ 0.22, 0.142, 0.282, 0.216 ], ( i, g ) => g.attributes.position.getY( i ) < - 100 && g.attributes.position.getZ( i ) > 120 );
			surfaceCopy( metalSurface, faces, 'bostonNeutralCatMedallion', stoneCat );
		}

		// UV-bounded surface copies retain baked detail while shifting only roof
		// tiles and large masonry islands toward slate-brown and warm brownstone.
		const treatments = [
			{ name: 'RoofRidges', rects: [ [ 0.770, 0.058, 0.784, 0.123 ] ], tint: [ 0.16, 0.18, 0.19 ], predicate: ( i, g ) => g.attributes.position.getZ( i ) > 45 && g.attributes.position.getX( i ) > 50 && g.attributes.position.getY( i ) < -130 },
			{ name: 'Roof', rects: [ [ 0.260, 0.308, 0.406, 0.373 ], [ 0.382, 0.659, 0.495, 0.734 ], [ 0.442, 0.571, 0.525, 0.631 ], [ 0.884, 0.707, 0.981, 0.726 ] ], tint: [ 0.16, 0.18, 0.19 ] },
			{ name: 'BrickFacade', rects: [ [ 0.475, 0.742, 0.646, 0.896 ] ], tint: [ 0.36, 0.18, 0.12 ] },
			{ name: 'CreamFacade', rects: [ [ 0.649, 0.735, 0.769, 0.899 ] ], tint: [ 0.52, 0.46, 0.35 ] },
			{ name: 'Masonry', rects: [ [ 0.768, 0.737, 0.885, 0.897 ], [ 0.126, 0.838, 0.251, 0.948 ] ], tint: [ 0.47, 0.285, 0.18 ] }
		];
		for ( const name of [ 'Object649_normal_0', 'Object649_paintmat_0', 'Object649_Plastic_Soft_0' ] ) {
			const source = model.getObjectByName( name ); if ( ! source?.isMesh ) continue;
			for ( const treatment of treatments ) {
				const faces = [ ...new Set( treatment.rects.flatMap( rect => findUVFaces( source, rect, treatment.predicate ) ) ) ];
				if ( ! faces.length ) continue;
				const material = source.material.clone(); material.name = 'boston' + treatment.name + '_' + name;
				material.onBeforeCompile = shader => {
					shader.fragmentShader = shader.fragmentShader.replace( '#include <map_fragment>', '#include <map_fragment>\nfloat bostonLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));\ndiffuseColor.rgb = vec3(' + treatment.tint.join( ',' ) + ') * (0.5 + bostonLuma);' );
				};
				material.customProgramCacheKey = () => 'bostonRefinement' + treatment.name;
				surfaceCopy( source, faces, material.name + 'Overlay', material, 0.045 );
			}
		}

		// Confirmed reverse/alley sign faces: the earlier main-facing signs remain.
		const extraSigns = [
			{ name: 'bostonBackBayReverse', faces: [ 18198, 18199 ], label: 'BACK BAY' },
			{ name: 'bostonNewburyReverse', faces: [ 23685, 23686 ], label: 'NEWBURY ST' },
			{ name: 'bostonAlleyMarketFront', faces: [ 23836, 23837 ], label: 'MARKET' },
			{ name: 'bostonAlleyMarketBack', faces: [ 23846, 29134 ], label: 'MARKET' }
		];
		const signSource = model.getObjectByName( 'Object649_normal_0' );
		if ( signSource?.isMesh ) for ( const sign of extraSigns ) {
			const g = signSource.geometry;
			const points = sign.faces.flatMap( f => [ 0, 1, 2 ].map( k => new THREE.Vector3().fromBufferAttribute( g.attributes.position, g.index.getX( f * 3 + k ) ) ) );
			const normal = new THREE.Vector3().crossVectors( points[ 1 ].clone().sub( points[ 0 ] ), points[ 2 ].clone().sub( points[ 0 ] ) ).normalize();
			const right = new THREE.Vector3().crossVectors( new THREE.Vector3( 0, 0, 1 ), normal );
			const xx = points.map( p => p.dot( right ) ), zz = points.map( p => p.z );
			const lo = Math.min( ...xx ), bottom = Math.min( ...zz ), width = Math.max( ...xx ) - lo, height = Math.max( ...zz ) - bottom;
			const texture = createBostonCanvasTexture( 768, Math.round( 768 * height / width ), ( ctx, w, h ) => {
				ctx.fillStyle = '#203f39'; ctx.fillRect( 0, 0, w, h ); ctx.strokeStyle = '#bfa77a'; ctx.lineWidth = 5; ctx.strokeRect( 8, 8, w - 16, h - 16 );
				ctx.fillStyle = '#efe6d1'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
				if ( h > w * 2 ) {
					const letters = sign.label.split( '' ), spacing = h * 0.84 / letters.length;
					ctx.font = '600 ' + Math.min( w * 0.6, spacing * 0.8 ) + 'px Arial';
					letters.forEach( ( letter, i ) => ctx.fillText( letter, w / 2, h * 0.08 + spacing * ( i + 0.5 ) ) );
				} else {
					ctx.font = '600 ' + h * 0.48 + 'px Arial'; ctx.fillText( sign.label, w / 2, h / 2, w * 0.87 );
				}
			}, sign.name + 'Texture' );
			const overlay = surfaceCopy( signSource, sign.faces, sign.name, new THREE.MeshBasicMaterial( { map: texture, toneMapped: false } ) );
			overlay.geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( points.flatMap( ( p, i ) => [ ( xx[ i ] - lo ) / width, ( zz[ i ] - bottom ) / height ] ), 2 ) );
		}
	}
	// END Boston refinement.

	// BEGIN Boston 1776 sign: disable and reload to restore this assembly.
	const BOSTON_1776_SIGN_ENABLED = true;
	if ( BOSTON_1776_SIGN_ENABLED ) {
		const root = model.getObjectByName( 'Object649' );
		if ( root ) {
			const group = new THREE.Group(); group.name = 'boston1776SignGroup'; root.add( group );
			const badgeTexture = createBostonCanvasTexture( 512, 512, ( ctx, w, h ) => {
				ctx.clearRect( 0, 0, w, h );
				ctx.save(); ctx.beginPath(); ctx.arc( 256, 256, 245, 0, Math.PI * 2 ); ctx.clip();
				ctx.fillStyle = '#f1e8d5'; ctx.fillRect( 0, 0, w, h );
				for ( let row = 0; row < 13; row += 2 ) { ctx.fillStyle = '#ab293d'; ctx.fillRect( 0, row * h / 13, w, h / 13 ); }
				ctx.fillStyle = '#20344e'; ctx.fillRect( 0, 0, 260, h * 7 / 13 );
				ctx.fillStyle = '#f1e8d5';
				for ( let row = 0; row < 9; row ++ ) for ( let col = 0; col < ( row % 2 ? 5 : 6 ); col ++ ) {
					const x = 20 + col * 42 + ( row % 2 ? 21 : 0 ), y = 17 + row * 29;
					ctx.beginPath();
					for ( let k = 0; k < 10; k ++ ) { const angle = k * Math.PI / 5 - Math.PI / 2, r = k % 2 ? 3.2 : 8; ctx.lineTo( x + Math.cos( angle ) * r, y + Math.sin( angle ) * r ); }
					ctx.closePath(); ctx.fill();
				}
				ctx.restore(); ctx.beginPath(); ctx.arc( 256, 256, 245, 0, Math.PI * 2 ); ctx.strokeStyle = '#c1a66b'; ctx.lineWidth = 12; ctx.stroke();
			}, 'boston1776FlagTexture' );
			const panel = ( name, width, height, position, texture, angle = Math.PI / 2 ) => {
				const material = new THREE.MeshBasicMaterial( { map: texture, transparent: true, alphaTest: 0.1, toneMapped: false } ); material.name = name + 'Material';
				const mesh = new THREE.Mesh( new THREE.PlaneGeometry( width, height ), material ); mesh.name = name; mesh.position.set( ...position ); mesh.rotation.x = angle; group.add( mesh );
			};
			const labelTexture = ( label, width, height ) => createBostonCanvasTexture( width, height, ( ctx, w, h ) => {
				ctx.fillStyle = '#20344e'; ctx.fillRect( 0, 0, w, h ); ctx.strokeStyle = '#c1a66b'; ctx.lineWidth = 5; ctx.strokeRect( 4, 4, w - 8, h - 8 );
				ctx.fillStyle = '#f1e8d5'; ctx.font = 'bold ' + h * 0.73 + 'px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText( label, w / 2, h * 0.53, w * 0.86 );
			}, 'boston1776_' + label );
			// Front normal -Y. Badge clears the foremost coin rim and square hole.
			panel( 'boston1776FlagMedallion', 44, 44, [ - 61.22, - 191.65, 63.9 ], badgeTexture );
			panel( 'boston1776LeftDigits', 25, 17, [ - 92.2, - 189.25, 49.25 ], labelTexture( '17', 384, 256 ) );
			panel( 'boston1776RightDigits', 25, 17, [ - 29.4, - 189.25, 49.25 ], labelTexture( '76', 384, 256 ) );
			// Small plaque: normal mesh triangles 24368,29125.
			panel( 'boston1776BostonPlaque', 43.84, 10.35, [ - 65.7523, - 188.98, 32.1227 ], labelTexture( 'BOSTON', 768, 180 ) );
			// Hanging white face: paintmat triangles 5640–5641; retain its slope.
			const signatureCanvas = document.createElement( 'canvas' ); signatureCanvas.width = 768; signatureCanvas.height = 320;
			const signatureContext = signatureCanvas.getContext( '2d' );
			signatureContext.fillStyle = '#ffffff'; signatureContext.fillRect( 0, 0, 768, 320 );
			const signatureTexture = new THREE.CanvasTexture( signatureCanvas ); signatureTexture.colorSpace = THREE.SRGBColorSpace;
			signatureTexture.name = 'bostonJohnHancockSignature';
			const signatureArtwork = createArtwork();
			signatureArtwork.onload = () => {
				// Crop only the supplied image's white top/bottom margins, not the signature.
				const sx = 0, sy = 85, sw = signatureArtwork.naturalWidth, sh = 245;
				const fit = Math.min( 746 / sw, 300 / sh );
				const width = sw * fit, height = sh * fit;
				signatureContext.drawImage( signatureArtwork, sx, sy, sw, sh, ( 768 - width ) / 2, ( 320 - height ) / 2, width, height );
				signatureTexture.needsUpdate = true;
			};
			signatureArtwork.src = assetURL( 'assets/john-hancock-signature.png' );
			panel( 'bostonJohnHancockPlaque', 53.43, 22.28, [ - 39.8147, - 169.777, 20.374 ], signatureTexture, 2.0952 );
		}
	}
	// END Boston 1776 sign.

	// Apply after all sign face copies so original triangle numbering stays stable.
	addBostonStreetLamp( model );
	const lobsterTarget = addHiddenLobster( model );
	const updateHarborWheel = addHarborAlley( model );
	addBostonIronRailing( model );
	addNeighborhoodSignage( model, createArtwork(), assetURL( 'assets/boston-cream.png' ) );
	addUSMailboxes( model );

	mixer = new THREE.AnimationMixer( model );
	mixer.clipAction( gltf.animations[ 0 ] ).play();

	
await Promise.all( assetTasks );
if ( disposed ) throw new Error( 'Initialization cancelled' );
// Exchange artwork only; retain both approved sign footprints and transforms.
const lowerSign = model.getObjectByName( 'bostonWhoopSign' );
const upperSign = model.getObjectByName( 'bostonPatriotsPoster' );
if ( lowerSign && upperSign ) {
  const lowerMap = lowerSign.material.map, upperMap = upperSign.material.map;
  const fittedMap = ( image, aspect, background, name ) => {
    const canvas = document.createElement( 'canvas' ); canvas.width = 1024; canvas.height = Math.round( 1024 / aspect );
    const ctx = canvas.getContext( '2d' ); ctx.fillStyle = background; ctx.fillRect( 0, 0, canvas.width, canvas.height );
    const fit = Math.min( canvas.width / image.width, canvas.height / image.height );
    ctx.drawImage( image, ( canvas.width - image.width * fit ) / 2, ( canvas.height - image.height * fit ) / 2, image.width * fit, image.height * fit );
    const texture = new THREE.CanvasTexture( canvas ); texture.colorSpace = THREE.SRGBColorSpace; texture.name = name; return texture;
  };
  lowerSign.material.map = fittedMap( upperMap.image, 738 / 218, '#081a30', 'bostonPatriotsLowerTexture' );
  upperSign.material.map = fittedMap( lowerMap.image, 68 / 27, '#000000', 'bostonWhoopUpperTexture' );
  lowerSign.name = 'bostonPatriotsLowerSign'; upperSign.name = 'bostonWhoopUpperSign';
  upperSign.scale.set( 1.3, 1.3, 1 );
  // Small normal clearance hides the old raised-outline shell on white artwork.
  lowerSign.position.y += 0.5;
  lowerMap.dispose(); upperMap.dispose();
}
const updatePrudential = enhancePrudential( model );
const resize = () => {
  const width = Math.max( container.clientWidth, 1 ), height = Math.max( container.clientHeight, 1 );
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio( Math.min( window.devicePixelRatio || 1, 2 ) );
  renderer.setSize( width, height );
};
resizeObserver = new ResizeObserver( resize );
resizeObserver.observe( container );
resize();
renderer.domElement.addEventListener( 'webglcontextlost', contextLost );
if ( lobsterTarget ) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const lobsterBounds = new THREE.Box3();
  const projectedCorner = new THREE.Vector3();
  const lobsterCenter = new THREE.Vector3();
  let press, found = false;
  const visibleLobsterOnRay = () => {
    for ( const hit of raycaster.intersectObjects( scene.children, true ) ) {
      let visible = true;
      for ( let object = hit.object; object; object = object.parent ) if ( ! object.visible ) visible = false;
      if ( ! visible ) continue;
      return hit.object.parent === lobsterTarget;
    }
    return false;
  };
  const hitLobster = event => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set( ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1, - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1 );
    raycaster.setFromCamera( pointer, camera );
    const targetHit = raycaster.intersectObject( lobsterTarget, true )[ 0 ];
    if ( targetHit && visibleLobsterOnRay() ) return true;
    // Forgiving screen-space neighborhood, measured in CSS pixels on all DPRs.
    // Only pointer events do this work; the animation/render loop is unchanged.
    lobsterBounds.setFromObject( lobsterTarget );
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for ( let corner = 0; corner < 8; corner ++ ) {
      projectedCorner.set(
        corner & 1 ? lobsterBounds.max.x : lobsterBounds.min.x,
        corner & 2 ? lobsterBounds.max.y : lobsterBounds.min.y,
        corner & 4 ? lobsterBounds.max.z : lobsterBounds.min.z
      ).project( camera );
      if ( projectedCorner.z < -1 || projectedCorner.z > 1 ) return false;
      const x = rect.left + ( projectedCorner.x + 1 ) * rect.width / 2;
      const y = rect.top + ( 1 - projectedCorner.y ) * rect.height / 2;
      left = Math.min( left, x ); right = Math.max( right, x );
      top = Math.min( top, y ); bottom = Math.max( bottom, y );
    }
    const padding = event.pointerType === 'touch' ? 36 : 24;
    const dx = Math.max( left - event.clientX, 0, event.clientX - right );
    const dy = Math.max( top - event.clientY, 0, event.clientY - bottom );
    if ( dx * dx + dy * dy > padding * padding ) return false;
    // Nearby pavement counts, but not when the lobster is hidden by a building.
    lobsterCenter.set( 0, 0, 2 ); lobsterTarget.localToWorld( lobsterCenter ); lobsterCenter.project( camera );
    if ( Math.abs( lobsterCenter.x ) > 1 || Math.abs( lobsterCenter.y ) > 1 ) return false;
    pointer.set( lobsterCenter.x, lobsterCenter.y ); raycaster.setFromCamera( pointer, camera );
    return visibleLobsterOnRay();
  };
  const pointerDown = event => {
    if ( ! event.isPrimary ) { press = undefined; return; }
    if ( event.button === 0 && ! found ) press = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, target: hitLobster( event ) };
  };
  const pointerMove = event => {
    if ( press && press.id === event.pointerId ) {
      const dx = event.clientX - press.x, dy = event.clientY - press.y;
      if ( dx * dx + dy * dy > 49 ) press.moved = true;
    }
    if ( event.pointerType === 'mouse' && ! found && event.buttons === 0 ) renderer.domElement.style.cursor = hitLobster( event ) ? 'pointer' : '';
  };
  const pointerUp = event => {
    if ( ! press || press.id !== event.pointerId || found ) return;
    const dx = event.clientX - press.x, dy = event.clientY - press.y;
    const eligible = press.target && ! press.moved;
    press = undefined;
    if ( ! eligible || dx * dx + dy * dy > 49 || ! hitLobster( event ) ) return;
    found = true;
    renderer.domElement.style.cursor = '';
    onLobsterFound();
  };
  const pointerCancel = () => { press = undefined; };
  renderer.domElement.addEventListener( 'pointerdown', pointerDown );
  renderer.domElement.addEventListener( 'pointermove', pointerMove );
  renderer.domElement.addEventListener( 'pointerup', pointerUp );
  renderer.domElement.addEventListener( 'pointercancel', pointerCancel );
  removeLobsterInteraction = () => {
    renderer.domElement.style.cursor = '';
    renderer.domElement.removeEventListener( 'pointerdown', pointerDown );
    renderer.domElement.removeEventListener( 'pointermove', pointerMove );
    renderer.domElement.removeEventListener( 'pointerup', pointerUp );
    renderer.domElement.removeEventListener( 'pointercancel', pointerCancel );
  };
}
function animate() {
  if ( disposed ) return;
  try {
    timer.update();
    const delta = timer.getDelta();
    mixer.update( delta );
    updateHarborWheel( delta );
    updatePrudential( delta );
    controls.update();
    renderer.render( scene, camera );
  } catch ( error ) { dispose(); onFailure( error ); }
}
// Upload every ready texture and draw before revealing the canvas.
renderer.render( scene, camera );
await new Promise( resolve => requestAnimationFrame( () => requestAnimationFrame( resolve ) ) );
if ( disposed ) throw new Error( 'Initialization cancelled' );
visibilityChanged = () => {
  if ( ! disposed ) renderer.setAnimationLoop( document.hidden ? null : animate );
};
document.addEventListener( 'visibilitychange', visibilityChanged );
visibilityChanged();
return { dispose };

  } catch ( error ) { dispose(); throw error; }
}
