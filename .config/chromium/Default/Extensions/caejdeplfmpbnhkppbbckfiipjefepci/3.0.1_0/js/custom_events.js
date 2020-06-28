class CustomEvents {
	static createEv(attrs,resolve) {
		var $evlist = $('evlist');
		var $ev = $('<ev>',attrs).appendTo($evlist);		
		var config = {attributes: true};
				
		var subscriber = function(mutations) {
			mutations.forEach(mutation => {
				if (mutation.attributeName == 'result') {
					var node = mutation.target;
					var value = node.getAttribute('result');
					var data = (value) ? JSON.parse(value) : null;
					resolve(data);
					baObserver.disconnect();
					$ev.remove();
				}
			});
		}
		var baObserver = new MutationObserver(subscriber);
		baObserver.observe($ev[0], config);
	}
	static fetch(url,options) {
		return new Promise(resolve => {
			this.createEv({
				'type':'fetch',
				'url':url,
				'options':JSON.stringify(options)
			},resolve);
		})
	}
	static click(options) {
		return new Promise(resolve => {
			this.createEv({
				'type':'click',
				'options':JSON.stringify(options)
			},resolve);
		});
	}
	static typed(type) {
		return new Promise(resolve => {
			this.createEv({
				'type':type,
			},resolve);
		});
	}
}
function subscriber(mutations) {
	mutations.forEach(mutation => {
		if (mutation.attributeName == 'result') {
			var node = mutation.target;
			var value = node.getAttribute('result');
			var data = (value) ? JSON.parse(value) : null;
			resolve(data);
			baObserver.disconnect();
			ev.remove();
		}
	});
}
