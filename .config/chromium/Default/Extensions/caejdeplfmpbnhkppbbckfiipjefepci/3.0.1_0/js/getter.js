if (typeof browser === 'undefined') browser = chrome;
var instalacao = '000';
classGetter = function () {
	var self = this;
	this.files = {};
	this.running = {};
	this.callbacks = {};
	this.defaults = {};
	this.env = null;
	this.config = null;
	var manifest = browser.runtime.getManifest();
	var basekey = 'getter'+browser.runtime.id;
	this.url = function(endpoint) {
		var protocol = 'https';
		var host = this.env.host;
		if (this.env.ambiente != 'www') {
			protocol = 'http';
			host = this.env.ambiente+'.baixou.com.br';
		}
		
		var opts = {url: protocol + '://' + host + endpoint};
		this.fixURL(opts);
		return opts.url;
	};
	this.loaded = async function() {
		while (!this.env) await wait(100);
	};
    
    this.lsget = function(key,prefix,type) {
		var vlr = localStorage.getItem(basekey+'-'+key+'-'+prefix);
		if (type == 'json') vlr = JSON.parse(vlr);
		if (type == 'int') vlr = parseInt(vlr) || 0;
		return vlr;
    };
    this.lsset = function(key,prefix,value) {
		if (typeof value != 'string') value = JSON.stringify(value);
        localStorage.setItem(basekey+'-'+key+'-'+prefix,value);
    };
    this.lsremove = function(key,prefix) {
        localStorage.removeItem(basekey+'-'+key+'-'+prefix);
    };
    
    this.reset = function() {
        self.log('RESET');
        
        var keys = Object.keys(localStorage);
        
        for (var key of keys) {
            
            if (key.indexOf(basekey+'-') == 0) {
                self.log('resetting',key);
                localStorage.removeItem(key);
            }
        }
    };
    this.resetkey = function(key) {
        this.lsremove(key,'feed');
        this.lsremove(key,'time');
    };
    
	this.durations = function(obj) {
		for (var key in obj) {
			var dur = obj[key];
			this.defaults[key] = dur;
		}
	};
    
	this.feed = function (key,type) {
		var value = self.lsget(key,'feed');
		if (value) {
			if (type == 'date') value = new Date(value).getTime();
		}
		return value;
	};
    
	this.time = function (key) {
		return self.lsget(key,'time');
	};
    this.fixURL = function(opts) {
        if (!opts.url) opts.url = '';
        var localid = localStorage.getItem('localid');
        opts.url = this.updateQueryStringParameter(opts.url,'localid',localid);
        opts.url = this.updateQueryStringParameter(opts.url,'version',manifest.version);
        opts.url = this.updateQueryStringParameter(opts.url,'dt',new Date().getTime());
    };
    
	this.load = function (opts) {
		return new Promise(function (resolve, reject) {
			load_files().then(function() {
                self.log('');
                self.fixURL(opts);
                self.log('LOAD',opts);
				
				if (!opts.key) {
					reject();
					return;
				}
                self.log('Verificando se existe um cache pra '+opts.key+' ('+opts.duration+')...');
				var lastfeed = self.getCache(opts);
				if (lastfeed) {
                    self.log('A informação no cache é válida! Vamos usá-la!');
                    resolve(lastfeed);
                    return;
                } else {
                    self.log('Nope, nenhum cache encontrado e/ou válido.');
                }
				
				var dtNow = new Date().getTime();
				
				if (!self.callbacks[opts.key])
					self.callbacks[opts.key] = [];
				
				self.callbacks[opts.key].push({'resolve': resolve, 'reject': reject});
				
				if (self.running[opts.key]) {
					self.log(opts.url, 'ja esta sendo solicitada, parando por aqui.');
					return;
				}
				
				self.running[opts.key] = true;
				
				self.log('Fazendo um request tipo/GET pra buscar o conteúdo...');
				$.get(opts.url, function (feed) {
					if (feed) {
						
						var newfeed = feed;
						if (opts.type == 'json') {
							newfeed = JSON.stringify(newfeed);
						}
						
						self.lsset(opts.key,'feed',newfeed);
						self.lsset(opts.key,'time',dtNow);
                        self.log('--','Conteúdo do request salvo no cache!');
					}
					
					self.runCallbacks(opts.key, 'resolve', feed);
				}, opts.type).fail(function (err) {
					
					self.runCallbacks(opts.key, 'reject', err);
				});
			});
		});
	};
    
    this.bulk = function(list) {
        
		return new Promise(function (resolve, reject) {
            
            var data = {};
            
            var queue = list.slice(0);
            queue.forEach(function(entry) {
                
                var code = entry.split('/').pop().split('.').shift();
                
                $.get(entry,function(feed) {
                    
                    data[code] = feed;
                    
                    var index = list.indexOf(entry);
                    list.splice(index,1);
                    
                    if (!list.length) resolve(data);
                },'json');
            });
        });
    };
    
	this.runCallbacks = function (key, mode, feed) {
		
		if (!this.callbacks[key])
			this.callbacks[key] = [];
		
		var toCall = this.callbacks[key].slice(0);
		
		this.callbacks[key] = [];
		
		toCall.forEach(function (cbs) {
			var fn = cbs[mode];
			fn(feed);
		});
		
		this.running[key] = false;
	};
	this.getCache = function (opts) {
        self.log('--','Buscando cache pra',opts);
		var dtNow = new Date().getTime();
		var keyfeed = opts.key + '-feed';
		var keytime = opts.key + '-time';
		
		var lastfeed = self.lsget(opts.key,'feed');
		var lasttime = self.lsget(opts.key,'time');
		
		if (!opts.duration) opts.duration = 'default';
		if (opts.duration == 'default') opts.duration = this.defaults[opts.key];
		
		if (lasttime && lastfeed) {
            self.log('--','Existe informação no cache. Será que ela é valida?');
            self.log('--','A informação é:',self.string(lastfeed));
			var dtLast = parseFloat(lasttime);
			var duration = opts.duration;
			var parts = duration
					.replace('year', '*365d').replace('y', '*365d')
					.replace('week', '*7d').replace('w', '*7d')
					.replace('day', '*24h').replace('d', '*24h')
					.replace('hour', '*60m').replace('h', '*60m')
					.replace('min', '*60s').replace('m', '*60s')
					.replace('s', '*1000')
					.split('*');
			var dtDiff = parts.reduce(function (a, b) {
				return a * b;
			}, 1);
			var dtExpires = dtLast + dtDiff;
            var dsCache = (dtExpires < dtNow) ? 'O cache expirou!' : 'O cache ainda é válido por '+formatDuration(dtExpires-dtNow);
            self.log('--',formatDate(dtLast),'-> Data em que o cache foi salvo');
            self.log('--',formatDate(dtExpires),'-> Data em que o cache vai expirar, se baseando na duração duração definida ('+duration+')');
            self.log('--',formatDate(dtNow),'-> Data atual. '+dsCache);
			if (opts.type == 'json')
				lastfeed = JSON.parse(lastfeed);
			
			return (dtExpires > dtNow) ? lastfeed : null;
		}
		return null;
	};
	this.modified = function (opts) {
		return new Promise(function (resolve, reject) {
            self.log('');
            self.fixURL(opts);
            self.log('MODIFIED',opts);
            self.log('Verificando se existe um cache pra '+opts.key+' ('+opts.duration+')...');
            var lastfeed = self.getCache(opts);
            if (lastfeed) {
                self.log('A informação no cache é válida! Vamos usá-la!');
				resolve({'modified': parseFloat(lastfeed), 'old': false});
                return;
            } else {
                self.log('Nope, nenhum cache encontrado e/ou válido.');
            }
			var dtNow = new Date().getTime();
			var keyfeed = opts.key + '-feed';
			var keytime = opts.key + '-time';
            self.log('Fazendo um request type/HEAD pra buscar o Last-Modified...');
			$.ajax({
				type: 'HEAD',
				url: opts.url,
				complete: function (xhr) {
					var dsModified = xhr.getResponseHeader('Last-Modified');
					var dtModified = new Date(dsModified).getTime();
                    self.log('--',formatDate(dtModified),'-> Last-Modified encontrado');
					self.lsset(opts.key,'feed',dtModified);
					self.lsset(opts.key,'time',dtNow);
					
					var dtFile = self.files[opts.key];
                    self.log('--',formatDate(dtFile),'-> Hora do arquivo local');
					
					var old = (!dtFile || dtFile < dtModified) ? true : false;
                    if (old) self.log('--','O arquivo local é muito velho ou não existe.');
                    else self.log('--','O arquivo local já está atualizado.');
					resolve({'modified': dtModified, 'old': old});
				}
			});
		});
	};
	this.zipjson = function (opts) {
		
		return new Promise(function (resolve, reject) {
            self.log('');
            self.fixURL(opts);
            self.log('ZIPJSON',opts);
            self.log('Verificando se existe um cache pra '+opts.key+' ('+opts.duration+')...');
            var lastfeed = self.getCache(opts);
            if (lastfeed) {
                self.log('A informação no cache é válida! Vamos usá-la!');
				resolve(lastfeed);
                return;
            } else {
                self.log('Nope, nenhum cache encontrado e/ou válido.');
            }
            self.log('Fazendo um request JSZipUtils pra buscar o conteúdo do zip...');
			JSZipUtils.getBinaryContent(opts.url, function (err, data) {
				if (err) {
					throw err; 
				}
				JSZip.loadAsync(data).then(function (zip) {
					var file = null;
					for (var i in zip.files) file = zip.files[i];
					zip.file(file.name).async("string").then(function (data) {
						var dtNow = new Date().getTime();
                        self.lsset(opts.key,'feed',data);
                        self.lsset(opts.key,'time',dtNow);
                        self.log('--','Conteúdo do zip salvo no cache!');
						resolve(JSON.parse(data));
					});
				});
			});
		});
	};
	
	
	
	this.log = function () {
		var args = Array.from(arguments);
		args.unshift('[GETTER]');
		console.log.apply(console, args);
	};
    this.string = function(vlr) {
        if (!vlr) return 'NULL';
        if (!vlr.substr) vlr = JSON.stringify(vlr);
        var len = vlr.length;
        var max = 100;
        if (len < max) return vlr;
        var missing = len-max;
        return vlr.substr(0,max)+' (+'+missing+')...';
    };
	this.updateQueryStringParameter = function(uri, key, value) {
		var re = new RegExp("([?&])" + key + "=.*?(&|#|$)", "i");
		if (value === undefined) {
			if (uri.match(re)) {
				return uri.replace(re, '$1$2');
			} else {
				return uri;
			}
		} else {
			if (uri.match(re)) {
				return uri.replace(re, '$1' + key + "=" + value + '$2');
			} else {
				var hash = '';
				if (uri.indexOf('#') !== -1) {
					hash = uri.replace(/.*#/, '#');
					uri = uri.replace(/#.*/, '');
				}
				var separator = uri.indexOf('?') !== -1 ? "&" : "?";
				return uri + separator + key + "=" + value + hash;
			}
		}
	};
};
function formatDate(obj) {
    if (!obj) return '../../.... ..:..:..';
    var tzoffset = (new Date()).getTimezoneOffset() * 60000; 
    var dsfull = new Date(new Date(obj) - tzoffset).toISOString();
    var parts = dsfull.split('T');
    var date = parts[0].split('-');
    return [date[2],date[1],date[0]].join('/')+' '+parts[1].split('.')[0];
}
function formatDuration(ms) {
    var s = Math.floor(ms/1000);
    var i = Math.floor(s/60); s -= i*60;
    var h = Math.floor(i/60); i -= h*60;
    var d = Math.floor(h/24); h -= d*24;
    if (s < 10) s = '0'+s;
    if (i < 10) i = '0'+i;
    if (h < 10) d = '0'+h;
    return d+'d '+h+'h '+i+'m '+s+'s';
}
load_files = function(processConfig) {
	return new Promise(function(resolve) {
		var path = browser.extension.getURL('');
		getter.bulk([path+'/config.json',path+'/vars.json']).then(function(files) {
			getter.config = config = files.config || {};
			getter.env = env = files.vars;
			env.url_cdn = (typeof fullstatic != 'undefined') ? fullstatic : null;
			ambiente = env.ambiente;
			http = (ambiente == 'www') ? 'https' : 'http';
			localStorage.setItem('env', JSON.stringify(env));
			if (processConfig) {
				if (config.resetcache) {
					getter.reset();
				}
			}
			window.S4 = function() {
				return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
			}
			window.guid = function() {
				var inst = ('000' + (parseInt(instalacao) + env.wid).toString()).slice(-3);
				var full = (inst + "-" + S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
				return full;
			}
			var tempid = guid();
			var currid = localStorage.getItem('localid');
			if (!currid || currid.split('-')[0] != tempid.split('-')[0]) {
				localid = tempid;
				localStorage.setItem('localid', localid);
			} else {
				localid = localStorage.getItem('localid');
			}
			resolve();
		});
	});
};