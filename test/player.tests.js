describe('MediaElement Player - Test Results', function() {

	var
		videoTag = $('#player1'),
		container = videoTag.closest('.mejs__container'),
		id = container.attr('id'),
		player = mejs.players[id]
	;

	it('Preserve `video` tag once player is created', function() {
		expect(videoTag).to.not.equal(null);
		expect(videoTag.get(0).originalNode.tagName.toLowerCase()).to.equal('video');
	});

	it('Create a `fake` node that mimics all media events/properties/methods', function() {
		expect(videoTag.get(0).tagName.toLowerCase()).to.equal('mediaelementwrapper');
		expect(videoTag.paused).to.not.equal(null);
	});

	it('Can play/pause media properly', function() {

		player.play();

		setTimeout(function() {
			expect(container.find('.mejs__playpause-button').hasClass('mejs__pause')).equal(true);
			setTimeout(function() {
				player.pause();
				setTimeout(function() {
					expect(container.find('.mejs__playpause-button').hasClass('mejs__play')).equal(true);
				}, 300);
			}, 250);
		}, 150);

	});

	it('Can set different media types properly', function() {

		var
			selector = videoTag.closest('.players').find('select'),
			error = videoTag.closest('.players').find('.error'),
			hls = selector.find('option:eq(3)').attr('value'),
			dash = selector.find('option:eq(4)').attr('value'),
			youtube = selector.find('option:eq(7)').attr('value')
		;

		player.setSrc(hls.replace('&amp;', '&'));
		player.load();
		expect(error.html()).to.equal('');

		player.setSrc(dash.replace('&amp;', '&'));
		player.load();
		expect(error.html()).to.equal('');

		player.setSrc(youtube.replace('&amp;', '&'));
		player.load();

		setTimeout(function() {
			expect(error.html()).to.equal('');
			expect(container.find('iframe').length).to.equal(1);
		}, 500);

	});
});