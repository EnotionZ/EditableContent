rantex = (function(){


	if (typeof Object.create !== "function") {
		Object.create = (function () {
			function F() {};
			return function (o) {
				F.prototype = o;
				return new F();
			};
		})();
	}


	var

	ELEMENT_NODE        = 1,
	TEXT_NODE           = 3,


	/**
	 * Are we using Microsoft Text Range?
	 */
	MSTR = window.document.body.createTextRange && window.document.selection ? true : false,


	/**
	 * A basic cross browser range wrapper
	 */
	RangeProto = {
		range                     : null,	// Represents native range/text-range
		collapsed                 : null,
		commonAncestorContainer   : null,
		endContainer              : null,
		startContainer            : null,
		endOffset                 : 0,
		startOffset               : 0,


		_setRange: function() {
			this.startContainer = this.range.startContainer;
			this.startOffset = this.range.startOffset;
			this.endContainer = this.range.endContainer;
			this.endOffset = this.range.endOffset;
			this.collapsed = this.range.collapsed;
		},


		init: function(w) {
			w = w || window;
			this.w = w;
			
			if(MSTR) {
				this.range = w.document.selection.createRange(); //Microsoft TextRange Object
				this.fixIERangeObject();
			} else if(w.document.createRange) {
				try {
					// Either has W3C Range spec or Mozzila Selection
					this.range = w.document.createRange();
					var s = getSelection(w);
					if(s) {
						this.range = s.getRangeAt(0);
						this._setRange();
					}
				} catch(e) {}
			} else {
				// Uh oh
			}

			return this;
		},


		_findTextNode: function(parentElement,text) {
			//Iterate through all the child text nodes and check for matches
			//As we go through each text node keep removing the text value (substring) from the beginning of the text variable.
			var container=null,offset=-1;
			for(var node=parentElement.firstChild; node; node=node.nextSibling) {
				if(node.nodeType==3) {//Text node
					var find=node.nodeValue;
					var pos=text.indexOf(find);
					if(pos==0 && text!=find) { //text==find is a special case
						text=text.substring(find.length);
					} else {
						container=node;
						offset=text.length-1; //Offset to the last character of text. text[text.length-1] will give the last character.
						break;
					}
				}
			}
			//Debug Message
			//alert(container.nodeValue);
			return {node: container,offset: offset}; //nodeInfo
		},

		fixIERangeObject: function() {
			var win = this.w;
			var range = this.range;

			if(!range) return null;
			if(!range.startContainer && win.document.selection) { // IE textrange


				var rangeCopy1=range.duplicate(), rangeCopy2=range.duplicate(); //Create a copy
				var rangeObj1=range.duplicate(), rangeObj2=range.duplicate(); //More copies :P

				rangeCopy1.collapse(true); //Go to beginning of the selection
				rangeCopy1.moveEnd('character',1); //Select only the first character
				rangeCopy2.collapse(false); //Go to the end of the selection
				rangeCopy2.moveStart('character',-1); //Select only the last character

				//Debug Message
				// alert(rangeCopy1.text); //Should be the first character of the selection
				var parentElement1=rangeCopy1.parentElement(), parentElement2=rangeCopy2.parentElement();

				//If user clicks the input button without selecting text, then moveToElementText throws an error.
				if(parentElement1 instanceof HTMLInputElement || parentElement2 instanceof HTMLInputElement) {
					return null;
				}

				rangeObj1.moveToElementText(parentElement1); //Select all text of parentElement
				rangeObj1.setEndPoint('EndToEnd',rangeCopy1); //Set end point to the first character of the 'real' selection
				rangeObj2.moveToElementText(parentElement2);
				rangeObj2.setEndPoint('EndToEnd',rangeCopy2); //Set end point to the last character of the 'real' selection

				var text1=rangeObj1.text; //Now we get all text from parentElement's first character upto the real selection's first character	
				var text2=rangeObj2.text; //Here we get all text from parentElement's first character upto the real selection's last character

				var nodeInfo1 = this._findTextNode(parentElement1,text1);
				var nodeInfo2 = this._findTextNode(parentElement2,text2);

				//Finally we are here
				range.startContainer = nodeInfo1.node;
				range.startOffset    = nodeInfo1.offset;
				range.endContainer   = nodeInfo2.node;
				range.endOffset      = nodeInfo2.offset+1; //End offset comes 1 position after the last character of selection.


				this._setRange();
			}
		},



		// Positioning Methods
		setStart: function(startContainer, startOffset) {
			if(MSTR) {
				
			} else {
				if(this.range.setStart) {
					this.range.setStart(startContainer, startOffset);
					this._setRange();
				}
			}
		},
		setEnd: function(endContainer, endOffset) {
			if(MSTR) {
				
			} else {
				if(this.range.setEnd) {
					this.range.setEnd(endContainer, endOffset);
					this._setRange();
				}
			}
		},
		setStartBefore: function() {
			var args = Array.prototype.slice.call(arguments);
			if(MSTR) {
				
			} else {
				if(this.range.setStartBefore) return this.range.setStartBefore.apply(this.range, args);
			}
		},
		setEndBefore: function() {
			var args = Array.prototype.slice.call(arguments);
			if(MSTR) {
				
			} else {
				if(this.range.setEndBefore) return this.range.setEndBefore.apply(this.range, args);
			}
		},
		setEndAfter: function() {
			var args = Array.prototype.slice.call(arguments);
			if(MSTR) {
				
			} else {
				if(this.range.setEndAfter) return this.range.setEndAfter.apply(this.range, args);
			}
		},
		selectNode: function(node) {
			if(MSTR) {
				this.range.moveToElementText(node);
				this.fixIERangeObject();
			} else {
				if(this.range.selectNode) return this.range.selectNode(node);
			}
		},
		selectNodeContents: function(node) {
			if(MSTR) {
				
			} else {
				if(this.range.selectNodeContents) return this.range.selectNodeContents(node);
			}
		},
		collapse: function(toStart) {
			this.range.collapse(toStart);
			this._setRange();
		},




		// Calls browser select on this range
		select: function() {
			try {
				var s = getSelection(this.w);
				if(console) console.log(s);
				s.removeAllRanges();
				s.addRange(this.range);
			} catch(e) {
				if(console) console.log(e);
			}
		},


		cloneRange: function() {
			var newRange = createRange();
			newRange.setStart(this.startContainer, this.startOffset);
			newRange.setEnd(this.endContainer, this.endOffset);
			return newRange;
		},

		
		/**
		 * Returns a document fragment copying the nodes of a Range
		 */
		cloneContents: function() {
			
		},

		/**
		 * Removes the contents of a Range from the document
		 */
		deleteContents: function() {
			
		},

		/**
		 * Moves contents of a Range from the document tree into a document fragment
		 */
		extractContents: function() {
			
		},

		/**
		 * Insert a node at the start of a Range
		 */
		insertNode: function() {
			
		},

		/**
		 * Checks if content of a Range can be moved into a new node
		 */
		canSurroundContents: function() {
			var sc = this.startContainer, ec = this.endContainer;

			if(sc === ec) return true;
			if(sc.nodeType === ELEMENT_NODE && sc.nodeType === TEXT_NODE) {
				if($(sc).children(ec).length && this.startOffset === 0) return true;
			} else if(sc.nodeType === ELEMENT_NODE && sc.nodeType === TEXT_NODE) {
				if($(ec).children(sc).length && this.endOffset === 1) return true;
			} else if(sc.nodeType === TEXT_NODE && ec.nodeType === TEXT_NODE) {
				if(sc.parentNode === ec.parentNode) return true; // Both are text nodes
			} else if(sc.nodeType === ELEMENT_NODE && ec.nodeType === ELEMENT_NODE) {
				// both are element nodes and they different
			}
			return false;
		},

		/**
		 * Moves content of a Range into a new node
		 */
		surroundContents: function(node) {
			r = this.range;
			t = this;
			if(MSTR) {
				var rnd, tmpNode, prnt;

				node.innerHTML = this.range.htmlText;

				rnd = "_rantex-"+parseInt(Math.random()*999999, 10);
				this.range.pasteHTML('<'+node.nodeName+' id="'+rnd+'">qwerty<'+node.nodeName+'>');
				tmpNode = this.w.document.getElementById(rnd);
				prnt = tmpNode.parentNode;
				
				prnt.insertBefore(node, tmpNode);
				prnt.removeChild(tmpNode);

				this.selectNode(node);
				//this.select();
			} else {
				if(this.range.surroundContents) return this.range.surroundContents(node);
			}
		}
	},




	dom = {
		isAncestorOf: function(ancestor, descendant) {
			return $(ancestor).find(descendant).length;
		},
		getCommonAncestor: function(node1, node2) {
			if(node2.parentNode === node1) return node1;
			else if(node1.parentNode === node2) return node2;

			while(!dom.isAncestorOf(node2,node1)) node2 = node2.parentNode;
			return node2;
		}
	},
	



	createRange = function(w) {
		return Object.create(RangeProto).init(w);
	},
	getSelection = function(w) {
		w = w || window;
		return w.getSelection ? w.getSelection() : w.document.selection;
	};




	return {
		_range:        RangeProto,
		createRange:   createRange,
		getSelection:  getSelection,
		dom: dom
	};


})();