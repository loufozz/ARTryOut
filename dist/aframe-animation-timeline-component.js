/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

	document.registerElement('a-timeline');
	document.registerElement('a-timeline-group');
	document.registerElement('a-timeline-animation');

	AFRAME.registerComponent('animation-timeline', {
	  schema: {
	    direction: {type: 'string', default: 'normal'},
	    loop: {
	      default: 0,
	      parse: function (value) {
	        // Boolean or integer.
	        if (value === 'true') { return true; }
	        if (value === 'false') { return false; }
	        return parseInt(value, 10);
	      }
	    },
	    pauseEvents: {type: 'array'},
	    startEvents: {type: 'array'},
	    timeline: {type: 'string'},
			resumeEvents:{type:'array'}
	  },

	  multiple: true,

	  init: function () {
	    var data = this.data;
	    var i;

	    this.animationIsPlaying = false;
	    this.beginAnimation = this.beginAnimation.bind(this);
			this.pauseAnimation = this.pauseAnimation.bind(this);
			this.resumeAnimation = this.resumeAnimation.bind(this);
	    this.eventDetail = {name: this.id}
	    this.time = 0;
	    this.timeline = null;

	    // Wait for start events.
	    for (i = 0; i < data.startEvents.length; i++) {
			//	console.log(data.startEvents[i]);
			//	console.log(this);
	      this.el.addEventListener(data.startEvents[i], this.beginAnimation);
	    }

	    for (i = 0; i < data.pauseEvents.length; i++) {
				console.log(data.pauseEvents[i]);
				//console.log("hee");
			//	console.log(this);

	      this.el.addEventListener(data.pauseEvents[i], this.pauseAnimation);
	    }

			for (i = 0; i < data.resumeEvents.length; i++) {
			 console.log(data.resumeEvents[i]);
			 //console.log("hee");
		  // console.log(this);

			 this.el.addEventListener(data.resumeEvents[i], this.resumeAnimation);
		 }
	  },

	  play: function () {
	    if (this.data.startEvents.length) { return; }
	    // Autoplay if startEvents not set.
	    this.beginAnimation();
	  },

	  tick: function (t, dt) {
	    if (!this.animationIsPlaying || !this.timeline) { return; }
	    this.time += dt;
	    this.timeline.tick(this.time);
	  },

	  /**
	   * Build the anime.js timeline.
	   * Begin the animation.
	   */
	  beginAnimation: function () {
	    var additionalOffset;
	    var i;
	    var j;
	    var duration;
	    var longestDuration;
	    var offset;
	    var timelineEl;
	    var timelineGroupEl;
	    var self = this;

	    timelineEl = document.querySelector(this.data.timeline);
	    if (timelineEl.tagName !== 'A-TIMELINE') {
	      throw new Error('[animation-timeline] timeline must be a selector to <a-timeline> ' +
	                      'element.');
	    }

	    this.animationIsPlaying = true;
	    this.time = 0;
	    this.timeline = (AFRAME.anime || AFRAME.ANIME).timeline({
	      autoplay: false,
	      complete: function () {
	        self.animationIsPlaying = false;
	        self.el.emit('animationtimelinecomplete', self.eventDetail);
	      },
	      direction: this.data.direction,
	      loop: this.data.loop
	    });

	    offset = 0;  // Absolute time offset.
	    for (i = 0; i < timelineEl.children.length; i++) {
	      // Add group.
	      if (timelineEl.children[i].tagName === 'A-TIMELINE-GROUP') {
	        timelineGroupEl = timelineEl.children[i];
	        longestDuration = 0;
	        for (j = 0; j < timelineGroupEl.children.length; j++) {
	          duration = this.addAnimationToTimeline(timelineGroupEl.children[j], offset);
	          // A timeline group is finished once the longest running animation finishes.
	          if (duration > longestDuration) { longestDuration = duration; }
	        }
	        offset += longestDuration;
	        continue;
	      }

	      // Add single animation.
	      if (timelineEl.children[i].tagName === 'A-TIMELINE-ANIMATION') {
	        offset += this.addAnimationToTimeline(timelineEl.children[i], offset);
	      }
	    }
	  },

	  /**
	   * Add single animation to timeline.
	   *
	   * @param {number} offset - Absolute time offset for animation to start.
	   * @returns {number} Duration.
	   */
	  addAnimationToTimeline: function (animationEl, offset) {
	    var additionalOffset;
	    var animationName;
	    var component;
	    var config;
	    var els;
	    var i;
	    var select;

	    animationName = 'animation__' + animationEl.getAttribute('name');
	    select = animationEl.getAttribute('select');
	    els = this.el.sceneEl.querySelectorAll(select);

	    if (!els.length) {
	      console.warn('[animation-timeline] No entities found for select="' +
	                    select + '"');
	      return 0;
	    }

	    additionalOffset = parseFloat(animationEl.getAttribute('offset') || 0, 10)

	    for (i = 0; i < els.length; i++) {
	      component = els[i].components[animationName];
	      if (!component) {
	        throw new Error('Could not find animation `' + animationName + '` for `' +
	                        animationEl.getAttribute('select') + '`.');
	      }
	      component.updateConfig();
	      component.stopRelatedAnimations();
	      config = cloneConfig(component.config);
	      config.target = config.targets;
	      this.timeline.add(config, offset + additionalOffset);
	    }

	    return (config.duration || 0) + (config.delay || 0) + additionalOffset;
	  },

	  pauseAnimation: function () {
			console.log("pause here");
			console.log(this);
	    this.animationIsPlaying = false;
	  },

		resumeAnimation: function () {
			console.log("running here");
			console.log(this);
	    this.animationIsPlaying = true;
	  }
	});

	/**
	 * Clone config. Deep clone objects and arrays. Copy over functions.
	 */
	function cloneConfig (config) {
	  var key;
	  var newConfig = {};
	  for (key in config) {
	    if (typeof config[key] === 'function') {
	      newConfig[key] = config[key];
	    } else if (typeof config[key] === 'object') {
	      newConfig[key] = AFRAME.utils.clone(config[key]);
	    } else {
	      newConfig[key] = config[key];
	    }
	  }
	  return newConfig;
	}


/***/ })
/******/ ]);
