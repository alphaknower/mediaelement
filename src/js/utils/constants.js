import window from 'global/window';
import document from 'global/document';

export const NAV = window.navigator;
export const UA = NAV.userAgent.toLowerCase();

export const IS_IPAD = (UA.match(/ipad/i) !== null);
export const IS_IPHONE = (UA.match(/iphone/i) !== null);
export const IS_IOS = IS_IPHONE || IS_IPAD;
export const IS_ANDROID = (UA.match(/android/i) !== null);
export const IS_IE = (NAV.appName.toLowerCase().includes('microsoft') || NAV.appName.toLowerCase().match(/trident/gi) !== null);
export const IS_CHROME = (UA.match(/chrome/gi) !== null);
export const IS_FIREFOX = (UA.match(/firefox/gi) !== null);
export const IS_SAFARI = (UA.match(/safari/gi) !== null) && !IS_CHROME;
export const IS_STOCK_ANDROID = (UA.match(/^mozilla\/\d+\.\d+\s\(linux;\su;/gi) !== null);

export const HAS_TOUCH = !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch);
export const HAS_MSE = ('MediaSource' in window);
export const SUPPORT_POINTER_EVENTS = (() => {
	let
		element = document.createElement('x'),
		documentElement = document.documentElement,
		getComputedStyle = window.getComputedStyle,
		supports
	;

	if (!('pointerEvents' in element.style)) {
		return false;
	}

	element.style.pointerEvents = 'auto';
	element.style.pointerEvents = 'x';
	documentElement.appendChild(element);
	supports = getComputedStyle && getComputedStyle(element, '').pointerEvents === 'auto';
	documentElement.removeChild(element);
	return !!supports;
})();

// for IE
let html5Elements = ['source', 'track', 'audio', 'video'], video;

for (let element of html5Elements) {
	video = document.createElement(element);
}

// Test if Media Source Extensions are supported by browser
export const SUPPORTS_MEDIA_TAG = (video.canPlayType !== undefined || HAS_MSE);

// Test if browsers support HLS natively (right now Safari, Android's Chrome and Stock browsers, and MS Edge)
export const SUPPORTS_NATIVE_HLS = (IS_SAFARI || (IS_ANDROID && (IS_CHROME || IS_STOCK_ANDROID)) || (IS_IE && UA.match(/edge/gi) !== null));

// Detect native JavaScript fullscreen (Safari/Firefox only, Chrome still fails)

// iOS
let hasiOSFullScreen = (video.webkitEnterFullscreen !== undefined);

// W3C
let hasNativeFullscreen = (video.requestFullscreen !== undefined);

// OS X 10.5 can't do this even if it says it can :(
if (hasiOSFullScreen && UA.match(/mac os x 10_5/i)) {
	hasNativeFullscreen = false;
	hasiOSFullScreen = false;
}

// webkit/firefox/IE11+
let hasWebkitNativeFullScreen = (video.webkitRequestFullScreen !== undefined);
let hasMozNativeFullScreen = (video.mozRequestFullScreen !== undefined);
let hasMsNativeFullScreen = (video.msRequestFullscreen !== undefined);

let hasTrueNativeFullScreen = (hasWebkitNativeFullScreen || hasMozNativeFullScreen || hasMsNativeFullScreen);
let nativeFullScreenEnabled = hasTrueNativeFullScreen;

let fullScreenEventName = '';
let isFullScreen, requestFullScreen, cancelFullScreen;

// Enabled?
if (hasMozNativeFullScreen) {
	nativeFullScreenEnabled = document.mozFullScreenEnabled;
} else if (hasMsNativeFullScreen) {
	nativeFullScreenEnabled = document.msFullscreenEnabled;
}

if (IS_CHROME) {
	hasiOSFullScreen = false;
}

if (hasTrueNativeFullScreen) {

	if (hasWebkitNativeFullScreen) {
		fullScreenEventName = 'webkitfullscreenchange';
	} else if (hasMozNativeFullScreen) {
		fullScreenEventName = 'mozfullscreenchange';
	} else if (hasMsNativeFullScreen) {
		fullScreenEventName = 'MSFullscreenChange';
	}

	isFullScreen = () =>  {
		if (hasMozNativeFullScreen) {
			return document.mozFullScreen;

		} else if (hasWebkitNativeFullScreen) {
			return document.webkitIsFullScreen;

		} else if (hasMsNativeFullScreen) {
			return document.msFullscreenElement !== null;
		}
	};

	requestFullScreen = (el) => {

		if (hasWebkitNativeFullScreen) {
			el.webkitRequestFullScreen();
		} else if (hasMozNativeFullScreen) {
			el.mozRequestFullScreen();
		} else if (hasMsNativeFullScreen) {
			el.msRequestFullscreen();
		}
	};

	cancelFullScreen = () => {
		if (hasWebkitNativeFullScreen) {
			document.webkitCancelFullScreen();

		} else if (hasMozNativeFullScreen) {
			document.mozCancelFullScreen();

		} else if (hasMsNativeFullScreen) {
			document.msExitFullscreen();

		}
	};
}

export const HAS_WEBKIT_NATIVE_FULLSCREEN = hasWebkitNativeFullScreen;
export const HAS_MOZ_NATIVE_FULLSCREEN = hasMozNativeFullScreen;
export const HAS_MS_NATIVE_FULLSCREEN = hasMsNativeFullScreen;
export const HAS_IOS_FULLSCREEN = hasiOSFullScreen;
export const HAS_TRUE_NATIVE_FULLSCREEN = hasTrueNativeFullScreen;
export const NATIVE_FULLSCREEN_ENABLED = nativeFullScreenEnabled;
export const FULLSCREEN_EVENT_NAME = fullScreenEventName;

export {isFullScreen, requestFullScreen, cancelFullScreen};