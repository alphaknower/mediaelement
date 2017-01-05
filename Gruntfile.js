module.exports = function(grunt) {

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-postcss');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-shell');
	grunt.loadNpmTasks('grunt-text-replace');
	grunt.loadNpmTasks("grunt-remove-logging");
	grunt.loadNpmTasks('grunt-browserify');

	var featureSources;

	// if commandline list of features, (e.g. --features=playpause,stop,...) build only these included
	var featureList = grunt.option('features');
	if (featureList) {
		featureList = featureList.split(',');
		featureSources = [];
		featureList.forEach(function(feature) {
			var path = 'src/js/features/' + feature + '.js';
			if (grunt.file.isFile(path)) {
				featureSources.push(path);
			}
		});
	}
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			files: {
				src: [
					'Gruntfile.js',
					'src/js/core/*.js',
					'src/js/utils/*.js',
					'src/js/languages/*.js',
					'src/js/renderers/*.js',
					'src/js/features/*.js',
					'src/js/library.js',
					'src/js/player.js',
					'src/js/simple.js',
					'test/core/*.js'

				]
			}
		},
		browserify: {
			dist: {
				options: {
					transform: [

						["babelify", {
							presets: 'es2015',
							sourceMapsAbsolute: true
						}]
					]
				},
				files: {
					// core element
					'tmp/mediaelement.js': [
						'src/js/utils/legacy.js',
						'src/js/core/mediaelement.js',
						'src/js/renderers/html5.js',
						'src/js/renderers/hls.js',
						'src/js/renderers/mdash.js',
						'src/js/renderers/flv.js',
						'src/js/renderers/youtube.js',
						'src/js/renderers/vimeo.js',
						'src/js/renderers/dailymotion.js',
						'src/js/renderers/facebook.js',
						'src/js/renderers/soundcloud.js',
						'src/js/renderers/flash.js',
						'src/js/core/i18n.js',
						'src/js/languages/en.js'
					],
					// just player
					'tmp/mediaelementplayer.js': [
						'src/js/library.js',
						'src/js/player.js'
					].concat(featureSources || [
						'src/js/features/playpause.js',
						'src/js/features/stop.js',
						'src/js/features/progress.js',
						'src/js/features/time.js',
						'src/js/features/volume.js',
						'src/js/features/fullscreen.js',
						'src/js/features/speed.js',
						'src/js/features/tracks.js',
						'src/js/features/sourcechooser.js',
						'src/js/features/contextmenu.js',
						'src/js/features/skipback.js',
						'src/js/features/jumpforward.js',
						'src/js/features/postroll.js',
						'src/js/features/markers.js'
					]),
					// all bundle
					'tmp/mediaelement-and-player.js': [
						'src/js/utils/legacy.js',
						'src/js/core/mediaelement.js',
						'src/js/renderers/html5.js',
						'src/js/renderers/hls.js',
						'src/js/renderers/mdash.js',
						'src/js/renderers/flv.js',
						'src/js/renderers/youtube.js',
						'src/js/renderers/vimeo.js',
						'src/js/renderers/dailymotion.js',
						'src/js/renderers/facebook.js',
						'src/js/renderers/soundcloud.js',
						'src/js/renderers/flash.js',
						'src/js/core/i18n.js',
						'src/js/languages/en.js',
						'src/js/library.js',
						'src/js/player.js'
					].concat(featureSources || [
						'src/js/features/playpause.js',
						'src/js/features/stop.js',
						'src/js/features/progress.js',
						'src/js/features/time.js',
						'src/js/features/volume.js',
						'src/js/features/fullscreen.js',
						'src/js/features/speed.js',
						'src/js/features/tracks.js',
						'src/js/features/sourcechooser.js',
						'src/js/features/contextmenu.js',
						'src/js/features/skipback.js',
						'src/js/features/jumpforward.js',
						'src/js/features/postroll.js',
						'src/js/features/markers.js'
					]),

					//languages
					'tmp/ca.js': ['src/js/languages/ca.js'],
					'tmp/cs.js': ['src/js/languages/cs.js'],
					'tmp/de.js': ['src/js/languages/de.js'],
					'tmp/es.js': ['src/js/languages/es.js'],
					'tmp/fr.js': ['src/js/languages/fr.js'],
					'tmp/hu.js': ['src/js/languages/hu.js'],
					'tmp/it.js': ['src/js/languages/it.js'],
					'tmp/ja.js': ['src/js/languages/ja.js'],
					'tmp/ko.js': ['src/js/languages/ko.js'],
					'tmp/nl.js': ['src/js/languages/nl.js'],
					'tmp/pl.js': ['src/js/languages/pl.js'],
					'tmp/pt.js': ['src/js/languages/pt.js'],
					'tmp/pt-br.js': ['src/js/languages/pt-br.js'],
					'tmp/ro.js': ['src/js/languages/ro.js'],
					'tmp/ru.js': ['src/js/languages/ru.js'],
					'tmp/sk.js': ['src/js/languages/sk.js'],
					'tmp/zh.js': ['src/js/languages/zh.js'],
					'tmp/zh-cn.js': ['src/js/languages/zh-cn.js'],
				}
			}
		},
		concat: {
			me: {
				src: [
					'src/js/header.js',
					'tmp/mediaelement.js'
				],
				dest: 'tmp/mediaelement.js'
			},
			mep: {
				src: [
					'src/js/header.js',
					'tmp/mediaelementplayer.js'
				],
				dest: 'tmp/mediaelementplayer.js'
			},
			bundle: {
				src: [
					'src/js/header.js',
					'tmp/mediaelement-and-player.js'
				],
				dest: 'tmp/mediaelement-and-player.js'
			}
		},
		removelogging: {
			dist: {
				src: [
					'tmp/mediaelement.js',
					'tmp/mediaelementplayer.js',
					'tmp/mediaelement-and-player.js'
				]
			},
			options: {
				// Keep `warn` and other methods from the console API
				methods: ['log']
			}
		},
		uglify: {
			me: {
				src	   : ['tmp/mediaelement.js'],
				dest   : 'build/mediaelement.min.js',
				banner : 'src/js/header.js'
			},
			mep: {
				src	   : ['tmp/mediaelementplayer.js'],
				dest   : 'build/mediaelementplayer.min.js',
				banner : 'src/js/header.js'
			},
			bundle: {
				src	 : ['tmp/mediaelement-and-player.js'],
				dest : 'build/mediaelement-and-player.min.js',
				banner : 'src/js/header.js'
			},
			options: {
				// Preserve comments that start with a bang (like the file header)
				preserveComments: "some"
			}
		},
		postcss: {
			options: {
				processors: [
					// Add vendor prefixes.
					require('autoprefixer')({browsers: 'last 2 versions, ie > 8'}),
					 // Minify the result.
					require('cssnano')()
				]
			},
			main: {
				src: 'src/css/mediaelementplayer.css',
				dest: 'build/mediaelementplayer.min.css'
			},
			legacy: {
				src: 'src/css/mediaelementplayer-legacy.css',
				dest: 'build/mediaelementplayer-legacy.min.css'
			}
		},
		copy: {
			build: {
				expand  : true,
				cwd     : 'src/css/',
				src     : ['*.png', '*.svg', '*.gif', '*.css', '!*-simple*'],
				dest    : 'build/',
				flatten : true,
				filter  : 'isFile'
			},
			translation: {
				expand  : true,
				cwd     : 'tmp/languages/',
				src     : ['*.js'],
				dest    : 'build/lang/',
				flatten : true,
				filter  : 'isFile'
			}
		},
		clean: {
			build: ['build'],
			temp:  ['tmp']
		},

		// Task that compiles all SWF files using the free Flex SDK on Linux/Mac.
		// There are a few prerequisite steps involved in running this task.
		//
		// 1) Install the Flex SDK version 4.6 (only needs to be done once)
		//	 Download the free flex sdk from http://sourceforge.net/adobe/flexsdk/wiki/Download%20Flex%204.6/
		//	 Unzip it to a directory on your local machine (eg: /usr/local/flex_sdk_4.6)
		//	 Create a symlink from the install location to this directory
		//	 (eg: ln -s /usr/local/flex_sdk_4.6 mediaelement/src/flash)
		//
		// 2) Update the `flexPath` variable below to reflect the name of the symlink you created
		//
		// 3) Run this task from the command line: `grunt shell:buildFlash`
		//
		flexPath: './src/flash/flex_sdk_4.6',
		flexVersion: '10.1',
		buildFlashCommand: [
			'<%= flexPath %>/bin/mxmlc -strict=false -compiler.debug -warnings=true',
			'<%= sourceFile %> -o <%= flashOut %>',
			'-library-path+="<%= flexPath %>/lib"',
			'-use-network=true -target-player <%= flexVersion %> -source-path <%= sourcePath %>',
			'-headless-server -static-link-runtime-shared-libraries',
			'<%= externalLibraries %>'
		].join(" "),

		shell: {
			buildFlashVideo: {
				command: function() {
					grunt.config.set("sourceFile", 'src/flash/flash-video/VideoMediaElement.as');
					grunt.config.set("sourcePath", 'src/flash/flash-video');
					grunt.config.set("flashOut", 'build/mediaelement-flash-video.swf');
					grunt.config.set("externalLibraries", '');
					return grunt.config.get("buildFlashCommand");
				}
			},
			buildFlashVideoHls: {
				command: function() {
					grunt.config.set("sourceFile", 'src/flash/flash-video-hls/HlsMediaElement.as');
					grunt.config.set("sourcePath", 'src/flash/flash-video-hls');
					grunt.config.set("flashOut", 'build/mediaelement-flash-video-hls.swf');
					grunt.config.set("externalLibraries", '-include-libraries+=src/flash/flash-video-hls/flashls.swc');
					return grunt.config.get("buildFlashCommand");
				}
			},
			buildFlashVideoMDash: {
				command: function() {
					grunt.config.set("sourceFile", 'src/flash/flash-video-dash/DashMediaElement.as');
					grunt.config.set("sourcePath", 'src/flash/flash-video-dash');
					grunt.config.set("flashOut", 'build/mediaelement-flash-video-mdash.swf');
					grunt.config.set("externalLibraries", '-include-libraries+=src/flash/flash-video-dash/OSMF.swc');
					return grunt.config.get("buildFlashCommand");
				}
			},
			buildFlashAudio: {
				command: function() {
					grunt.config.set("sourceFile", 'src/flash/flash-audio/AudioMediaElement.as');
					grunt.config.set("sourcePath", 'src/flash/flash-audio');
					grunt.config.set("flashOut", 'build/mediaelement-flash-audio.swf');
					grunt.config.set("externalLibraries", '');
					return grunt.config.get("buildFlashCommand");
				}
			},
			buildFlashAudioOgg: {
				command: function() {
					grunt.config.set("sourceFile", 'src/flash/flash-audio-ogg/OggMediaElement.as');
					grunt.config.set("sourcePath", 'src/flash/flash-audio-ogg');
					grunt.config.set("flashOut", 'build/mediaelement-flash-audio-ogg.swf');
					grunt.config.set("externalLibraries", '-include-libraries+=src/flash/flash-audio-ogg/oggvorbis.swc');
					return grunt.config.get("buildFlashCommand");
				}
			}
		}
	});

	grunt.registerTask('default', ['jshint', 'browserify', 'concat', 'removelogging', 'uglify', 'postcss', 'shell', 'copy', 'clean:temp']);
	grunt.registerTask('html5only', ['jshint', 'browserify', 'concat', 'removelogging', 'uglify', 'postcss', 'copy', 'clean:temp']);
	grunt.registerTask('html5debug', ['jshint', 'browserify', 'concat', 'uglify', 'postcss', 'copy', 'clean:temp']);
	grunt.registerTask('develop', ['jshint', 'browserify', 'concat']);
};
