'use strict';

import window from 'global/window';
import document from 'global/document';
import mejs from './mejs';
import {addProperty} from '../utils/general';
import {getTypeFromFile, formatType, absolutizeUrl} from '../utils/media';
import {renderer} from './renderer';

/**
 * Media Core
 *
 * This class is the foundation to create/render different media formats.
 * @class MediaElement
 */
class MediaElement {

	constructor (idOrNode, options) {
		
		let t = this;
		
		t.defaults = {
			/**
			 * List of the renderers to use
			 * @type {String[]}
			 */
			renderers: [],
			/**
			 * Name of MediaElement container
			 * @type {String}
			 */
			fakeNodeName: 'mediaelementwrapper',
			/**
			 * The path where shims are located
			 * @type {String}
			 */
			pluginPath: 'build/'
		};

		options = Object.assign(t.defaults, options);

		// create our node (note: older versions of iOS don't support Object.defineProperty on DOM nodes)
		t.mediaElement = document.createElement(options.fakeNodeName);
		t.mediaElement.options = options;

		let id = idOrNode;

		if (typeof idOrNode === 'string') {
			t.mediaElement.originalNode = document.getElementById(idOrNode);
		} else {
			t.mediaElement.originalNode = idOrNode;
			id = idOrNode.id;
		}

		id = id || `mejs_${(Math.random().toString().slice(2))}`;

		if (t.mediaElement.originalNode !== undefined && t.mediaElement.originalNode !== null &&
			t.mediaElement.appendChild) {
			// change id
			t.mediaElement.originalNode.setAttribute('id', `${id}_from_mejs`);

			// add next to this one
			t.mediaElement.originalNode.parentNode.insertBefore(t.mediaElement, t.mediaElement.originalNode);

			// insert this one inside
			t.mediaElement.appendChild(t.mediaElement.originalNode);
		} else {
			// TODO: where to put the node?
		}

		t.mediaElement.id = id;
		t.mediaElement.renderers = {};
		t.mediaElement.renderer = null;
		t.mediaElement.rendererName = null;
		/**
		 * Determine whether the renderer was found or not
		 *
		 * @public
		 * @param {String} rendererName
		 * @param {Object[]} mediaFiles
		 * @return {Boolean}
		 */
		t.mediaElement.changeRenderer = (rendererName, mediaFiles) => {

			let t = this;

			// check for a match on the current renderer
			if (t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null &&
				t.mediaElement.renderer.name === rendererName) {
				t.mediaElement.renderer.pause();
				if (t.mediaElement.renderer.stop) {
					t.mediaElement.renderer.stop();
				}
				t.mediaElement.renderer.show();
				t.mediaElement.renderer.setSrc(mediaFiles[0].src);
				return true;
			}

			// if existing renderer is not the right one, then hide it
			if (t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null) {
				t.mediaElement.renderer.pause();
				if (t.mediaElement.renderer.stop) {
					t.mediaElement.renderer.stop();
				}
				t.mediaElement.renderer.hide();
			}

			// see if we have the renderer already created
			let newRenderer = t.mediaElement.renderers[rendererName],
				newRendererType = null;

			if (newRenderer !== undefined && newRenderer !== null) {
				newRenderer.show();
				newRenderer.setSrc(mediaFiles[0].src);
				t.mediaElement.renderer = newRenderer;
				t.mediaElement.rendererName = rendererName;
				return true;
			}

			let rendererArray = t.mediaElement.options.renderers.length ? t.mediaElement.options.renderers :
				renderer.order;

			// find the desired renderer in the array of possible ones
			for (let index of rendererArray) {

				if (index === rendererName) {

					// create the renderer
					const rendererList = renderer.renderers;
					newRendererType = rendererList[index];

					let renderOptions = Object.assign(newRendererType.options, t.mediaElement.options);
					newRenderer = newRendererType.create(t.mediaElement, renderOptions, mediaFiles);
					newRenderer.name = rendererName;

					// store for later
					t.mediaElement.renderers[newRendererType.name] = newRenderer;
					t.mediaElement.renderer = newRenderer;
					t.mediaElement.rendererName = rendererName;

					newRenderer.show();

					return true;
				}
			}

			return false;
		};

		/**
		 * Set the element dimensions based on selected renderer's setSize method
		 *
		 * @public
		 * @param {number} width
		 * @param {number} height
		 */
		t.mediaElement.setSize = (width, height) => {
			if (t.mediaElement.renderer !== undefined && t.mediaElement.renderer !== null) {
				t.mediaElement.renderer.setSize(width, height);
			}
		};

		const
			props = mejs.html5media.properties,
			methods = mejs.html5media.methods,
			assignGettersSetters = (propName) => {
				if (propName !== 'src') {

					const
						capName = `${propName.substring(0, 1).toUpperCase()}${propName.substring(1)}`,
						getFn = () => t.mediaElement.renderer[`get${capName}`](),
						setFn = (value) => {
							t.mediaElement.renderer[`set${capName}`](value);
						};

					addProperty(t.mediaElement, propName, getFn, setFn);
					t.mediaElement[`get${capName}`] = getFn;
					t.mediaElement[`set${capName}`] = setFn;
				}
			},
			// `src` is a property separated from the others since it carries the logic to set the proper renderer
			// based on the media files detected
			getSrc = () => t.mediaElement.renderer.getSrc(),
			setSrc = (value) => {

				let mediaFiles = [];

				// clean up URLs
				if (typeof value === 'string') {
					mediaFiles.push({
						src: value,
						type: value ? getTypeFromFile(value) : ''
					});
				} else {
					for (let val of value) {

						let
							src = absolutizeUrl(val.src),
							type = val.type
						;

						mediaFiles.push({
							src: src,
							type: (type === '' || type === null || type === undefined) && src ?
								getTypeFromFile(src) : type
						});

					}
				}

				// find a renderer and URL match
				let
					renderInfo = renderer.select(mediaFiles,
						(t.mediaElement.options.renderers.length ? t.mediaElement.options.renderers : [])),
					event
				;

				// Ensure that the original gets the first source found
				t.mediaElement.originalNode.setAttribute('src', (mediaFiles[0].src || ''));

				// did we find a renderer?
				if (renderInfo === null) {
					event = document.createEvent('HTMLEvents');
					event.initEvent('error', false, false);
					event.message = 'No renderer found';
					t.mediaElement.dispatchEvent(event);
					return;
				}

				// turn on the renderer (this checks for the existing renderer already)
				t.mediaElement.changeRenderer(renderInfo.rendererName, mediaFiles);

				if (t.mediaElement.renderer === undefined || t.mediaElement.renderer === null) {
					event = document.createEvent('HTMLEvents');
					event.initEvent('error', false, false);
					event.message = 'Error creating renderer';
					t.mediaElement.dispatchEvent(event);
				}
			},
			assignMethods = (methodName) => {
				// run the method on the current renderer
				t.mediaElement[methodName] = (...args) => {
					return (typeof t.mediaElement.renderer[methodName] === 'function') ?
						t.mediaElement.renderer[methodName](args) : null;
				};

			};

		// Assign all methods/properties/events to fake node if renderer was found
		addProperty(t.mediaElement, 'src', getSrc, setSrc);
		t.mediaElement.getSrc = getSrc;
		t.mediaElement.setSrc = setSrc;

		for (let property of props) {
			assignGettersSetters(property);
		}

		for (let method of methods) {
			assignMethods(method);
		}

		// IE && iOS
		if (!t.mediaElement.addEventListener) {

			t.mediaElement.events = {};

			// start: fake events
			t.mediaElement.addEventListener = (eventName, callback) => {
				// create or find the array of callbacks for this eventName
				t.mediaElement.events[eventName] = t.mediaElement.events[eventName] || [];

				// push the callback into the stack
				t.mediaElement.events[eventName].push(callback);
			};
			t.mediaElement.removeEventListener = (eventName, callback) => {
				// no eventName means remove all listeners
				if (!eventName) {
					t.mediaElement.events = {};
					return true;
				}

				// see if we have any callbacks for this eventName
				let callbacks = t.mediaElement.events[eventName];

				if (!callbacks) {
					return true;
				}

				// check for a specific callback
				if (!callback) {
					t.mediaElement.events[eventName] = [];
					return true;
				}

				// remove the specific callback
				for (let i = 0, il = callbacks.length; i < il; i++) {
					if (callbacks[i] === callback) {
						t.mediaElement.events[eventName].splice(i, 1);
						return true;
					}
				}
				return false;
			};

			/**
			 *
			 * @param {Event} event
			 */
			t.mediaElement.dispatchEvent = (event) => {

				let callbacks = t.mediaElement.events[event.type];

				if (callbacks) {
					for (let callback of callbacks) {
						callback.apply(null, [event]);
					}
				}
			};
		}

		if (t.mediaElement.originalNode !== null) {
			let mediaFiles = [];

			switch (t.mediaElement.originalNode.nodeName.toLowerCase()) {

				case 'iframe':
					mediaFiles.push({
						type: '',
						src: t.mediaElement.originalNode.getAttribute('src')
					});

					break;

				case 'audio':
				case 'video':
					let
						n,
						src,
						type,
						sources = t.mediaElement.originalNode.childNodes.length,
						nodeSource = t.mediaElement.originalNode.getAttribute('src')
						;

					// Consider if node contains the `src` and `type` attributes
					if (nodeSource) {
						let node = t.mediaElement.originalNode;
						mediaFiles.push({
							type: formatType(nodeSource, node.getAttribute('type')),
							src: nodeSource
						});
					}

					// test <source> types to see if they are usable
					for (let i = 0; i < sources; i++) {
						n = t.mediaElement.originalNode.childNodes[i];
						if (n.nodeType === Node.ELEMENT_NODE && n.tagName.toLowerCase() === 'source') {
							src = n.getAttribute('src');
							type = formatType(src, n.getAttribute('type'));
							mediaFiles.push({type: type, src: src});
						}
					}
					break;
			}

			if (mediaFiles.length > 0) {
				t.mediaElement.src = mediaFiles;
			}
		}

		if (t.mediaElement.options.success) {
			t.mediaElement.options.success(t.mediaElement, t.mediaElement.originalNode);
		}

		// @todo: Verify if this is needed
		// if (t.mediaElement.options.error) {
		// 	t.mediaElement.options.error(this.mediaElement, this.mediaElement.originalNode);
		// }

		return t.mediaElement;
	}
}

window.MediaElement = MediaElement;

export default MediaElement;