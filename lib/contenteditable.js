
var CE = (function(){
	rangy.init();

	var

	ELEMENT_NODE = 1,
	TEXT_NODE = 3,

	KEY = {
		BACKSPACE: 8,
		LEFT : 37,
		UP : 38,
		RIGHT : 39,
		DOWN : 40,
		RETURN : 13
	},

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

			this.el = $(param.el);
			this.blinker = $('<div/>').addClass('-ce-blinker');

			this.id = generateId();
			this.isEditable = false;
			this.isMousedown = false;

			this.wzRange = WizzyRange();

			return this;
		},

		splitTextnodes: function() {
				
		},

		insertText: function(str){
			var r = this.wzRange.r,
				txt = document.createTextNode(str)

			if(this.isDesc(r.startContainer)) {
				r.insertNode(txt);
				r.selectNode(txt);
				r.collapse();
			} else {
				console.log("Can't insert text, invalid range", r.startContainer);
			}
		},


		enable: function() {
			var self = this;
			this.el
				.addClass('-ce')
				.append(this.blinker)
				.bind('mousedown.'+this.id, function(e) { self.mousedown(e); });
			$doc
				.bind('mousemove.'+this.id, function(e) { self.mousemove(e); })
				.bind('mouseup.'+this.id, function(e) { self.mouseup(e); })
				.bind('keydown.'+this.id, function(e) { self.keydown(e); });
			$txa.bind('keyup.'+this.id, function(e) { self.keyup(e); });

			this.isEditable = true;
		},
		disable: function() {
			this.el.unbind('.'+this.id).removeClass('-ce');
			$txa.unbind('.'+this.id);
			$doc.unbind('.'+this.id);

			this.isEditable = false;
			this.blinker.remove();
		},

		// is descendant
		isDesc: function(el) {
			if(el.nodeType === TEXT_NODE) el = el.parentElement;
			if(this.el[0] === el || this.el.find(el)[0]) return true;
			return false;
		},

		/**
		 * Perform the specified command on the current valid range.
		 * Range's start and end container must be this.el or inside of this.el
		 */
		exec: function(command) {
			if(typeof ExecCommands[command] === "function") {
				return ExecCommands[command].apply(this, Array.prototype.slice.call(arguments,1));
			}
		},


		//== DOM EVENTS ========================================
		keydown: function(e) {
			var k = e.keyCode; console.log(k);
			switch (k) {
				case KEY.UP:

					break;
				case KEY.DOWN:

					break;
				case KEY.LEFT:

					break;
				case KEY.RIGHT:

					break;
				case KEY.BACKSPACE:

					break;
				default:
			}
			$txa.focus();
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
			var r = rangy.getSelection().getRangeAt(0);

			if(r) {
				this.wzRange.r = r;
				this.setBlinker(r);
			}
			this.isMousedown = false;
		},
		mousemove: function(e) {
			if(this.isMousedown) {
				if(this.el[0] === e.target || this.el.find(e.target).length) {
					this.setBlinker();
				} else {
					//this.setBlinker(-9999,-9999,0);
				}
			}
		},
		setBlinker: function(range) {
			var r = range ? range.cloneRange() : rangy.getSelection().getRangeAt(0);
			r.collapse();
			r.insertNode(this.blinker[0]);
			this.blinker.css('height', this.blinker.css('line-height'));
		}
	},






	//== EXEC ========================================
	ExecCommands = {

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
				size = ExecCommands["getFontSize"](el);
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
				.forInRange(function(el) {
					ExecCommands["setFontSize"](el, val, true);
				})
				.select();

			return false;
		},

		increaseFontSize: function() { ExecCommands["changeFontSize"].call(this, "grow"); },
		decreaseFontSize: function() { ExecCommands["changeFontSize"].call(this, "shrink"); },



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
		}
	};

	return function(param){
		return Object.create(ContentEditable).init(param);
	}
})();
