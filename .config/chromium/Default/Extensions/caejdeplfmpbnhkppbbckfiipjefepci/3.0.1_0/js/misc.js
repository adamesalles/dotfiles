if (typeof browser === 'undefined') browser = chrome;
ba_console = false;
ba_trust_host = null;
function wait(delay) {
	return new Promise(resolve => {
		setTimeout(resolve,delay);
	});
}
function getEnvData(refresh) {
	return new Promise(resolve => {
		if (typeof(baCupom_ENV) != 'undefined' && !refresh) {
			resolve(baCupom_ENV);
			return;
		}
		browser.runtime.sendMessage({'event':'getEnv'},function(data) {
			baCupom_ENV = (data && data.mode == 'primary') ? data.env : {};
			
			ba_trust_host = baCupom_ENV.host;
			ba_console = baCupom_ENV.debug;
			resolve(baCupom_ENV);
		});
	});
}
function ba_log() {
	if (ba_console) {
		console.log.apply(console,arguments);
	}
}
function ba_info() {
	if (ba_console) {
		console.info.apply(console,arguments);
	}
}
function ba_warn() {
	if (ba_console) {
		console.warn.apply(console,arguments);
	}
}
function ba_clear() {
	if (ba_console) {
	}
}
function strip_tags(e, n) {
    n = (((n || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join("");
    var t = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
        a = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return e.replace(a, "").replace(t, function(e, t) { return n.indexOf("<" + t.toLowerCase() + ">") > -1 ? e : ''; });
}
function convertePreco(e) {
	e = strip_tags(e);
	var trash = ['no boleto','NOW:','a vista','por','Por','POR','Apenas','apenas',':'];
	for (var i = 0; i < trash.length; i++) e = e.replace(trash[i],'');
	e = e.replace(/[^\d.,]/g,'');
	if (0 == isNaN(e)) return parseFloat(e);
	e = e.replace('.','');
	e = e.replace(',','.');
	return parseFloat(e);
}
function agora() {
	var dt = new Date();
	var h = dt.getHours();
	var m = dt.getMinutes();
	var s = dt.getSeconds();
	var ms = dt.getMilliseconds();
	if (h < 10) h = '0'+h;
	if (m < 10) m = '0'+m;
	if (s < 10) s = '0'+s;
	if (ms < 10) ms = '0'+ms;
	if (ms < 100) ms = '0'+ms;
	return '[BA] '+h+':'+m+':'+s+'.'+ms;
}
function baMisc_setDivValues($div,data) {	
	if (!data) data = {};
	var manifest = browser.runtime.getManifest();
	data.nomeplugin = manifest.name;
	data.exturl = browser.extension.getURL('');
	data.laylogo = data.exturl+'lay/logo.png';
	data.layclose = data.exturl+'lay/close.png';
	data.layloadbar = data.exturl+'lay/loadbar-1.gif';
	data.layx = data.exturl+'lay/x.png';
	data.fabullhorn = data.exturl+'lay/fa-bullhorn.svg';
	data.faclose = data.exturl+'lay/fa-close.svg';
	data.faminus = data.exturl+'lay/fa-minus.svg';
	data.faplussquare = data.exturl+'lay/fa-plus-square.svg';
	data.faminussquare = data.exturl+'lay/fa-minus-square.svg';
	if (!data.cdn) data.cdn = baCupom_CDN;
	
	if (!data.storeseo) {
		var storeLS = LS.get('store') || {};
		data.storeseo = storeLS.storeseo;
	}
	data.storeimage = data.cdn+'/lay/logos/marcas_'+data.storeseo+'.gif';
	for (var atr in data) {
		$div.find('[ba-value="'+atr+'"]').text(data[atr]);
		$div.find('[ba-href="'+atr+'"]').attr('href',data[atr]);
		$div.find('[ba-src="'+atr+'"]').attr('src',data[atr]);
		$div.find('[ba-prwidth="'+atr+'"]').css('width',data[atr]+'%');
		$div.find('[ba-bgimg="'+atr+'"]').css('background-image','url('+data[atr]+')');
	}
}
function baMisc_openDiv(page,data,callback) {
	baCupom_addStyle();
	var exturl = browser.extension.getURL('');
	if (!data) data = {};
	data['exturl'] = exturl;
	var $body = $(document.body);
	if ($body.length == 0) return setTimeout(function() { baMisc_openDiv(page,data); },100);
	
	$('#mYe2NBT1inAPZNbU').remove();	
	var $div = $('<div>').attr('id','mYe2NBT1inAPZNbU').appendTo($body);
	$div.load(exturl+"tpl/"+page,function() {
		baMisc_setDivValues($div,data);
		var $bg = $('#yMQHyTPqxOnB9BajTwB');
		if (data.hidebg) {
			if ($bg.length) $bg.hide();
		} else {
			if ($bg.length === 0) $bg = $('<div>').attr('id','yMQHyTPqxOnB9BajTwB').appendTo($body);
			$bg.stop().fadeIn(150);
		}
		$div.stop();
		if (callback) callback($div);
		$div.fadeIn(150);
	});
}
$(document).on('click','#mYe2NBT1inAPZNbU .cRj8DbL0Sk, #mYe2NBT1inAPZNbU .c9yf2iSYour, .WTNOhOeIMotm',function(e) {
	LS.set('flagOK',-1);
	baCupom_closeDiv();
});
function baCupom_closeDiv() {
	ba_info(agora(),'baCupom_closeDiv()');
	$('#yMQHyTPqxOnB9BajTwB').fadeOut(150);
	$('#mYe2NBT1inAPZNbU').fadeOut(150);
	var dtAgora = new Date().getTime();
	LS.set('lastupdate',dtAgora);
	var storeLS = LS.get('store');
	if (storeLS && storeLS.idloja == '2') { 
		var btn = document.querySelectorAll('.modal-gift-card .modal-close')[0];
		if (btn) btn.click();
	}
	var needrefresh = baCupom_needRefresh(storeLS);
	if (needrefresh && storeLS.done) location.reload();
	baCupom_closeErrors();
}
function baEventos_ON(acao,callback) {
	$(window).on('message', function(event) {
		var evOrigin = event.originalEvent.origin;
		var okOrigin = ba_trust_host;
		if (evOrigin.indexOf(okOrigin) >= 0) {
			var evData = event.originalEvent.data;
			if (evData.acao == acao) return callback(evData);
		}
	});
}
function baTrackEvent(event) {
	baTrackEventCustom({event});
}
function baTrackEventLoja(event) {
	var storeLS = LS.get('store');
	var idloja = (storeLS) ? storeLS.idloja : null;
	baTrackEventCustom({event,idloja});
}
function baTrackEventCustom(data) {
	var event = 'trackEvent';	
	browser.runtime.sendMessage({event,data},function(data) {
	});
}
