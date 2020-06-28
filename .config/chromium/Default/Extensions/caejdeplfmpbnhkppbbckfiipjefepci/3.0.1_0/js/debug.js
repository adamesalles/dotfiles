if (typeof browser === 'undefined') browser = chrome;
class DebugWindow {
	constructor() {
		this.log('constructor');
		this.busy = false;
		this.running = false;
		this.enabled = false;
		this.exturl = browser.extension.getURL('');
		this.queue = [];
		this.checkEnv();
	}
	async checkEnv() {
		this.envData = await getEnvData();
		if (this.envData.debug) this.setup();
	}
	
	async setup() {
		this.log('setup');
		this.enabled = true;		
		await this.loadCSS();
		await this.createDiv();
		await this.configPush();
		this.running = true;
	}
	loadCSS() {
		this.log('loadCSS');
		return loadjscssfile(this.exturl+'css/debug.css','css');
	}
	getDomHtml() {
		this.log('getDomHtml');
		return new Promise(async resolve => {
			while (!$('html').length) await wait(100);
			resolve($('html'));
		});
	}
	async createDiv() {
		this.log('createDiv');
		var $html = await this.getDomHtml();
		return new Promise(async resolve => {
			if (this.busy) {
				while (this.busy) await wait(100);
				return resolve();
			}
			this.busy = true;
			this.$div = $('<div>',{'id':'NmiaKD1xyEIfSvm'}).appendTo($html);
			this.$div.css('position','fixed');
			this.$div.hide();
			this.$div.load(this.exturl+"tpl/debug.html",() => {
				this.fixImages();
				this.addEvents();
				this.addDrag();
				this.loadPosition();
				this.updateFakeButton();
				this.execQueue();
				resolve();
				this.busy = false;
			});
		});
	}
	waitSetup() {
		this.log('waitSetup');
		return new Promise(async resolve => {
			while (this.enabled && !this.running) await wait(100);
			resolve(true);
		});
	}
	confirmPresence() {
		this.log('confirmPresence');
		return new Promise(async resolve => {
			await this.waitSetup();
			while (!this.$div.closest('html').length) await this.createDiv();
			resolve(true);
		});
	}
	
	fixImages() {
		this.log('fixImages');
		this.$div.find('.oQqFT8K65u').attr('src',browser.extension.getURL('/lay/x.png'));
	}
	addEvents() {
		this.log('addEvents');
		this.$div.on('click','.oQqFT8K65u',this.close.bind(this));
		this.$div.on('click','#btnToggleFake',this.toggleFake.bind(this));
		this.$div.on('click','#btnPingNow',this.sendPing.bind(this));
	};
	addDrag() {		
		this.log('addDrag');
		this.$div.draggable({
			handle: ".CMJPeJfNGhyid1PCWw", 
			stop: this.setPosition.bind(this)
		});
	}
	
	setPosition(a,b,c) {
		this.log('setPosition');
		var pos = b.position;
		LS.set('posCupomDebug',pos);
	}
	loadPosition() {
		this.log('loadPosition');
		var pos = LS.get('posCupomDebug');
		if (pos) this.$div.css(pos);
	}
	toggleFake() {
		this.log('toggleFake');
		var flag = this.envData.testeCupons;
		this.envData.testeCupons = newflag =  flag ? 0 : 1;
		browser.runtime.sendMessage({'event':'setCuponsFalsos','newflag':newflag});
		this.updateFakeButton();
	}
	configPush() {
		this.log('configPush');
		setInterval(this.checkPush.bind(this),100);
	}
	sendPing() {		
		this.log('sendPing');
		var $btn = this.$div.find('#btnPingNow');
		$btn.attr('disabled',true);
		setTimeout((ev) => { $btn.attr('disabled',false); },2000);
		browser.runtime.sendMessage({'event':'sendPingNow'});
	}
	checkPush() {
		
		var $title = this.$div.find('.classPushDebug');
		var $data = this.$div.find('.classPushData');
		browser.runtime.sendMessage({'event':'getPushStatus'},data => {
			var status = (data.online) ? 'online' : ((data.connecting) ? 'connecting' : 'offline');
			var $log = $data.find('.logconnect').empty();
			$title.find('.circle').attr('class','circle '+status);
			data.logconnect.forEach(x => {
				var date = new Date(x.date).toLocaleTimeString();
				var $row = $('<div>').text(date+': '+x.message).appendTo($log);
				if (x.type == 'error') $row.css('color','red');
				if (x.type == 'success') $row.css('color','green');
				if (x.type == 'info') $row.css('color','blue');
			});	
		});
	}
	updateFakeButton() {
		this.log('updateFakeButton');
		var $btn = this.$div.find('#btnToggleFake');
		var texto = this.envData.testeCupons ? 'HABILITADOS' : 'DESABILITADOS';
		var color = this.envData.testeCupons ? '#8BC34A' : '#ff9800';
		$btn.text('Cupons de Teste '+texto).css('background-color',color);
	}
	getSection(type,code) {		
		this.log('getSection',type,code);
				
		var keyclass = 'ba-section-'+type+'-'+code;
		var $section = this.$div.find('.'+keyclass);
		if (!$section.length) {			
			var $debuglist = this.$div.find('.Kh6FukSexoEQkoS');									
			$section = $('<div>',{'class':keyclass});
			var $h3 = $('<h3>').text((type+' '+code).toUpperCase()).appendTo($section);
			$('<span>',{'class':'value'}).appendTo($h3);
			$('<code>',{'class':'WJg27qb4wXVMW'}).appendTo($section);
			$section.appendTo($debuglist);
		}
		return $section;
	}
	addQueue() {
		this.log('addQueue');
		var args = Array.from(arguments);
		this.queue.push(args);
	}
	execQueue() {
		this.log('execQueue');
		this.queue.forEach(q => this.setSection.apply(this,q));
	}
	async setSection(type,code,field,value) {
		if (!this.enabled) return;
		if (type == 'regex' && code.indexOf('dominio') >= 0) return;
		if (!this.running) return this.addQueue(type,code,field,value);
		
		this.log('setSection',type,code,field,value);		
		this.$div.show();		
		var $section = this.getSection(type,code);
		var cor = 'gray';
		if (type == 'regex') {
			cor = (value) ? 'green' : 'red';
			$section.find('.value').text('( '+value+' )');
		}
		var dsfield = field;
		if (field == true) dsfield = '';
		var $link = null;
		if (type == 'link') $link = $('<a>',{target:'_blank', href:dsfield, style:'color:blue; border:1px dotted black'}).text('--- clique aqui ---');
		if (type == 'selector') {
			var $el = $(field);
			var txt = $el.text();
			cor = ($el.length || field == 'ENTER') ? 'green' : 'red';
			if (code == 'total') txt = convertePreco(txt);
			$section.find('.value').text('( '+txt+' )');
		}
		var $span = $section.find('.WJg27qb4wXVMW').css('color',cor);
		$span.empty();
		
		if ($link) {
			$span.append($link);
		} else {
			$span.text(dsfield);
		}
	}
	close() {
		this.log('close');
		this.$div.remove();
		this.running = false;
	}
	log() {
		if (!this.enabled) return;
		return;
		var args = Array.from(arguments);
		args.unshift('DebugWindow');
		console.log.apply(this,args);
	}
}
if (typeof(baDebug) == 'undefined') baDebug = new DebugWindow();