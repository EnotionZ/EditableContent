var WizzyRange = (function(){


	var 
	
	ELEMENT_NODE = 1,
	TEXT_NODE = 3,
	KEY = {
		LEFT : 37,
		UP : 38,
		RIGHT : 39,
		DOWN : 40,
		RETURN : 13
	},



	isWhitespaceChar 	= function(char) { return char.match(/^\s+|\s+$/); },
	isTNode 			= function(node) { return node.nodeType === TEXT_NODE; },
	isENode 			= function(node) { return node.nodeType === ELEMENT_NODE; },
	trim 				= function(str) { return str.replace(/^\s+|\s+$/g, ''); },





	/**
	 * Class which wraps rangy's range. A rangy range instance is associated with WizzyRange.
	 * Use setRange to update it with a new range
	 */
	WizzyRangeProto = {
		init: function(r) {
			return this.setRange(r);
		},

		setRange: function(r) {
			if(r) this.r = r.cloneRange();
			else this.r = rangy.getSelection().getRangeAt(0);
			return this;
		},
		clone: function() { return WizzyRange().init(this.r.cloneRange()); },
		select: function() { return rangy.getSelection().setSingleRange(this.r); },


		/**
		 * Call rangy's range method
		 */
		call: function(method, param) {
			var args = Array.prototype.slice.call(arguments, 1);
			if(typeof this[method] === "function") {
				this[method].apply(this, args);
			} else if(typeof this.r[method] === "function") {
				this.r[method].apply(this.r, args);
			}
		},


		/**
		 * Getters, 's' for anything start (startContainer, startOffset), 'e' for anything end
		 */
		get: function(which) { return this.r[which === "s" ? "startContainer" : "endContainer"]; },
		offset: function() { return { s: this.r.startOffset,  e: this.r.endOffset }; },
		isTNode: function(which) { return isTNode(this.get(which)); },
		isENode: function(which) { return isENode(this.get(which)); },

		/**
		 * direction is "next" or "prev"
		 */
		getSibling: function(which, direction) { return this.get(which)[direction === "next" ? "nextSibling" : "previousSibling"]; },



		/**
		 * Helper to determine if a character in a range is a whitespace character
		 */
		isRangeCharWS: function(which, offset) {
			var c = this.getCharInRange(which, offset);
			return c !== null ? isWhitespaceChar(c) : false;
		},


		/**
		 * Helper method to grab the character in a range container
		 */
		getCharInRange: function(which, offset) {
			var c = null; offset = offset || 0;
			if(this.isTNode(which)) c = this.get(which).textContent[this.offset()[which] + offset];
			return c;
		},


		/**
		 * For a given range, remove textnode's whitespace at the start and end of range
		 * This will move the range startContainer to nextSibling if current node's length is reached
		 */
		trimRangeWhitespaces: function() {
			var r = this.r, prevSibling = true, nextSibling = true, i=0, nodeLength;

			// Only trim the start if startContainer is text node
			if(this.isTNode('s')) {
				do {
					nodeLength = this.get('s').length;
					if(nodeLength && this.offset()['s'] < nodeLength && this.isRangeCharWS('s')) {
						this.call('setStart', this.get('s'), this.offset()['s']+1);
					} else break;

					if(!nodeLength || this.offset()['s'] === nodeLength) {
						nextSibling = this.getSibling('s','next');
						if(nextSibling) {
							this.call('setStart', nextSibling, 0);
							if(isENode(nextSibling)) break;
						}
					}
					i++; if(i==1000) { console.log("Trim range loop broken at start"); break; }
				} while (nextSibling);
			}
			i=0;
			if(this.isTNode('e')) {
				do {
					if(this.offset()['e'] > 0 && this.isRangeCharWS('e', -1)) {
						this.call('setEnd', this.get('e'), this.offset()['e']-1);
					} else break;

					if(this.offset()['e'] === 0) {
						prevSibling = this.getSibling('e', 'prev');
						if(prevSibling) {
							if(isENode(prevSibling)) this.call('setEnd', prevSibling, 1);
							else this.call('setEnd', prevSibling, prevSibling.length);
						}
					}
					// For infinite loop error checking, remove if/when appropriate
					i++; if(i==1000) { console.log("Trim range loop broken at end"); break; }
				} while (prevSibling);
			}
		},

		/**
		 * For a given range, include textnode's whitespace at the start, will allow startOffset
		 * to at most be 0 and startContainer to be the first node within an element
		 */
		includeRangeWhitespaces: function() {
			var r = this.r, prevSibling = true, nextSibling = true, i=0, nodeLength, startEl, endEl;
			if(this.isTNode('s')) {
				do {
					if(this.offset()['s'] > 0 && this.isRangeCharWS('s', -1)) {
						this.call('setStart', this.get('s'), this.offset()['s']-1);
					} else break;

					if(this.offset()['s'] === 0) {
						prevSibling = this.getSibling('s', 'prev');
						if(prevSibling) this.call('setStart', prevSibling, prevSibling.length);
					}
					i++; if(i==1000) { console.log("Include range loop broken at start"); break; }
				} while (prevSibling);
			}
			i=0;
			if(this.isTNode('e')) {
				do {
					nodeLength = this.get('e').length;
					if(this.offset()['e'] < nodeLength && this.isRangeCharWS('e')) {
						this.call('setEnd', this.get('e'), this.offset()['e']+1);
					} else break;

					if(this.offset()['e'] === nodeLength || !nodeLength) {
						nextSibling = this.getSibling('e', 'next');
						if(nextSibling) this.call('setEnd', nextSibling, 0);
					}
					// For infinite loop error checking, remove if/when appropriate
					i++; if(i==1000) { console.log("Include range loop broken at end"); break; }
				} while (nextSibling);
			}

			// Add to range all the way to outermost edge of node if possible
			startEl = isENode(r.startContainer) ? r.startContainer : r.startContainer.parentElement;
			endEl = isENode(r.endContainer) ? r.endContainer : r.endContainer.parentElement;
			prevSibling = r.startContainer.previousSibling;
			nextSibling = r.endContainer.nextSibling;
			if(rangy.dom.isAncestorOf(startEl, r.endContainer)) {
				while(!nextSibling && r.endContainer.parentNode !== startEl) r.setEndAfter(r.endContainer);
			} else if(rangy.dom.isAncestorOf(endEl, r.startContainer)) {
				while(!prevSibling && r.startContainer.parentNode !== endEl) r.setStartBefore(r.startContainer);
			}
		},


		/**
		 * Checking helper to determine if range contains a certain (or any element)
		 */
		containsOnlyCheck: function(tag) {
			var r = this.r, sc = this.get('s'), ec = this.get('e');
			
			if(sc.nodeType === TEXT_NODE && sc.previousSibling) return false;
			if(ec.nodeType === TEXT_NODE && ec.nextSibling) return false;
			if(sc.parentElement !== ec.parentElement) return false;
			if(tag && sc.parentElement.tagName.toLowerCase() !== tag) return false;
			if(r.startOffset !== 0) return false;
			if(ec.nodeType === ELEMENT_NODE && r.endOffset !== 1) return false;
			if(ec.nodeType === TEXT_NODE && r.endOffset !== ec.length) return false;

			if(sc === ec && sc.nodeType === ELEMENT_NODE) return sc;
			return sc.parentElement;
		},


		/**
		 * Checks to see if range contains specified tag and that element is the only child (ignoring whitespace)
		 * This allows us for instance, when setting a font size, to catch if a "span" tag already exist and
		 * use that element instead of creating a new span node
		 */
		containsOnlyChildTag: function(tag) {
			this.trimRangeWhitespaces();
			return this.containsOnlyCheck(tag);
		},

		/**
		 * Checks to see if parent element of range contains range as only child
		 */
		containsOnlyParentTag: function(tag) {
			this.includeRangeWhitespaces();
			return this.containsOnlyCheck(tag);
		},


		/**
		 * Surrounds range with a certain element specified by tag string
		 * @return 		element if successful
		 */
		surroundWithTag: function(tag) {
			var r = this.r;
			if(r.canSurroundContents()) {
				var el = document.createElement(tag);
				r.surroundContents(el);
				return el;
			}
			console.error("Cannot Surround Content");
			return null;
		},



		/**
		 * Checks to see if sc (startContainer) and ec (endContainer) contains eachother.
		 * When we hit an edge (no next/prev sibbling), move up to the parent element and cross check again
		 */
		traverseThroughElements: function(sc, ec, callback) {
			if(rangy.dom.isAncestorOf(sc,ec)) {
				this.traverseFromElement({
					direction: -1, el: ec,		// start from end container, go back
					childToAvoid: sc,			// stop when we reach start container
					fn: callback
				});
			} else if(rangy.dom.isAncestorOf(ec,sc)) {
				this.traverseFromElement({
					direction: 1, el: sc,
					childToAvoid: ec,
					fn: callback
				});
			} else {
				var elementsToAvoid = [ec, rangy.dom.getCommonAncestor(sc,ec)];
				this.traverseFromElement({
					direction: 1, el: sc,
					childToAvoid: ec,
					elementsToAvoid: elementsToAvoid,
					fn: callback
				});
				this.traverseFromElement({
					direction: -1, el: ec,
					childToAvoid: sc,
					elementsToAvoid: elementsToAvoid,
					fn: callback
				});
			}
		},


		/**
		 * Iterates from element and performs callback on sibbling and parent element found. Stop when any stopEl is found.
		 * As it's moving through, each styled element will be added to stopEl to indicate that it's already been processed
		 */
		traverseFromElement: function(param) {
			var direction = param.direction,				// Direction of iteration
				elementsToAvoid = param.elementsToAvoid,	// Will return if element in this Array is matched
				childToAvoid = param.childToAvoid,			// Will return if element is found as a child of matched
				el = param.el,								// Node to start iterating from
				fn = param.fn,								// Callback when element is found

				log = false,
				curr = direction > 0 ? el.nextSibling : el.previousSibling, range;

			if(log) console.log('------- Starting Iteration', direction > 0 ? 'forward' : 'backward', 'from', el);
			while(curr !== elementsToAvoid && elementsToAvoid.indexOf(curr) === -1) {

				if(curr) {
					if(isTNode(curr)) {
						range = rangy.createRange();
						range.setStart(curr, 0);
						range.setEnd(curr, curr.length);

						// If this is a textnode, add all neighboring textnodes into range
						if(direction > 0) {
							while(curr.nextSibling && isTNode(curr.nextSibling)) {
								range.setEnd(curr.nextSibling, curr.nextSibling.length);
								curr = curr.nextSibling;
							}
						} else {
							while(curr.previousSibling && isTNode(curr.previousSibling)) {
								range.setStart(curr.previousSibling, 0);
								curr = curr.previousSibling;
							}
						}

						if(range.collapsed || (range.startContainer === range.endContainer && trim(range.cloneContents().textContent) === "")) {
							el = curr;
							curr = direction > 0 ? el.nextSibling : el.previousSibling;
							continue;
						}
						this.setRange(range);
						curr = this.surroundWithTag('span');
					}

					if(rangy.dom.isAncestorOf(curr,childToAvoid)) {
						if(log) console.log("------Found common parent", curr);
						return;
					}

					fn.call(this, curr);
					elementsToAvoid.push(curr);

					el = curr;
					curr = direction > 0 ? el.nextSibling : el.previousSibling;
				} else {
					el = el.parentElement;
					//if(!el || (!el.nextSibling && !el.previousSibling)) return;
					if(el === elementsToAvoid || elementsToAvoid.indexOf(el) !== -1) {
						if(log) console.log("------Found repeated element", el);
						return;
					}
					curr = direction > 0 ? el.nextSibling : el.previousSibling;
				}
			}
		},

	

		/**
		 * Iterates through each top-level element in range, fires callback with node
		 *
		 * If startOffset and/or endOffset is on a textnode, that portion of the textnode
		 * will be wrapped in a <span/> tag and passed in to the callback.
		 *
		 * If node is an edge node (no previous/next sibling), the top-level element which doesn't
		 * include the range's start/end container's common ancestor will be interated through
		 */
		forInRange: function(callback) {
			if(typeof callback !== "function") return false;


			var r = this.r.cloneRange(),			// Hold on to our current range
				newRange = this.r.cloneRange(),		// Holds a new rangy range (may be used later as instance's range)
				span,								// Span element to be created if/when textnodes are wrapped
				sc = this.get('s'),					// Range's start container
				ec = this.get('e'),					// Range's end container
				next, prevSibling, nextSibling;


			// Check to see if we can just wrap the range by omitting whitespaces
			span = this.containsOnlyParentTag() || this.containsOnlyChildTag();
			if(span) {
				console.log("There was only one element in range");
				callback.call(this, span);
				this.r.selectNodeContents(span);
				this.select();
				return this;
			}


			// Checks to see if the range contains text nodes and endpoints are sibbling
			this.setRange(r);
			if(this.isTNode('s') && this.isTNode('e')) {

				if(this.get('s') === this.get('e')) {
					console.log("Same start and end container textnode");
					span = this.surroundWithTag('span');
					callback.call(this, span);
					this.r.selectNodeContents(span);
					this.select();
					return this;
				}

				next = this.getSibling("s", "next");
				while(next && isTNode(next)) {
					if(next === this.get('e')) {
						console.log("Endpoints are siblings and only contain textnodes in between");
						span = this.surroundWithTag('span');
						callback.call(this, span);
						this.r.selectNodeContents(span);
						this.select();
						return this;
					} else {
						next = next.nextSibling;
					}
				} 
			}


			// Close the textnodes at endpoints by wrapping it with a <span/> to its sibbling's first non textnode
			this.setRange(r);
			if(this.isTNode('s')) {
				this.call("collapse", true);
				do {
					nextSibling = this.getSibling('e', 'next');
					if(nextSibling && isTNode(nextSibling)) this.call("setEnd", nextSibling, nextSibling.length);
					else this.call("setEnd", this.get('e'), this.get('e').length);
				} while(nextSibling && isTNode(nextSibling));

				if(!this.r.collapsed) {
					sc = this.containsOnlyParentTag() || this.containsOnlyChildTag() || this.surroundWithTag('span');
					callback.call(this, sc);
					newRange.setStart(sc, 0);
				}
			}
			this.setRange(r);
			if(this.isTNode('e')) {
				this.call("collapse", false);
				do {
					prevSibling = this.getSibling('s', 'prev');
					if(prevSibling && isTNode(prevSibling)) this.call("setStart", prevSibling, 0);
					else this.call("setStart", this.get('s'), 0);
				} while(prevSibling && isTNode(prevSibling));

				if(!this.r.collapsed) {
					ec = this.containsOnlyParentTag() || this.containsOnlyChildTag() || this.surroundWithTag('span');
					callback.call(this, ec);
					newRange.setEnd(ec, 1);
				}
			}

			// At this point, we no longer have to deal with ranges. Traversing is on an element level.
			this.traverseThroughElements(sc, ec, callback);
			this.setRange(newRange).select();
			return this;
		}
	};
	return function() { return Object.create(WizzyRangeProto); };
})();