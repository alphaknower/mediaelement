describe('MediaElement Player - Test Results', function() {

	var videoTag = document.getElementById('player1');

	it('Preserve `video` tag once player is created', function() {
		expect(videoTag).to.not.equal(null);
		expect(videoTag.originalNode.tagName.toLowerCase()).to.equal('video');
	});

	it('Create a `fake` node that mimics all media events/properties/methods', function() {
		expect(videoTag.tagName.toLowerCase()).to.equal('mediaelementwrapper');
		expect(videoTag.paused).to.not.equal(null);
	});
});