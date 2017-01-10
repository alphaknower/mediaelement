describe('MediaElement Player - Test Results', function () {

	var
		videoTag = $('#player1'),
		container = videoTag.closest('.mejs__container'),
		id = container.attr('id'),
		player = mejs.players[id],
		setMedia = function(src) {
			var error = videoTag.closest('.players').find('.error');

			player.setSrc(src.replace('&amp;', '&'));
			player.load();

			setTimeout(function () {
				player.play();

				player.media.addEventListener('play', function () {
					expect(container.find('.mejs__playpause-button').hasClass('mejs__pause')).to.equal(true);
				}, false);

				player.media.addEventListener('timeupdate', function () {
					if (player.media.currentTime >= 2) {
						player.pause();

						player.media.addEventListener('paused', function () {
							expect(container.find('.mejs__playpause-button').hasClass('mejs__play')).to.equal(true);
							expect(container.find('.mejs__currenttime').text()).to.equal('00:02');
							expect(error.html()).to.equal('');
						}, false);
					}
				}, false);
			}, 3000);
		}
	;

	it('Preserve `video` tag once player is created', function () {
		expect(videoTag).to.not.equal(null);
		expect(videoTag.get(0).originalNode.tagName.toLowerCase()).to.equal('video');
	});

	it('Create a `fake` node that mimics all media events/properties/methods', function () {
		expect(videoTag.get(0).tagName.toLowerCase()).to.equal('mediaelementwrapper');
		expect(videoTag.paused).to.not.equal(null);
	});

	it('Can manipulate different media types properly (i.e., HLS, M(PEG)-DASH and YouTube)', function () {

		var
			selector = videoTag.closest('.players').find('select[name=sources]'),
			hls = selector.find('option:eq(3)').attr('value'),
			dash = selector.find('option:eq(4)').attr('value'),
			youtube = selector.find('option:eq(7)').attr('value')
		;

		setMedia(hls);
		setTimeout(function(){}, 1000);
		setMedia(dash);
		setTimeout(function(){}, 1000);
		setMedia(youtube);

		// Test RTMP in non-iOS enviroments
		if (window.navigator.userAgent.toLowerCase().match(/ip(ad|od|hone)/gi) === null ) {
			setTimeout(function(){}, 1000);
			setMedia(selector.find('option:eq(2)').attr('value'));
		}
	});
});