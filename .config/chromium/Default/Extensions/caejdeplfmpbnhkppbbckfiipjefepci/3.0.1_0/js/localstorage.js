var baLocalStorage = function(prefix) {
	this.data = {};
	this.prefix = prefix;
	
	for (var atr in localStorage) {
		if (atr.indexOf(this.prefix) === 0) {
			var vlr = localStorage[atr];
			try {
				this.data[atr] = JSON.parse(vlr);
			} catch(e) {
				this.data[atr] = vlr;
			}
		}
	};
	
	this.get = function(atr,defvalue) {
		atr = this.prefix+'_'+atr;
		return this.data[atr] || defvalue;
	};	
	
	this.set = function(atr,vlr) {
		atr = this.prefix+'_'+atr;
		this.data[atr] = vlr;
		localStorage.setItem(atr,JSON.stringify(vlr));
	};
	
	this.push = function(atr,vlr) {
		var obj = this.get(atr,[]);
		obj.push(vlr);
		this.set(atr,obj);
	};
	
	this.splice = function(atr,index,len) {
		var obj = this.get(atr,[]);
		if (obj.splice) obj.splice(index,len);
		this.set(atr,obj);		
	};
	
	this.remove = function(atr) {
		atr = this.prefix+'_'+atr;
		this.data[atr] = null;
		localStorage.removeItem(atr);
	};
	
	this.clear = function() {
		for (var fullatr in this.data) {
			var atr = fullatr.replace(this.prefix+'_','');
			this.set(atr,null);
		}
	};
};