/**
 * TODO:  When clicking around
 * 1) know what letters you're in between
 * 2) cursor set at that position with correct height
 * 3) Break the previous and next into textnodes and insert characters in between
 * 4) Update text range after each keystroke
 * 4) Rejoin text nodes in possible/necessary
 *
 */

var CE = (function(){
	rangy.init();

	var

	$doc = $(document),
	$txa = $('<textarea/>').addClass('-ce-ta').appendTo(document.body),

	generateId = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0,
				v = c === 'x' ? r : r & 3 | 8;
			return v.toString(16);
		}).toUpperCase();
	},

	ContentEditable = {
		init: function(param) {
			var self = this, range;

			this.el = $(param.el).addClass('-ce');
			this.blinker = $('<div/>').addClass('-ce-blinker').appendTo(this.el);

			this.el.bind('mousedown.'+this.id, function(e) { self.mousedown(e); });
			$doc.bind('mousemove.'+this.id, function(e) { self.mousemove(e); });
			$doc.bind('mouseup.'+this.id, function(e) { self.mouseup(e); });
		
			this.id = generateId();
			this.isEditable = false;
			this.isMousedown = false;

			range = rangy.createRange();
			range.selectNodeContents(this.el[0]);
			range.collapse();
			this.wzRange = WizzyRange();
			this.wzRange.setRange(range);

			this.enable();
			return this;
		},

		splitTextnodes: function() {
				
		},

		insertText: function(str){
			var r = this.wzRange.r,
				txt = document.createTextNode(str)

			r.collapse();
			if(this.isDesc(r.startContainer)) {
				r.insertNode(txt);
				r.selectNode(txt);	
			} else {
				console.log("Can't insert text, invalid range", r.startContainer);
			}
		},


		enable: function() {
			var self = this;
			$txa.bind('keyup.'+this.id, function(e) { self.keyup(e); });
			$doc.bind('keydown.'+this.id, function(e) { self.keydown(e); });
			this.isEditable = true;
		},
		disable: function() {
			$txa.unbind('keyup.'+this.id);
			$doc.unbind('keydown.'+this.id);
			this.isEditable = false;
		},

		// is descendant
		isDesc: function(el) {
			if(el.nodeType === 3) el = el.parentElement;
			if(this.el[0] === el || this.el.find(el)[0]) return true;
			return false;
		},




		//== EXEC ========================================

		/**
		 * Grabs the em value if one exist. If not, compute one
		 */
		getFontSize: function(el) {
			if(!el) { console.log("No element defined to get font size"); return false; }

			var size = el.style && el.style.getPropertyValue('font-size'), $el, fz, pfz;
			if(size && size.substr(-2) === 'em') {
				size = parseFloat(size);
			} else {
				$el = $(el);
				fz = parseInt($el.css('font-size'), 10);
				pfz = parseInt($el.parent().css('font-size'), 10);
				size = fz/pfz;
			}
			return size;
		},


		/**
		 * Sets font size on element with value. If isStep is set, value is an increment
		 */
		setFontSize: function(el, value, isStep) {
			var $el = $(el), size;

			if(isStep) {
				size = this.getFontSize(el);
				size = parseInt(size*100 + value*100)/100;
			} else {
				size = value;
			}
			$el.css('font-size', size+'em');
			return $el;
		},

		changeFontSize: function(val) {
			var self = this;
			this.wzRange.setRange();
			if(this.wzRange.r.collapsed) return false;
			if(typeof val === 'undefined') return false;
			if(typeof val === 'string') {
				if(val === 'grow') val = .1;
				else if(val === 'shrink') val = -.1;
			}

			this.wzRange
				.forInRange(function(el) { self.setFontSize(el, val, true); })
				.select();

			return false;
		},

		increaseFontSize: function() { this.changeFontSize("grow"); },
		decreaseFontSize: function() { this.changeFontSize("shrink"); },



		bold: function() {
			this.wzRange.setRange();
			if(this.wzRange.r.collapsed) return false;

			var weight;
			this.wzRange
				.forInRange(function(el) {
					var $el = $(el);
					if(!weight) {
						weight = $el.css("font-weight");
						weight = weight === "bold" ? "normal" : "bold";
					}
					$el.css("font-weight", weight);
					$el.find("span").css("font-weight", "");
				})
				.select();
		},
		italicize: function() {
			this.wzRange.setRange();
			if(this.wzRange.r.collapsed) return false;

			var style;
			this.wzRange
				.forInRange(function(el) {
					var $el = $(el);
					if(!style){
						style = $el.css("font-style");
						style = style === "italic" ? "normal" : "italic";
					}
					$el.css("font-style", style);
					$el.find("span").css("font-style", "");
				})
				.select();
		},


		//== DOM EVENTS ========================================
		keydown: function(e) {
			var k = e.keyCode;
			if(k === 8) {
			} else {
				$txa.focus();
			}
		},
		keyup: function(e) {
			var val = $txa.val();
			if(val.length) {
				this.insertText($txa.val());
				$txa.val('');
			}
		},
		
		mousedown: function(e) {
			this.isMousedown = true;

		},
		mouseup: function(e) {
			var $t = $(e.target),
				_x = e.offsetX, _lh = parseInt($t.css('line-height'), 10),
				r = rangy.getSelection().getRangeAt(0);

			if(r) this.wzRange.r = r;
			this.setBlinker(_x, $t.position().top, _lh);
			this.isMousedown = false;
		},
		mousemove: function(e) {
			var $t = $(e.target);
			if(this.isMousedown) {
				if(this.el[0] === e.target || this.el.find(e.target).length) {
					this.setBlinker(e.offsetX, $t.position().top, parseInt($t.css('line-height'), 10));
				} else {
					this.setBlinker(-9999,-9999,0);	
				}
			}
		},
		setBlinker: function(left, top, height) {
			this.blinker.css({ left: left, top: top, height: height });
		}
	}

	return function(param){
		return Object.create(ContentEditable).init(param);
	}
})();
