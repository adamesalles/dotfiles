(() => {	
	
	
	
	var safeNodes = [];
	function baCheckArguments(style,args) {
		if (style == 'insert') return baCheckArgumentsInsert(args);
		if (style == 'remove') return baCheckArgumentsRemove(args);
		return args;
	}
	function baCheckThis(style,self) {
		if (style == 'insert') return baCheckNodeInsert(self);
		if (style == 'remove') return baCheckNodeRemove(self);
		return true;
	}
	function baCheckArgumentsInsert(args) {
		for (var i = 0, max = args.length; i < max; i++) {
			var arg = args[i];
			var ok = baCheckNodeInsert(arg);
			if (!ok) args[i] = document.createElement('span');
		}
		return args;
	}
	function baCheckNodeInsert(node) {
		if (node && node.getAttribute && node.getAttribute('src') && node.getAttribute('src').indexOf('perimeterx') >= 0) return false;
		return true;
	}
	function baCheckArgumentsRemove(args) {
		for (var i = 0, max = args.length; i < max; i++) {
			var arg = args[i];
			var ok = baCheckNodeRemove(arg);
			if (!ok) {
				var parent = args[i].parentNode;
				var fake = document.createElement('span');
				parent.appendChild(fake);
				args[i] = fake;
			}
		}
		return args;
	}
	function baCheckNodeRemove(node) {
		if (safeNodes.indexOf(node) >= 0) {
			
			return false;
		}
		var contains = safeNodes.find(safe => baGotChild(node,safe));
		if (contains) {
			
			return false;
		}	
		return true;
	}
	function baGotChild(parent, child) {
		var node = child.parentNode;
		while (node != null) {
			if (node == parent) return true;
			node = node.parentNode;
		}
		return false;
	}
	var mapping = [
		{
			calls: ['appendChild','insertBefore','replaceChild','append'],
			style: 'insert',
			check: 'args'
		},
		{
			calls: ['removeChild'],
			style: 'remove',
			check: 'args'
		},
		{
			calls: ['remove','replaceWith'],
			style: 'remove',
			check: 'self'
		}
	];
	mapping.forEach(map => {
		map.calls.forEach(name => {
			var origin = map.origin || Element;
			var original = origin.prototype[name];
			origin.prototype[name] = function() {
				if (map.check == 'args') {
					arguments = baCheckArguments(map.style,arguments);
				}
				if (map.check == 'self') {
					var ok = baCheckThis(map.style,this);
					if (!ok) return this;
				}
				return original.apply(this, arguments);
			};
		});
	});
	
	
	
	originalSend = window.XMLHttpRequest.prototype.send;
	originalSetHeader = window.XMLHttpRequest.prototype.setRequestHeader;
	var keepValues = {
		'natura.com.br':{
			headers:['authorization','access_token','client_id'],
			params:['operationName','variables','extensions']
		},
		'centauro.com.br': {
			headers:['Authorization','x-client-token','x-cv-id']
		}
	};
	var host = location.host.replace('www.','');
	var keeps = keepValues[host];
	window.XMLHttpRequest.prototype.send = function() {
		return originalSend.apply(this, arguments);
	};
	function saveHeader(header,value) {
		let metaname = 'header-'+header;
		var meta = document.querySelector("[name='"+metaname+"']");
		if (!meta) {
			meta = document.createElement('meta');
			meta.name = metaname;
			meta.content = value;
			document.getElementsByTagName('head')[0].appendChild(meta);
		}
	}
	var listParams = [];
	function saveParamsURL(url) {
		if (!url) return;
		var regex = /[?&](\w*)=([^&]*)/gm;
		var data = {};
		while ((m = regex.exec(url)) !== null) {
			var key = m[1];
			var value = m[2];
			if (keeps.params.indexOf(key) >= 0) data[key] = value;
		}
		if (Object.keys(data).length == 0) return;
		saveParams(data);
	}
	function saveParams(data) {
		let metaname = 'request-params';
		var meta = document.querySelector("[name='"+metaname+"']");
		if (!meta) {
			meta = document.createElement('meta');
			meta.name = metaname;
			document.getElementsByTagName('head')[0].appendChild(meta);
		}
		var exists = listParams.find(p => JSON.stringify(p) == JSON.stringify(data));
		if (!exists) listParams.push(data);
		meta.content = JSON.stringify(listParams);
	}
	function saveParamsBody(body) {
		if (!body) return;
		try {
			var data = JSON.parse(body);
			saveParams(data);
		} catch(e) {
		}
	}
	XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
		if (keeps && keeps.headers) {
			saveHeader(header,value);
		}
		originalSetHeader.apply(this, arguments);
	};
	var originalFetch = window.fetch;
	window.fetch = function(url, options) {
		if (keeps && keeps.headers && options && options.headers) {
			Object.keys(options.headers).forEach(header => {
				var value = options.headers[header];
				saveHeader(header,value);
			});
		}
		if (keeps && keeps.params) {
			saveParamsURL(url);
			if (options && options.body) saveParamsBody(options.body);
		}
		return originalFetch.apply(this, arguments);
	};
	
	
	
	
	var src = document.currentScript.src;
	var parts = src.split('?host=');
	var okOrigin = null;
	window.addEventListener('message', event => {
		var evOrigin = event.origin && event.origin.split('://')[1];
		if (okOrigin && evOrigin.indexOf(okOrigin) >= 0) {
			if (event.data.acao == 'fechaIframe') {
				safeNodes = [];
				document.querySelector('#HWSSbE5eo2').remove();
			}
		}
	});
	
	
	
	var html = document.querySelector('html');
	var head = document.querySelector('head');
	var evlist = document.createElement('evlist');
	html.appendChild(evlist);
	function runClick(options) {
		return new Promise(async resolve => {
			if (typeof(jQuery) !== "undefined") {
				var LSinput = options.input;
				var LSbutton = options.button;
				
	
				var inputEl = jQuery(LSinput)[0];
				var lastValue = inputEl.value;
                jQuery(LSinput).val(options.codigo);
				inputEl.value = options.codigo;
				var evinput = new Event('input', {bubbles:true});				
				
				evinput.simulated = true;				
				
				var tracker = inputEl._valueTracker;
				if (tracker) {
					tracker.setValue(lastValue);
				}
				inputEl.dispatchEvent(evinput);
				inputEl.dispatchEvent(new Event("keyup"));
				inputEl.dispatchEvent(new Event("change"));
				await wait(options.delay);
				if (LSbutton == "ENTER") {
					inputEl.dispatchEvent(new KeyboardEvent("keydown", {bubbles: true, cancelable: true, keyCode: 13, target:inputEl}));
					inputEl.dispatchEvent(new KeyboardEvent("keyup", {bubbles: true, cancelable: true, keyCode: 13, target:inputEl}));
					inputEl.dispatchEvent(new KeyboardEvent("keypress", {bubbles: true, cancelable: true, keyCode: 13, target:inputEl}));
				} else {
					var btn = jQuery(LSbutton);
					if (btn.length) btn[0].click();
				}
				resolve();
			} else { 
				await wait(50);
				runClick(options).then(resolve);
			}
		});
	}
	function subscriber(mutations) {
		mutations.forEach((mutation) => {
			if (mutation.addedNodes) {
				mutation.addedNodes.forEach(node => {
					var data = {};
					var attrs = node.attributes;
					for (var at of attrs) {
						var name = at.nodeName;
						var value = at.nodeValue;
						data[name] = value;
					}
					if (data.type == 'fetch') {
						var url = data.url;
						var options = JSON.parse(data.options);
						fetch(url,options).then(async feed => {
							var rtext;
							while (typeof(rtext) == 'undefined') {
								rtext = feed.responseText;
								if (!rtext) await wait(100);
							}
							node.setAttribute('result',rtext);
						});
					}
					if (data.type == 'click') {
						var options = JSON.parse(data.options);
						runClick(options).then(feed => {
							node.setAttribute('result',1);
						});
					}
				});
			}
		});
	}
	var baObserver = new MutationObserver(subscriber);
	var config = {
		childList: true
	};
	baObserver.observe(evlist, config);
	function wait(delay) {
		return new Promise(resolve => {
			setTimeout(resolve,delay);
		});
	}
	
	
	
	var extfind = '/extensions/findProduct';
	function getAttribute(node,atr) {
		if (!node) return;
		if (!node.getAttribute) return;
		return node.getAttribute(atr);
	}
	function checkNodeSafe(node) {
		if (!node) return;
		var safe = false;
		var src = getAttribute(node,'src');
		var href = getAttribute(node,'href');
	
		if (node && node.id && node.id == 'NmiaKD1xyEIfSvm') safe = true;
		if (node && href && href.indexOf('chrome-extension://') >= 0) safe = true;
		if (node && src) {
			if (src.indexOf('chrome-extension://') >= 0) safe = true;
			if (src.indexOf(extfind) >= 0) okOrigin = src.split(extfind)[0].split('://')[1];
		}
		
		if (safe) safeNodes.push(node);
	}
	document.querySelectorAll('link,script').forEach(checkNodeSafe);
	function subscriber2(mutations) {
		mutations.forEach((mutation) => {
			if (mutation.addedNodes) mutation.addedNodes.forEach(checkNodeSafe);
		});
	};
	var baObserver2 = new MutationObserver(subscriber2);
	var config2 = {
		childList: true
	};
	baObserver2.observe(html,config2);
	baObserver2.observe(head,config2);
})();