window.runModules = false;
var pushClient = function() {
	this.ls = new baLocalStorage('push');
	this.enabled = true;
	var self = this;
	this.logconnect = [];
	this.tabsPush = [];
    this.statusCode = {};
	this.started = false;
	
	this.online = false;
	this.connecting = false;
	
	this.tperrors = {
		1000: 'client closed own connection',
		1006: 'failed to reach server',
	};
    var stDone = [
        'click',
        'close',
        'expired',
        'muted'];
    var evStatus = {
        'fila':'goFila',
        'tab':'goTab',
        'click':'pushClick',
        'close':'pushClose',
        'expired':'pushExpired'
    };
    
	this.reset = function() {
		this.ls.remove('mypushs');
		this.ls.remove('mutedUntil');
		this.socket.emit('client',{event:'resetMe'});
	};
	
	
	
    
	this.init = function() {
		if (self.started) false;
		self.started = true;
		if (!this.enabled) return self.info('Client not enabled.');
        self.removeDuplicates();
		
		this.env = JSON.parse(localStorage.getItem('env'));
		this.colors = JSON.parse(localStorage.getItem('extColors'));
		this.localid = localStorage.getItem('localid');
		self.addlog(this.localid,'info');
		if (!this.env || !this.colors || !this.localid) return setTimeout(this.init.bind(this),100);
		this.affOrigem = localStorage.getItem('afiliado-origem');
		if (this.affOrigem == 'null') this.affOrigem = null;
		this.ips = [];
		
		if (this.env.ambiente != 'www') this.ips.push('ws://localhost');
		this.ips.push('wss://push.influesolutions.com:443');
		this.ips.push('ws://push.influesolutions.com:80');
		
		this.connect();
	};
    
	this.connect = function() {
		
		var mins = (this.env.ambiente == 'www') ? 20 : 0.1;
		this.recTime = mins*60*1000;
		var recRand = 0.5;
		this.recMin = this.recTime*recRand;
		this.recMax = this.recTime*(1+recRand);
		self.log('new socket',this.ips[0]);
		this.online = false;
		this.connecting = true;
		self.addlog('Connecting to '+this.ips[0]+'...');
        this.timeoutPing = null;
		this.socket = new ClusterWS({
			url: this.ips[0],
			autoReconnect: true,
			autoReconnectOptions: {
				attempts: 0,
				minInterval: self.recMin,
				maxInterval: self.recMax
			}
		});
		var packet_id = 0;
		var callbacks = [];
		this.socket.on('callback',function(feed) {
			self.log('callback',feed.worker,feed.data);
			var fn = callbacks[feed.id];
			if (fn) fn(feed.data);
		});
		this.socket.callback = function(feed,data,callback) {
			this.emit('callback',{'id':feed.packet_id,'data':data},callback);
		};
		this.socket.emit = function(channel,data,callback) {
			data.packet_id = packet_id;
			callbacks[packet_id] = callback;
			packet_id++;
			this.send(channel,data);
		};
		this.socket.on('connect',function() {
			self.addlog('Connected to '+self.ips[0]+'.','success');
            self.ips = [self.ips[0]];
			
			self.online = true;
			self.connecting = false;
			
			self.register();
		});
		this.socket.on('reconnect',function() {
			self.connecting = true;
			self.addlog('Trying to reconnect to '+self.ips[0]+'...');
		});
		this.socket.on('connect_error',function(err) {
			self.addlog('Connection error: '+(self.tperrors[err] || err),'error');
			self.disconnected();
		});
		this.socket.on('disconnect',function(err) {
			self.addlog('Disconnected: '+(self.tperrors[err] || err),'error');
			self.disconnected();
		});
	};
    
	this.register = function() {
		self.log('register');
		if (!self.env || !self.colors || !self.localid) return setTimeout(self.register,500);
		
        var version = chrome.runtime && chrome.runtime.getManifest().version || 0;
		var myData = {'id':self.localid,'wlabel':self.env.wid,'version':version};
        var codespush = self.ls.get('mypushs',[]).map(function(row) { return row.code; });
        var dataEmit = {
            event:'register',
            data: myData,
            codes: codespush
        };
		self.listen();
		self.log('registering');
		self.socket.emit('client',dataEmit,function(feed) {
			if (feed && !feed.status) {
				self.log('register error',feed);
				return setTimeout(self.register,self.recTime);
			}
			self.log('registered',feed);
			if (feed.status) {
				if (feed.data && feed.data.muted) self.ls.set('mutedUntil',feed.data.muted);
                
                if (feed.codes) {
                    
                    var pushs = self.ls.get('mypushs',[]);
                    
                    pushs.forEach(p => (p.done = stDone.indexOf(p.status) >= 0));
                    
                    pushs.forEach(p => p.rodando = (p.custom || feed.codes.indexOf(p.code) >= 0));
                    
                    self.storePushs(pushs);
                }
				
				self.processSend();
				
				self.setReady();
			}
		});
	};
    
	this.setReady = function() {
		clearInterval(this.intervalPing);
        
        var delayPing = 60*60; 
        this.intervalPing = setInterval(function() {
			self.runPing();
        },delayPing*1000);
	};
	
	this.lastPing = {};
	this.runPing = function() {
        var delayWaitPing = 3*60; 
		var dataEmit = {event:'ping'};
		self.lastPing = {pinging: true};
		self.addlog('Pinging server...');
		self.timeoutWaitPing = setTimeout(function() {
			self.lastPing.pinging = false;
			self.addlog('Ping did not return.','error');
			self.socket.disconnect();
		},delayWaitPing*1000);
		var dt1 = new Date().getTime();
		self.socket.emit('client',dataEmit,function(feed) {
			var dt2 = new Date().getTime();
			
			if (feed) {
				
				if (feed.event == 'pong') {
					feed.status = true;
					delete feed.event;
				}
					
				self.lastPing = feed;
				self.lastPing.delay = dt2-dt1;
				self.lastPing.date = new Date().toTimeString().split(' ')[0];
				if (feed.status) {
					self.addlog('Ping received back.','success');
				} else {
					if (feed.error == 'wait_retry') {
						return setTimeout(self.setReady,self.recTime);
					}
				}
			} else {
				self.lastPing = 'NO FEEDBACK';
			}
			clearTimeout(self.timeoutWaitPing);
		});
	};
    
	this.listen = function() {
		if (this.listening) return;
		self.log('listening');
		this.socket.on('client',function(feed) {
			self.log('LISTEN',feed);
			if (feed.event == 'newpush') {
				if (self.affOrigem) feed.data.link += '&aff='+self.affOrigem;
				var flag = self.gotPush(feed.data);
				self.socket.callback(feed,{status:flag});
			}
            if (feed.event == 'ping') {
                self.socket.callback(feed,{status:true});
            }
			if (feed.event == 'unmute') {
				self.ls.remove('mutedUntil');
			}
		});
		this.listening = true;
	};
    
	this.disconnected = function() {
        clearInterval(this.intervalPing);
        clearTimeout(this.timeoutReady);
        clearTimeout(this.timeoutWaitPing);
		this.online = false;
		this.connecting = false;		
		this.listening = false;
		if (this.ips.length > 1) {
			this.socket.events.removeAllEvents();
			this.socket.options = {};
			this.ips.shift();
			this.connect();
		}
	};
    
	this.trySend = function(dataEmit) {
		self.log('trySend',this.online,dataEmit);
        
		if (!this.online) return this.ls.push('tosend',dataEmit);
		this.socket.emit('client',dataEmit,function() { });
	};
    
	this.processSend = function() {
		self.log('processaSend',this.online);
		if (!this.online) return;
		this.ls.get('tosend',[]).forEach(function(dataEmit) { self.trySend(dataEmit); });
		this.ls.set('tosend',[]);
	};
	
	
	
    
    this.getPushByCode = function(code) {
        var pushs = self.ls.get('mypushs',[]);
        return pushs.find(p => p.code == code);
    };
    
    this.setPushByCode = function(code,newdata) {
        var pushs = self.ls.get('mypushs',[]);
        var push = pushs.find(p => p.code == code);
        if (push) {
            for (var atr of Object.keys(newdata)) push[atr] = newdata[atr];
        } else {
            pushs.push(newdata);
        }
        self.storePushs(pushs);
    };
    
    this.setPushDone = function(code,status,sendtabs) {
		self.log('setPushDone',code,status);
        var pushs = self.ls.get('mypushs',[]);
        var push = pushs.find(p => p.code == code);
        if (push) {
            push.done = true;
            push.status = status;
            self.storePushs(pushs);
        }
        if (sendtabs) self.closePushInAllTabs(code);
		this.checkForChangesInStatus();
    };
	
	this.removeDuplicates = function() {
		var pushs = this.ls.get('mypushs',[]);
		var newlista = [];
		var codes = [];
		while (pushs.length) {
			var push = pushs.shift();
            var another = newlista.find(p => p.code == push.code);
            if (!another) newlista.push(push);
		}
        self.storePushs(newlista);
	};
    
    this.storePushs = function(pushs) {
        self.ls.set('mypushs',pushs || []);
    };
	this.deletePushByCode = function(code) {
        var pushs = this.ls.get('mypushs',[]);
		var push = pushs.find(p => p.code == code);
		if (push) {
			var index = pushs.indexOf(push);
			pushs.splice(index,1);
			this.storePushs(pushs);
			this.closePushInAllTabs(code);
			this.deletePushByCode(code);
		}
	};
	this.deletePushByTag = function(tag) {
        var pushs = this.ls.get('mypushs',[]);
		var list = pushs.filter(p => p.tag == tag);
		list.forEach(p => this.deletePushByCode(p.code));
	};
	this.deletePushByLoja = function(loja) {
		loja = parseInt(loja);
        var pushs = this.ls.get('mypushs',[]);
		var list = pushs.filter(p => p.idloja == loja);
		list.forEach(p => this.deletePushByCode(p.code));
	};
	this.deletePushByCategoria = function(categoria) {
		categoria = parseInt(categoria);
        var pushs = this.ls.get('mypushs',[]);
		var list = pushs.filter(p => p.idcategoria == categoria);
		list.forEach(p => this.deletePushByCode(p.code));
	};
    
	this.gotPush = function(data) {
        data.key = data.code+'/'+data.titulo;
		data.imagem = data.imagem && this.env.url_cdn+'/'+data.imagem;
		data.dtreceived = new Date().getTime();
		self.info(data.key,'Recebido.');
		
		self.ls.set('lastcode',data.code);
		var muted = this.ls.get('mutedUntil');
		if (muted) {
			if (muted == 'forever') {
				self.info('O client está silenciado indefinitivamente.');
				return 'muted';
			}
			var dtNow = new Date();
			var timeNow = dtNow.getTime();
			var timeMuted = parseInt(muted);
			if (timeNow < timeMuted) {
                self.info('O client está silenciado até',new Date(timeMuted));
				return 'muted';
			}
		}
        var pushs = this.ls.get('mypushs',[]);
        var push = self.getPushByCode(data.code);
        if (push) {
            if (!push.rodando) {
    			self.info('O push não está mais rodando.');
                return 'done';
            }
            if (push.done) {
                self.info('O push já foi clicado/fechado/mutado antes.');
                return 'done';
            }
            self.info('O push ainda está rodando.');
            return push.status;
        }
		var dtNow = new Date().getTime();
		var qtPassed = dtNow - data.dtreceived;
        if (data.duration != -1 && qtPassed > data.duration) {
            self.info('O push já expirou.');
            return 'expired';
        }
        data.status = 'fila';
        data.rodando = true;
        pushs.push(data);
        self.storePushs(pushs);
		this.showPush(data);
		return true;
	};
    
    this.sendAllPushsToTab = function() {
        var pushs = self.ls.get('mypushs',[]);
        if (!pushs.length) return;
        
        pushs.forEach(function(p) {
            
            if (!p.rodando || p.done) {
                return;
            }
            
            var dtNow = new Date().getTime();
            var qtPassed = dtNow - p.dtreceived;
            if (p.duration != -1 && qtPassed > p.duration) {
                self.setPushDone(p.code,'expired');
                return;
            }
            
            self.showPush(p);
        });
    };
    
	this.showPush = function(data) {
		self.info(data.key,'Tentando exibir.');
		if (!this.currentTab) {
			self.info(data.key,'Sem aba atual, colocando push na fila.');
            return;
		}
        var already = self.tabsPush.find(tp => tp.code == data.code && tp.tab == self.currentTab);
        if (already && !data.again) {
            self.info(data.key,'Aba atual já tem esse push.');
			return;
        }
		var dataSend = {
			event: 'showPush',
			data: data,
			env: this.env,
			colors: this.colors
		};
		self.info(data.key,'Enviando push para aba atual...');
		chrome.tabs.sendMessage(self.currentTab, dataSend, function(feed) {
			
			if (feed) {
                self.info(data.key,'Exibido com sucesso.');
                self.addCodeTab(data.code);
			} else {
                
				self.info(data.key,'goTab sem resposta.');
                self.removeCodeTab(data.code);
			}
		});
	};
    
    this.addCodeTab = function(code,tab) {
        if (!tab) tab = self.currentTab;
        var already = self.tabsPush.find(tp => tp.code == code && tp.tab == tab);
        if (!already) self.tabsPush.push({code:code,tab:tab});
        this.checkPushTabs();
    };
    
    this.removeCodeTab = function(code,tab) {
        if (!tab) tab = self.currentTab;
        var already = self.tabsPush.find(tp => tp.code == code && tp.tab == tab);
        if (already) {
            var index = self.tabsPush.indexOf(already);
            slef.tabsPush.splice(index,1);
        }
        this.checkPushTabs();
    };
    
	this.closePushInAllTabs = function(code) {
		self.log('closePushInAllTabs',code);
        var dataSend = {event:'removePush',code:code};
        var TPs = self.tabsPush.filter(tp => tp.code == code);
		while (TPs.length) {
			self.log('TPs.length',TPs.length);
			var tp = TPs.shift();
			var index = self.tabsPush.indexOf(tp);
			self.tabsPush.splice(index,1);
			chrome.tabs.sendMessage(tp.tab, dataSend,function() { });
		}
        this.checkPushTabs();
	};
    
    this.closeAllPushsInTab = function(tab) {
        var TPs = self.tabsPush.filter(tp => tp.tab == tab);
        while (TPs.length) {
            var row = TPs.shift();
            var index = self.tabsPush.indexOf(row);
            self.tabsPush.splice(index,1);
        }
        this.checkPushTabs();
    };
    
    this.checkPushTabs = function() {
		self.log('checkPushTabs');
        var pushs = self.ls.get('mypushs',[]).filter(p => p.rodando && !p.done);
		self.log('pushs?',pushs.length);
        pushs.forEach(function(push) {
            var anytab = self.tabsPush.find(tp => tp.code == push.code);
			
			
			var newstatus = (anytab) ? 'tab' : !push.status && 'fila';
			if (newstatus) self.setPushByCode(push.code,{status:newstatus});
        });
    };
    
    this.checkForChangesInStatus = function() {
        var pushs = self.ls.get('mypushs',[]);
        var anyChange = false;
        pushs.forEach(function(p) {
            if (p.status != p.laststatus) {
                var ev = evStatus[p.status];
                if (ev) self.trySend({event:ev,code:p.code});
                p.laststatus = p.status;
                anyChange = true;
            }
        });
        if (anyChange) self.storePushs(pushs);
    };
	this.imgCache = {};
	this.getImageData = function(url) {
		return new Promise(resolve => {
			if (self.imgCache[url]) {
				resolve(self.imgCache[url]);
				return;
			}
			var xhr = new XMLHttpRequest();
			xhr.onload = function() {
				var reader = new FileReader();
				reader.onloadend = function() {
					var base64 = reader.result;
					self.imgCache[url] = base64;
					resolve(base64);
				}
				reader.readAsDataURL(xhr.response);
			};
			xhr.open('GET', url);
			xhr.responseType = 'blob';
			xhr.send();
		});
	};
    setInterval(this.checkForChangesInStatus.bind(this),10*1000);
	
	
	
	this.trackEvent = function(data,callback) {
		var event = 'trackEvent';
		self.addlog(JSON.stringify(data)+'...');
		this.socket.emit('client',{event,data},ev => {
			self.addlog(JSON.stringify(data)+'!','success');
		});
		callback(data);
	};
	
	
	
	this.currentTab = null;
    this.currentTab_url = null;
    
	chrome.runtime && chrome.runtime.onMessage.addListener(function(request, sender, callback) {
		
		if (request.event == 'getPushStatus') {
			var mystatus = {
				'online': self.online,
				'connecting': self.connecting,
				'logconnect': self.logconnect,
				'listening': self.listening,
				'ping': self.lastPing
			};
			callback(mystatus);
			return;
		}
		if (request.event == 'sendPingNow') {
			self.runPing();
			callback(true);
			return;
		}
		if (request.event == 'tabClosed') {
            self.closeAllPushsInTab(sender.tab.id);
		}
		if (request.event == 'trackEvent') {
			self.trackEvent(request.data,callback);
			return true;
		}
        
		if (request.event == 'pageVisible') {
			
			self.currentTab = sender.tab.id;
            self.currentTab_url = sender.tab.url;
            
            self.sendAllPushsToTab();
		}
        
		if (request.event == 'pushClick') {
            self.setPushDone(request.code,'click',true);
		}
        
		if (request.event == 'pushClose') {
            self.setPushDone(request.code,'close',true);
		}
        
		if (request.event == 'pushMuted') {
            self.setPushDone(request.code,'muted',true);
			self.evMuted(request.code,request.duration);
		}
        
		if (request.event == 'pushExpired') {
            self.setPushDone(request.code,'expired',true);
        }
        
		if (request.event == 'toggleOption') {
			if (request.code == 'acceptpush' && request.value) {
				if (request.value.flag == true) {
					self.ls.remove('mutedUntil');
					self.trySend({event:'cancelMute'});
				} else {
					var code = self.ls.get('lastcode');
					self.evMuted(code,request.value.duration);
				}
			}
		}
		if (request.event == 'getMuted') {
			var muted = self.ls.get('mutedUntil');
			callback({'muted':muted});
		}
		if (request.event == 'getImageData') {
			self.getImageData(request.url).then(base64 => {
				callback(base64);
			});
			return true;
		}
	});
	this.evMuted = function(code,duration) {
		var parts = duration.split(':');
		var qty = parseInt(parts[0]);
		var type = parts[1];
		var dtExpire = new Date();
		var msec = 1000;
		var mmin = 60*msec;
		var mhour = mmin*60;
		var mday = mhour*24;
		var mweek = mday*7;
		var mmonth = mday*30;
		var myear = mday*365;
		var mults = {
			'sec':msec,
			'min':mmin,
			'day':mday,
			'week':mweek,
			'month':mmonth,
			'year':myear
		};
		var miliseconds = mults[type]*qty;
		dtExpire.setTime(dtExpire.getTime() + miliseconds);
		self.ls.set('mutedUntil',dtExpire.getTime());
		self.trySend({event:'pushMuted', code:code, type:duration, duration:miliseconds});
	};
	
	
	
    this.info = function() {
		var args = Array.from(arguments);
		args.unshift('[PUSH]');
		console.info.apply(console,args);
    };
	this.log = function() {
		var args = Array.from(arguments);
		args.unshift('[PUSH]');
		console.log.apply(console,args);
	};
	this.addlog = function(message,type) {
		var date = new Date().getTime();
		self.logconnect.push({date,message,type});
	};
	
	
	
    var pushs = this.ls.get('mypushs',[]);
    pushs.forEach(function(p) {
        if (!p.done) {
            if (p.status == 'tab') p.status = 'fila';
            if (p.laststatus == 'tab') p.laststatus = 'fila';
        }
    });
    self.storePushs(pushs);
	window.addEventListener('runModules', function() { self.init(); window.runModules = true; });
	if (window.runModules) self.init();
};
client = new pushClient();