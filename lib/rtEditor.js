
var rtEditor = (function(){
	var

	ELEMENT_NODE 		= 1,
	TEXT_NODE           = 3,

	KEY = {
		BACKSPACE       : 8,
		LEFT            : 37,
		UP              : 38,
		RIGHT           : 39,
		DOWN            : 40,
		RETURN          : 13
	},

	$doc =              $(document),
	$txa =              $('<textarea/>').addClass('-ec-ta').appendTo(document.body),


	generateId = function() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c === 'x' ? r : r & 3 | 8;
			return v.toString(16);
		}).toUpperCase();
	},


	ContentEditable = {
		init: function(param) {

			this.el = $(param.el);
			this.blinker = $('<span/>').addClass('-ec-blinker');

			this.id = generateId();
			this.isEditable = false;
			this.isMousedown = false;

			this.wzRange = WizzyRange();

			return this;
		},

		splitTextnodes: function() {
				
		},

		joinTextnodes: function() {
			
		},

		insertText: function(str){
			var r = this.wzRange.r, txt;

			if(this.isDesc(r.startContainer)) {
				if(false && r.endContainer.nodeType === TEXT_NODE) {
					r.endContainer.appendData(str);;
				} else {
					txt = document.createTextNode(str);
					r.insertNode(txt);
					r.selectNode(txt);
					r.collapse();	
				}
			} else {
				console.log("Can't insert text, invalid range", r.startContainer);
			}
		},


		enable: function() {
			var self = this;
			this.el
				.addClass('-ec')
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
			this.el.unbind('.'+this.id).removeClass('-ec');
			$txa.unbind('.'+this.id);
			$doc.unbind('.'+this.id);

			this.isEditable = false;
			this.blinker.remove();
		},

		// is descendant
		isDesc: function(el) {
			if(el.nodeType === TEXT_NODE) el = el.parentNode;
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
			this.blinker.removeClass('active');
		},
		mouseup: function(e) {
			try {
				var s = rantex.getSelection(),
					r = s.getRangeAt(0);

				this.wzRange.r = r;
				this.setBlinker(r);
				//s.setSingleRange(r);

				this.isMousedown = false;
				this.blinker.addClass('active');
			} catch(e) {
				if(console) console.log(e);
			}
		},
		mousemove: function(e) {
			if(this.isMousedown) {

			}
		},
		setBlinker: function(range) {
			try {
				var r = range ? range.cloneRange() : rangy.getSelection().getRangeAt(0);
				r.collapse();
				r.insertNode(this.blinker[0]);
				this.blinker.css('height', this.blinker.css('line-height'));
			} catch(e) {}
		}
	},






	//== EXEC ========================================
	ExecCommands = {

		/**
		 * Grabs the em value if one exist. If not, compute one
		 */
		getFontSize: function(el) {
			if(!el) { console.log("No element defined to get font size"); return false; }

			var size, $el, fz, pfz;
			if(el.style) {
				if(el.style.getPropertyValue) {
					size = el.style.getPropertyValue('font-size');
				} else if(el.style.fontSize) {
					size = el.style.fontSize;
				}
			}

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
				.forInRange(function(el) {console.log(el)
					var $el = $(el);
					if(!weight) {
						weight = $el.css("font-weight");
						weight = weight === "bold" || weight === "700" ? "normal" : "bold";
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



		setTextDecoration: function(style) {
			this.wzRange.setRange();
			if(this.wzRange.r.collapsed) return false;

			var defaultStyle;
			this.wzRange
				.forInRange(function(el) {
					var $el = $(el);
					if(!defaultStyle){
						defaultStyle = $el.css('text-decoration');
						if(style === defaultStyle) style = "none";
					}
					$el.css("text-decoration", style);
					$el.find("span").css("text-decoration", "");
				})
				.select();
		},
		underline: function() { return ExecCommands.setTextDecoration.call(this, 'underline'); },
		linethrough: function() { return ExecCommands.setTextDecoration.call(this, 'line-through'); }
	};

	return function(param){
		return Object.create(ContentEditable).init(param);
	}
})();