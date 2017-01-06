'use strict';

import window from 'global/window';
import document from 'global/document';
import mejs from '../core/mejs';
import {renderer} from '../core/renderer';
import {createEvent} from '../utils/dom';
import {typeChecks} from '../utils/media';
import {HAS_MSE} from '../utils/constants';

/**
 * Native M-Dash renderer
 *
 * Uses dash.js, a reference client implementation for the playback of MPEG DASH via Javascript and compliant browsers.
 * It relies on HTML5 video and MediaSource Extensions for playback.
 * This renderer integrates new events associated with mpd files.
 * @see https://github.com/Dash-Industry-Forum/dash.js
 *
 */
const NativeDash = {
	/**
	 * @type {Boolean}
	 */
	isMediaLoaded: false,
	/**
	 * @type {Array}
	 */
	creationQueue: [],

	/**
	 * Create a queue to prepare the loading of an HLS source
	 *
	 * @param {Object} settings - an object with settings needed to load an HLS player instance
	 */
	prepareSettings: (settings) => {
		if (NativeDash.isLoaded) {
			NativeDash.createInstance(settings);
		} else {
			NativeDash.loadScript(settings);
			NativeDash.creationQueue.push(settings);
		}
	},

	/**
	 * Load dash.mediaplayer.js script on the header of the document
	 *
	 * @param {Object} settings - an object with settings needed to load an HLS player instance
	 */
	loadScript: (settings) => {
		if (!NativeDash.isScriptLoaded) {

			settings.options.path = settings.options.path !== undefined || settings.options.path !== null ?
				settings.options.path : '//cdn.dashjs.org/latest/dash.mediaplayer.min.js';

			if (typeof dashjs !== 'undefined') {
				NativeDash.createInstance(settings);
			} else {
				let
					script = document.createElement('script'),
					firstScriptTag = document.getElementsByTagName('script')[0],
					done = false;

				script.src = settings.options.path;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = () => {
					if (!done && (!NativeDash.readyState || NativeDash.readyState === undefined ||
						NativeDash.readyState === 'loaded' || NativeDash.readyState === 'complete')) {
						done = true;
						NativeDash.mediaReady();
						script.onload = script.onreadystatechange = null;
					}
				};

				firstScriptTag.parentNode.insertBefore(script, firstScriptTag);
			}
			NativeDash.isScriptLoaded = true;
		}
	},

	/**
	 * Process queue of Dash player creation
	 *
	 */
	mediaReady: () => {

		NativeDash.isLoaded = true;
		NativeDash.isScriptLoaded = true;

		while (NativeDash.creationQueue.length > 0) {
			let settings = NativeDash.creationQueue.pop();
			NativeDash.createInstance(settings);
		}
	},

	/**
	 * Create a new instance of Dash player and trigger a custom event to initialize it
	 *
	 * @param {Object} settings - an object with settings needed to instantiate HLS object
	 */
	createInstance: (settings) => {

		let player = dashjs.MediaPlayer().create();
		window['__ready__' + settings.id](player);
	}
};

let DashNativeRenderer = {
	name: 'native_mdash',

	options: {
		prefix: 'native_mdash',
		dash: {
			// Special config: used to set the local path/URL of dash.js mediaplayer library
			path: '//cdn.dashjs.org/latest/dash.mediaplayer.min.js',
			debug: false
		}
	},
	/**
	 * Determine if a specific element type can be played with this render
	 *
	 * @param {String} type
	 * @return {Boolean}
	 */
	canPlayType: (type) => HAS_MSE && ['application/dash+xml'].includes(type),

	/**
	 * Create the player instance and add all native events/methods/properties as possible
	 *
	 * @param {MediaElement} mediaElement Instance of mejs.MediaElement already created
	 * @param {Object} options All the player configuration options passed through constructor
	 * @param {Object[]} mediaFiles List of sources with format: {src: url, type: x/y-z}
	 * @return {Object}
	 */
	create: (mediaElement, options, mediaFiles) => {

		let
			node = null,
			originalNode = mediaElement.originalNode,
			id = mediaElement.id + '_' + options.prefix,
			dashPlayer,
			stack = {}
		;

		node = originalNode.cloneNode(true);
		options = Object.assign(options, mediaElement.options);

		// WRAPPERS for PROPs
		let
			props = mejs.html5media.properties,
			assignGettersSetters = (propName) => {
				const capName = `${propName.substring(0, 1).toUpperCase()}${propName.substring(1)}`;

				node[`get${capName}`] = () => (dashPlayer !== null) ? node[propName] : null;

				node[`set${capName}`] = (value) => {
					if (dashPlayer !== null) {
						if (propName === 'src') {

							dashPlayer.attachSource(value);

							if (node.getAttribute('autoplay')) {
								node.play();
							}
						}

						node[propName] = value;
					} else {
						// store for after "READY" event fires
						stack.push({type: 'set', propName: propName, value: value});
					}
				};

			}
		;

		for (let property of props) {
			assignGettersSetters(property);
		}

		// Initial method to register all M-Dash events
		window['__ready__' + id] = (_dashPlayer) => {

			mediaElement.dashPlayer = dashPlayer = _dashPlayer;

			// By default, console log is off
			dashPlayer.getDebug().setLogToBrowserConsole(options.dash.debug);

			// do call stack
			if (stack.length) {
				for (let stackItem of stack) {
					if (stackItem.type === 'set') {
						let propName = stackItem.propName,
							capName = `${propName.substring(0, 1).toUpperCase()}${propName.substring(1)}`;

						node[`set${capName}`](stackItem.value);
					} else if (stackItem.type === 'call') {
						node[stackItem.methodName]();
					}
				}
			}

			// BUBBLE EVENTS
			let
				events = mejs.html5media.events, dashEvents = dashjs.MediaPlayer.events,
				assignEvents = (eventName) => {

					if (eventName === 'loadedmetadata') {
						dashPlayer.initialize(node, node.src, false);
					}

					node.addEventListener(eventName, (e) => {
						let event = document.createEvent('HTMLEvents');
						event.initEvent(e.type, e.bubbles, e.cancelable);
						// @todo Check this
						// event.srcElement = e.srcElement;
						// event.target = e.srcElement;

						mediaElement.dispatchEvent(event);
					});

				}
			;

			events = events.concat(['click', 'mouseover', 'mouseout']);

			for (let event of events) {
				assignEvents(event);
			}

			/**
			 * Custom M(PEG)-DASH events
			 *
			 * These events can be attached to the original node using addEventListener and the name of the event,
			 * not using dashjs.MediaPlayer.events object
			 * @see http://cdn.dashjs.org/latest/jsdoc/MediaPlayerEvents.html
			 */
			let assignMdashEvents = (e, data) => {
				let event = createEvent(e.type, node);
				mediaElement.dispatchEvent(event);

				if (e === 'error') {
					console.error(e, data);
				}
			};

			for (let eventType in dashEvents) {
				if (dashEvents.hasOwnProperty(eventType)) {
 					dashPlayer.on(dashEvents[eventType], assignMdashEvents);
				}
			}
		};

		let filteredAttributes = ['id', 'src', 'style'];
		for (let attribute of originalNode.attributes) {
			if (attribute.specified && !filteredAttributes.includes(attribute.name)) {
				node.setAttribute(attribute.name, attribute.value);
			}
		}

		node.setAttribute('id', id);

		if (mediaFiles && mediaFiles.length > 0) {
			for (let file of mediaFiles) {
				if (renderer.renderers[options.prefix].canPlayType(file.type)) {
					node.src = file.src;
					break;
				}
			}
		}

		node.className = '';

		originalNode.parentNode.insertBefore(node, originalNode);
		originalNode.removeAttribute('autoplay');
		originalNode.style.display = 'none';

		NativeDash.prepareSettings({
			options: options.dash,
			id: id
		});

		// HELPER METHODS
		node.setSize = (width, height) => {
			node.style.width = width + 'px';
			node.style.height = height + 'px';

			return node;
		};

		node.hide = () => {
			node.pause();
			node.style.display = 'none';
			return node;
		};

		node.show = () => {
			node.style.display = '';
			return node;
		};

		let event = createEvent('rendererready', node);
		mediaElement.dispatchEvent(event);

		return node;
	}
};

/**
 * Register Native M(PEG)-Dash type based on URL structure
 *
 */
typeChecks.push((url) => {
	url = url.toLowerCase();
	return url.includes('.mpd') ? 'application/dash+xml' : null;
});

renderer.add(DashNativeRenderer);