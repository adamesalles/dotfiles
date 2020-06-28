if (typeof browser === 'undefined') browser = chrome;
baCupom_injectFile('js/xmlrequest.js');
console.cupom = async function() {
	var envData = await getEnvData();
	var args = Array.from(arguments);
	args.unshift('[CUPOM]');
	if (envData.debug) console.log.apply(console,args);
};
console.cupombar = function() {
};
baCheckout = null;
baCupom_execute = true;
baCupom_addedStyle = false;
baCupom_CDN = "https://4e4356b68404a5138d2d-33393516977f9ca8dc54af2141da2a28.ssl.cf1.rackcdn.com";
baCupom_COLORS = {};
baCupom_ENV = {};
baCupom_Timer = 2000;
baCupom_Timer_Custom = {
    19: 4000,
    31: 4000,
	329: 4000,
	409: 6000,
	447: 12000,
	585: 12000 
};
baCupom_WaitSelectorInterval = 1000;
timeoutResultado = null;
baCupom_progressDefault = 'Aguarde enquanto localizamos o melhor cupom para a sua compra...';
baCupom_injectScript('window._alert = window.alert;');
var LS = new baLocalStorage('autocupom');
function getCheckout(callback) {
	var lastUpdate = LS.get('lastupdate');
	var dtAgora = new Date().getTime();
	var dtDiff = (dtAgora-lastUpdate)/1000; 
	if (!lastUpdate || dtDiff > 120) {
		LS.set('store',null);
		LS.set('lastupdate',null);
		LS.set('flagOK',null);
	}
	browser.runtime.sendMessage({'event':'getCheckout'},function(checkout) {
		baCheckout = checkout;
		if (!baCheckout) {
			callback();
			return;
		}
		if (!baCupom_execute) {
			return;
		}
		var storeLS = LS.get('store') || {};
		var ok = LS.get('flagOK');
		if (storeLS.done) {
			if (!storeLS.warned) callback();
			return;
		}
		if (storeLS && baCheckout.flag == "setcodigo") {
			callback();
			return;
		}
		if (baCheckout.flag === 'confirmado' || storeLS.confirmed) {
			if (baCheckout.flag == 'linkcupom' || (baCheckout.href && baCheckout.href != location.href)) {
				var dataEmit = baCheckout;
				dataEmit.event = 'setCheckout';
				dataEmit.flag = "setcodigo";
				browser.runtime.sendMessage(dataEmit,function(flag) {
					var data = {'cdn':baCupom_CDN, 'storeseo':storeLS.storeseo};
					baMisc_openDiv('apply.html',data);
					baCupom_setHref(baCheckout.href);
				});
				return;
			}
		}
		if (ok === -1) {
			callback();
			return;
		}
		if ((baCheckout.flag == 'linkcupom' || storeLS.idloja) && typeof baCheckout.ncupom !== 'undefined') {
			var n = baCheckout.ncupom+1;
			if (n === 0) n = 1;
			if (n > baCheckout.total) n = baCheckout.total;
			var p = n*100/baCheckout.total;
		   baCupom_showProgress();
			if (baCheckout.flag == 'linkcupom') {
				var dtInicial = new Date().getTime();
				var myInterval = setInterval(function() {
					var dtNow = new Date().getTime();
					var dtDiff = dtNow-dtInicial;
					if (document.readyState == 'complete' || dtDiff >= 3000) {
						clearInterval(myInterval);
						var dataEmit = baCheckout;
						dataEmit.flag = baCheckout.flagback;
						dataEmit.event = 'setCheckout';
						delete dataEmit.flagback;
						browser.runtime.sendMessage(dataEmit,function(flag) {
                            baCupom_flow('link de cupom aplicado, voltando pro carrinho');
							baCupom_setHref(dataEmit.href);
						});
					}
				},100);
				callback();
				return;
			}
		}
		callback();
	});
}
function baCupom_addStyle() {
	if (baCupom_addedStyle) return;
	var $body = $('body');
	if (!$body.length) return setTimeout(baCupom_addStyle,50);
	var rules = [];
	rules.push('.s1aZ4kUdfxZ1ZgMBDfX { color:#primary# !important; } ');
	rules.push('.s1aZ4kUdfxZ1ZgMBDfX.ba-outline { outline-color:#primary# } ');
	rules.push('.s1aZ4kUdfxZ1ZgMBDfX.xyIQ2IrVVmxNPg5VCX:hover, .s1aZ4kUdfxZ1ZgMBDfX.xyIQ2IrVVmxNPg5VCX.active { color:#primary_hover# !important; }');
	rules.push('.sdAzBz8Dtu44hKByqRwL { background-color:#primary# !important; }');
	rules.push('.sdAzBz8Dtu44hKByqRwL.xyIQ2IrVVmxNPg5VCX:hover, .sdAzBz8Dtu44hKByqRwL.xyIQ2IrVVmxNPg5VCX.active { background:#primary_hover# !important; }');
	rules.push('.ba-border-primary { border-color:#primary_border# !important }');
	rules.push('.GeRsAYH04Qd { background:#secondary# !important; color:white !important; }');
	rules.push('.GeRsAYH04Qd.xyIQ2IrVVmxNPg5VCX:hover, .GeRsAYH04Qd.xyIQ2IrVVmxNPg5VCX.active { background:#secondary_hover# !important; }');
	rules.push('.ba-color-secondary { color:#secondary# !important;  }');
	rules.push('.ba-color-secondary.xyIQ2IrVVmxNPg5VCX:hover, .ba-color-secondary.xyIQ2IrVVmxNPg5VCX.active { color:#secondary_hover# !important; }');
	rules.push('.ba-color-tertiary { color:#tertiary# !important }');
	rules.push('.ba-color-tertiary.xyIQ2IrVVmxNPg5VCX:hover, .ba-color-tertiary.xyIQ2IrVVmxNPg5VCX.active { color:#tertiary_hover# !important }');
	rules.push('.kFbM7tcdOCjG3UMB { background:#tertiary# !important }');
	rules.push('.ba-bg-tertiary.xyIQ2IrVVmxNPg5VCX:hover, .ba-bg-tertiary.xyIQ2IrVVmxNPg5VCX.active { background:#tertiary_hover# !important }');
	var content = rules.join("\n");
	for (var code in baCupom_COLORS) {
		var hex = baCupom_COLORS[code];
		content = content.split('#'+code+'#').join(hex);
	}
	$('<style>').html(content).appendTo($body);
	baCupom_addedStyle = true;
}
function baCupom_getLojas() {
	browser.runtime.sendMessage({'event':'getSelectorList'},function(stores) {
		if (!stores) {
			return;
		}
		var store = baCupom_getLoja(stores);
		var idloja = (store) ? store.idloja : null;
		browser.runtime.sendMessage({'event':'setLojaTab','idloja':idloja},function(flag) {
			getCheckout(function() {
				baCupom_gotLojas(stores);
			});
		});
	});
}
function baCupom_gotLojas(stores) {
	if (!baCupom_execute) {
		return;
	}
	if (baCheckout.flag == 'linkcupom') {
		return;
	}
	var lastUpdate = LS.get('lastupdate');
	var dtAgora = new Date().getTime();
	var dtDiff = (dtAgora-lastUpdate)/1000; 
	if (!lastUpdate || dtDiff > 120) {
		LS.set('store',null);
	}
	if (location.href.indexOf('shoppingcart.aliexpress.com') >= 0) {
		baCupom_beginApply = baCupomCustom_Aliexpress_confirmApply;
		return baCupomCustom_Aliexpress();
	}
	baCupom_verificaURL(stores);
}
function baCupom_getLoja(stores) {
	for (var idloja in stores) {
		var store = stores[idloja];
		if (store.checkout && store.checkout.url) {
			
			var rexp = new RegExp(store.checkout.url,'i');
			if (location.href === store.checkout.url || rexp.test(location.href)) return store;
		}
	}
}
function baCupom_limpaInput(sucesso) {
	var storeLS = LS.get('store') || {};
	var iLoja = parseInt(storeLS.idloja);
	if (sucesso) {
		if (iLoja == 1) {
			return;
		}
	}
	baCupom_waitSelectors(function() {
		var storeLS = LS.get('store') || {};
		var $input = $(storeLS.checkout.selectorinput);
		$input.val('');
	});
}
function baCupom_verificaURL(stores) {
	if (!baCupom_execute) {
		return;
	}
	var storeLS = LS.get('store') || {};
	if (storeLS.done && !storeLS.warned) {
		clearInterval(baCupom_intervalURL);
		storeLS.warned = true;
		LS.set('store',storeLS);
		var result = storeLS.results[storeLS.nmelhor];
		var data = {'desconto':baCupom_formatPrice(storeLS.precooriginal - result.preco),'symbol':'R$','extra':''};
		baMisc_openDiv('success.html',data);
		baCupom_limpaInput(true);
		return;
	}
	if (baCheckout.flag == 'done' || storeLS.done) {
		var lastUpdate = LS.get('lastupdate');
		var dtAgora = new Date().getTime();
		var dtDiff = (dtAgora-lastUpdate)/1000; 
		if (dtDiff < 60) {
			clearInterval(baCupom_intervalURL);
			return;
		}
	}
	var ok = LS.get('flagOK');
	if (ok === -1) {
		storeLS.removing = false;
	}
	var store = baCupom_getLoja(stores);
	if (store) {
		clearInterval(baCupom_intervalURL);
		var custom = baCupom_Timer_Custom[parseInt(store.idloja)];
		if (custom) baCupom_Timer = custom;
		 if (!storeLS.idloja) LS.set('store',store);
		
		var actualCode = [
			'if (typeof jQuery==\'undefined\') {',
			'	var headTag = document.getElementsByTagName("head")[0];',
			'	var jqTag = document.createElement(\'script\');',
			'	jqTag.type = \'text/javascript\';',
			'	jqTag.src = \''+browser.extension.getURL('')+'js/jquery-3.3.1.min.js\';',
			'	headTag.appendChild(jqTag);',
			'}'
		];
		baCupom_injectScript(actualCode.join(''));
		if (storeLS.confirmed) {
			var data = {'cdn':baCupom_CDN, 'storeseo':storeLS.storeseo};
			return baCupom_waitSelectors(baCupom_getDiscount);
		}
		if (storeLS.removing) {
            baCupom_waitSelectors(baCupom_analizeResults);
            return;
        }
		if (baCheckout.flag == 'checkresult') return baCupom_waitSelectorsValue(baCupom_checkResult);
		return buscaCupons(store);
	}
}
function baCupom_checkUpdateFlag() {
	var lastUpdate = LS.get('lastupdate');
	var dtAgora = new Date().getTime();
	var dtDiff = (dtAgora-lastUpdate)/1000; 
	var ok = LS.get('flagOK');
	var dtLimit = (ok === 1) ? 60 : 600;
	
	
	
	if (lastUpdate && dtDiff < dtLimit) {
		if (ok === 1) {
			
			var storeLS = LS.get('store');
			if (storeLS && storeLS.cupons && storeLS.cupons.length) {
				return 'keepgoing';
			}
		} else {
			
			return 'ribbon';
		}
	} else {
		LS.set('store',null);
		return 'start';
	}
}
function buscaCupons(store) {
	if (!baCupom_execute) {
		return;
	}
	var action = baCupom_checkUpdateFlag();
	if (action === 'keepgoing') {
		return baCupom_waitSelectors(baCupom_getNext);
	}
	if (action === 'ribbon') {
		LS.set('store',store);
		return baCupom_mostraRibbon(store);
	}
	baCupom_getCupomList(store.idloja,function(cupons) {
		store.cupons = cupons;
		LS.set('store',store);
		baCupom_waitSelectors(baCupom_showModalCupons);
	});
}
function baCupom_getVoid() {
	var storeLS = LS.get('store');
	if (!storeLS) return '----';
	if (!storeLS.void) {
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (var i = 0; i < 10; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
		storeLS.void = text;
		LS.set('store',storeLS);
	}
	return storeLS.void;
}
baCupom_cupomListCallbacks = [];
baCupom_atualizandoCupons = false;
function baCupom_getCupomList(idloja,callback) {
	if (!baCupom_execute) return;
    baCupom_cupomListCallbacks.push({'idloja':idloja,'callback':callback});
    if (baCupom_atualizandoCupons) {
        return;
    }
    baCupom_atualizandoCupons = true;
	browser.runtime.sendMessage({'event':'getCupomList','callback':true});
}
browser.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
	
	if (request.event == 'listaCupons') {
		var envData = await getEnvData();
        var queue = baCupom_cupomListCallbacks.slice(0);
        baCupom_cupomListCallbacks = [];
		for (var entry of queue) {
            var rowloja = request.list.find(function(row) { return parseInt(row.idloja) == parseInt(entry.idloja); });
			var unicos = [];
			if (rowloja) {
				rowloja.cupons.forEach(function(c) {
					var outro = unicos.find(u => u.codigo == c.codigo);
					if (!outro) unicos.push(c);
				});
			}
				
			if (!unicos.length && envData.testeCupons && envData.debug) {
				unicos.push({codigo:'FAKE1'});
				unicos.push({codigo:'FAKE2'});
				unicos.push({codigo:'FAKE3'});
			}
            entry.callback(unicos);
        }
        baCupom_atualizandoCupons = false;
	}
});
function baCupom_createRibbon(store,data,callback) {
	baCupom_addStyle();
	if (!data) data = {};
	var $doc = $(document.body);
	var $div = $('<div>').appendTo($doc);
	$div.load(data.exturl+"tpl/ribbon.html",function() {		
		baMisc_setDivValues($div,data);
		
		$('#QL1LsH46hqNuRtV2N').stop().css({'opacity':0,'right':-10}).animate({'opacity':1,'right':10},500);
		$('#QL1LsH46hqNuRtV2N a').click(function(e) {
			e.preventDefault();
			e.stopPropagation();
			LS.set('store',store);
			LS.set('flagOK',1);
			var dtAgora = new Date().getTime();
			LS.set('lastupdate',dtAgora);
			baCupomRibbon_hide(true);
			baCupom_resetMostData().then(function() { if (callback) callback(); });
		});
	});
}
function baCupom_mostraRibbon(store) {
	if (!baCupom_execute) return;
	var exturl = browser.extension.getURL('');
	var data = {'exturl':exturl};
	baCupom_getCupomList(store.idloja,function(cupons) {
		store.cupons = cupons;
		data.qtde = cupons.length;
		data.txtquestion = baCupom_getTextQuestion();
		data.txtbutton = baCupom_getTextConfirm();
		if (!data.qtde) {
			return;
		}
		baCupom_createRibbon(store,data,function(){baCupom_waitSelectors(baCupom_beginApply);});
	});
}
baCupom_cooldownForce = false;
function baCupom_forceDisplayDOM() {
	var storeLS = LS.get('store');
	if (!storeLS) return;
    if (baCupom_cooldownForce) return;
	var iLoja = parseInt(storeLS.idloja);
	var delayWaitForClick = 1000;
	if (iLoja == 1) delayWaitForClick = 15*1000;
	
	var selector = storeLS.checkout.selectorshow;
    if (selector) {
        var el = $(selector);
		baDebug.setSection('selector','show',selector);
        if (el.length) {
            baCupom_cooldownForce = setTimeout(function() { baCupom_cooldownForce = null; },delayWaitForClick);
            el[0].click();
        }
    }
}
function baCupom_closeErrors() {
	var storeLS = LS.get('store');
	if (!storeLS) return;
	var iLoja = parseInt(storeLS.idloja);
    if (iLoja == 114) { 
        var button = document.querySelector('.botao-ok-alert input');
		if (button && button.click) button.click();
    }
	if (iLoja == 203) { 
		var button = document.querySelector('#messageOk');
		if (button && button.click) button.click();
	}
}
function baCupom_waitSelectors(callback) {
	return baCupom_waitSomeSelectors(['total','input','btn'],callback);
}
function baCupom_waitSelectorsValue(callback) {
	return baCupom_waitSomeSelectors(['total'],callback);
}
function baCupom_waitSomeSelectors(waitfor,callback) {
	if (!baCupom_execute) {
		return;
	}
	var storeLS = LS.get('store');
	if (!storeLS) {
		return;
	}
	var list = ['total','input','btn'];
	var flags = {'total':0,'input':0,'btn':0};
	var ready = true;
	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var selector = storeLS.checkout['selector'+item];
		var $el = $(selector);
		flags[item] = (item == 'input' && !selector) || $el.length || (selector == 'ENTER');
		if (waitfor.indexOf(item) >= 0 && !flags[item]) ready = false;
		baDebug.setSection('selector',item,selector);
	}
	if (!ready) {
		baCupom_forceDisplayDOM();
		setTimeout(function() { baCupom_waitSelectors(callback); },baCupom_WaitSelectorInterval);
        first = false;
        return;
	}
	if (callback) callback();
}
function baCupom_resetMostData() {
	return new Promise(function(resolve) {
		if (!baCupom_execute) {
			resolve();
			return;
		}
		var storeLS = LS.get('store');
		baCupom_getPrecoAtual().then(function(newpreco) {
			storeLS.precooriginal = newpreco;
			baCupom_flow('preço original setado! '+storeLS.precooriginal+' (baCupom_resetMostData)');
			storeLS.total = storeLS.cupons.length;
			storeLS.results = [];
			storeLS.ncupom = -1;
			storeLS.done = false;
			storeLS.confirmed = false;
			LS.set('store',storeLS);
			resolve();
		});
	});
}
function baCupom_getTextQuestion() {
	var txts = ['Gostaria de receber descontos nesta compra?','Quer economizar nesta compra?','Quer pagar menos nesta compra?'];
	return txts[Math.floor(Math.random()*txts.length)];
}
function baCupom_getTextConfirm() {
	var txts = ['Quero muito Desconto!','Com certeza!','Sim! Quero pagar menos!'];
	return txts[Math.floor(Math.random()*txts.length)];
}
function baCupom_showModalCupons() {
	if (!baCupom_execute) {
		return;
	}
	baCupom_addStyle();
	baCupom_resetMostData().then(function() {
		var storeLS = LS.get('store');
		var data = {'qtde':storeLS.cupons.length, 'cdn':baCupom_CDN, 'storeseo':storeLS.storeseo,'txtquestion':baCupom_getTextQuestion(),'txtbutton':baCupom_getTextConfirm()};
		if (typeof(storeLS.buscacupons) == 'undefined') storeLS.buscacupons = '1';
		if (data.qtde == 0 && !storeLS.buscacupons) {
			return;
		}
		baTrackEventLoja('testador-show');
		baMisc_openDiv('found.html',data,function($div) {
			if (data.qtde == 1) {
				$div.find('h2 span').text('1 Cupom de Desconto encontrado');
			}
			if (data.qtde == 0) {
				$div.find('h2').text('Quer procurar descontos pra essa loja?');
				$div.find('.NMxWgNkSj7X').html('Sim, quero!');
			}
		});
	});
}
baCupom_urlStoreTrack = null;
function baCupom_getStoreTrack() {
	return new Promise(async resolve => {
		var envData = await getEnvData();
		var storeLS = LS.get('store');
		var storeTrack = null;
		if (!storeLS.cupons) storeLS.cupons = [];
		var possiveis = storeLS.cupons.filter(x => x.link && x.link.split('.').length >= 2);
		var exclusivo = possiveis.find(x => x.exclusivo);
		if (exclusivo) {
			storeTrack = exclusivo.link;
		} else {
			storeTrack = 'https://'+envData.host+'/tracking?url='+encodeURIComponent(storeLS.url)+'&zorigem=testador';
		}
		var storeType = baCupom_getStoreType(storeLS);
		var fnTrack = window['baCupom_getStoreTrack_'+storeType];
		if (fnTrack) return fnTrack(storeTrack,resolve);
		resolve(storeTrack);
	});
}
function baCupom_beginApply() {
	if (!baCupom_execute) return;
    var storeLS = LS.get('store');
	LS.set('flagOK',1);
    LS.remove('flow');
    baCupom_flow('beginApply');
	baCupom_getStoreTrack().then(function(track) {
		baCupom_urlStoreTrack = track;
		var cupons = storeLS.cupons || [];
		if (!cupons.length) {
			
			baCupom_showVerifying();
			var dataEmit = {event:'getCupomListForced'};
			
			baCupom_cupomListCallbacks.push({
				'idloja': storeLS.idloja,
				'callback': function(cupons) {
					
					storeLS.cupons = cupons;
					LS.set('store',storeLS);
					if (cupons.length) {
						
						baCupom_waitSelectors(baCupom_showModalCupons);
					} else {
						
						baCupom_waitSelectors(function() {
							baCupom_openPopunder(baCupom_urlStoreTrack,function() {
								
								baCupom_showNoneByStore();
							},7*1000);
						});
					}
				}
			});
			browser.runtime.sendMessage(dataEmit,function(flag) {
			});
			return;
		}
		baCupom_getPrecoAtual().then(function(newpreco) {
			storeLS.precooriginal = newpreco;
			baCupom_flow('primeiro preço encontrado! '+newpreco);
			LS.set('store',storeLS);
			var dtAgora = new Date().getTime();
			LS.set('lastupdate',dtAgora);
			baCupom_showProgress();
			baCupom_getNext();
		});
	});
}
function baCupom_formatPrice(n, c, d, t) {
	c = isNaN(c = Math.abs(c)) ? 2 : c,
	d = (typeof d === 'undefined') ? "," : d,
	t = (typeof t === 'undefined') ? "." : t,
	s = n < 0 ? "-" : "",
	i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
	j = (j = i.length) > 3 ? j % 3 : 0;
	return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
}
function baCupom_showProgress() {
	if (!baCupom_execute) return;
	var storeLS = LS.get('store');
	var n = storeLS.ncupom+1;
	if (n <= 0) n = 1;
	if (n > storeLS.total) n = storeLS.total;
	var p = n*100/storeLS.total;
	var data = {'action':'Aplicando', 'total':storeLS.total, 'ncupom':n, 'prcupom':p, 'cdn':baCupom_CDN, 'storeseo':storeLS.storeseo};
	if (storeLS.nmelhor >= 0) {
		var diff = baCupom_formatPrice(storeLS.precooriginal - storeLS.melhorpreco);
		storeLS.progress = 'Já encontramos um desconto de  R$ '+diff+'! Aguarde só mais um pouquinho enquanto analisamos os outros cupons...';
	} else {
		storeLS.progress = baCupom_progressDefault;
	}
	data.texto = storeLS.progress;
	data.progresso = '?';
	
	var progresso = baCupom_getListProgress();
	baMisc_openDiv('progress.html',data,function($div) {
		var $progresso = $div.find('#p-progresso').empty();
		progresso.forEach($div => {
			$progresso.append($div);
		});
	});
	LS.set('store',storeLS);
}
function baCupom_getListProgressDiv(divclass,imageurl,spantext) {
	var exturl = browser.extension.getURL('');
	
	var $div = $('<div>',{'class':'NZ5Ny5lffhXXtaF'}).addClass(divclass);
	var $img = $('<img>',{'src': exturl+'lay/'+imageurl});
	var $span = $('<span>').text(spantext);
	$div.append($img);
	$div.append($span);
	return $div;
}
function baCupom_getListProgress() {
	var storeLS = LS.get('store');
	var aComDesconto = [];
	var aSemDesconto = [];
	if (!storeLS || !storeLS.results) {
		baCupom_resetMostData().then(baCupom_begin);
		return;
	}
	storeLS.results.forEach(function(r) {
		var vDesconto = parseFloat(storeLS.precooriginal - r.preco);
		if (vDesconto < 0) vDesconto = 0;
		vDesconto = Math.round(vDesconto * 100) / 100;
		var sDesconto = baCupom_formatPrice(vDesconto);
		if (vDesconto > 0) {
			var $div = baCupom_getListProgressDiv('tU6J4DR3qwFxfY','fa-check.svg',r.codigo+' (R$ '+sDesconto+' de desconto)');
			aComDesconto.push($div);
		} else {			
			var $div = baCupom_getListProgressDiv('AWhUO8bN9xVRcgtE','fa-close-black.svg',r.codigo);
			aSemDesconto.push($div);
		}
	});
	var aProgresso = [];
	aComDesconto.forEach(div => aProgresso.push(div));
	if (aSemDesconto.length > 5) {
		var $div = baCupom_getListProgressDiv('AWhUO8bN9xVRcgtE','fa-close-black.svg','...');
		aProgresso.push($div);
		aSemDesconto = aSemDesconto.slice(-4);
	}
	aSemDesconto.forEach(div => aProgresso.push(div));
	var c = storeLS.cupons[storeLS.ncupom];
	if (c) {
		var $div = baCupom_getListProgressDiv('oTZdbx3zVyOydmZItN','fa-gear.svg',c.codigo);
		aProgresso.push($div);
	}
	return aProgresso;
}
function baCupom_getNext() {
	if (!baCupom_execute) return;
	var storeLS = LS.get('store');
	var cupom = storeLS.cupons[storeLS.ncupom];
	if (storeLS.ncupom < 0) {
		cupom = {'codigo':baCupom_getVoid()};
	}
	baCupom_showProgress();
	if (!cupom) {
		baCupom_analizeResults();
        return;
	}
	if (storeLS.confirmed) {
		return;
	}
	baCupom_apply2check();
}
function baCupom_apply2check() {
	baCupom_apply().then(function(acao) {
        if (acao) {
			var multi = 1;
			if (acao == 'link') multi = 6;
			if (acao == 'ready') multi = 0.01;
            timeoutResultado = setTimeout(baCupom_checkResult,baCupom_Timer*multi);
        }
    });
}
baCupom_justRemoved = false;
baCupom_firstApply = true;
function baCupom_apply(fakecupom,force) {
    return new Promise(function(resolve) {
        if (!baCupom_execute && !force) return;
        var storeLS = LS.get('store');
        var napply = (storeLS.confirmed || storeLS.done) ? storeLS.nmelhor : storeLS.ncupom;
        var cupom = fakecupom || storeLS.cupons[napply];
        var voidcode = baCupom_getVoid();
        if (!cupom) cupom = {'codigo':voidcode};
		if (cupom.codigo == voidcode) {
			cupom.exclusivo = 1;
			cupom.link = baCupom_urlStoreTrack;
		} else {
			cupom.exclusivo = 0;
		}
        baCupom_flow('aplicando cupom '+cupom.codigo);
        if (baCupom_justRemoved) {
            baCupom_justRemoved = false;
        } else {
            baCupom_flow('tentando remover cupom (pra tentar aplicar o atual)');
			var newFlag = (cupom.codigo != voidcode) ? 'setcodigo' : null;
			if (storeLS.done) newFlag = null;
            baCupom_tentaRemoverCupom(storeLS,cupom,newFlag).then(function(removed) {
                baCupom_justRemoved = true;
                var timeout = 0;
                if (removed) {
                    timeout = 5000;
                }
                setTimeout(function() { baCupom_apply(fakecupom,force).then(resolve); },timeout);
            });
            return;
        }
        var acao = '';
        if (!acao && !cupom.codigo) acao = 'link';
        if (!acao && cupom.codigo && cupom.exclusivo) acao = 'link';
        if (!acao && cupom.codigo) acao = 'codigo';
        if (baCheckout.flag == 'setcodigo' || baCheckout.flag == 'confirmado') acao = 'codigo';
        if (acao == 'link') {
            var flagback = (cupom.codigo) ? 'setcodigo' : 'checkresult';
            var dataEmit = {'event':'setCheckout', 'href':location.href, 'flag':'linkcupom', 'flagback':flagback, 'total':storeLS.total, 'ncupom':storeLS.ncupom};
            browser.runtime.sendMessage(dataEmit,function(flag) {
                if (!flag) return;
                baCupom_flow('vai link cupom '+cupom.codigo);
                baCupom_goLinkCupom(cupom);
            });
        }
        if (acao == 'codigo') {
            baCupom_injectScript('window.alert = function() {};');
			var iLoja = parseInt(storeLS.idloja);
			
            if (iLoja == 31 && cupom.codigo != voidcode && baCupom_firstApply) {
                baCupom_firstApply = false;
                baCupom_fastshop_esperaFrete(function() { baCupom_apply(fakecupom,force).then(resolve); });
                return;
            }
			var dataEmit = {'event':'setCheckout', 'flag':'checkresult', 'total':storeLS.total, 'ncupom':storeLS.ncupom, 'href':location.href};
            browser.runtime.sendMessage(dataEmit,function(flag) {
				var storeType = baCupom_getStoreType(storeLS);
				var custom_apply = window['baCupom_apply_'+storeType];
				if (custom_apply) {
					var ok = custom_apply(cupom,resolve);
					if (ok) return;
				}
				if (flag || cupom.codigo == baCupom_getVoid()) {
					baCupom_flow('set cupom & click '+cupom.codigo);
					var time = 100;
					if (iLoja == 11) time = 1000; 
					if (iLoja == 15) time = 1500; 
					baCupom_waitSelectors(function() {
								
						var options = {
							'input': storeLS.checkout.selectorinput.replace(/"/g,'\\"'),
							'button': storeLS.checkout.selectorbtn.replace(/"/g,'\\"'),
							'codigo': cupom.codigo,
							'delay': time
						};
						
						CustomEvents.click(options).then(data => {					
							resolve(acao);
						});
					});
				} else {
					resolve(acao);
				}
            });
            return;
        }
        resolve(acao);
    });
}
function baCupom_tentaRemoverCupom(storeLS,cupom,newFlag) {
    return new Promise(function(resolve) {
        if (!storeLS.checkout.selectorremove) {
            return resolve(false);
        }
        var aCode = [
            'var btn = document.querySelector("'+storeLS.checkout.selectorremove.replace(/"/g,'\\"')+'");',
            'if (btn) btn.click();',
            'if (btn) btn.dispatchEvent(new Event("click"));'
        ];
        var sCode = aCode.join("\n");
        var $input = $(storeLS.checkout.selectorinput);
        var button = document.querySelector(storeLS.checkout.selectorremove);
        if (!button) {
            resolve(false);
            return;
        }
        if (!cupom) cupom = {codigo:$input.val()};
        var lojasRemoveDurante = [
			31, 
			35, 
			231, 
			327, 
		];
        var lojasRemoveTodos = [
		];
		var iLoja = parseInt(storeLS.idloja);
        if (lojasRemoveDurante.indexOf(iLoja) >= 0 || cupom.codigo == baCupom_getVoid()) {
            baCupom_flow('remove cupom da página ('+$input.val()+')');
            if (newFlag) {
                var dataEmit = baCheckout;
                dataEmit.event = 'setCheckout';
                dataEmit.flag = newFlag;
                storeLS.done = false;
                LS.set('store',storeLS);
                browser.runtime.sendMessage(dataEmit,function() {
                    baCupom_injectScript(sCode);
                    setTimeout(function() {
                        if (lojasRemoveTodos.indexOf(iLoja) >= 0) {
                            baCupom_tentaRemoverCupom(storeLS,cupom,newFlag).then(function(result) {
                                resolve(result);
                            });
                        } else {
                            resolve(true);
                        }
                    },1000);
                });
            } else {
                baCupom_injectScript(sCode);
                return resolve(true);
            }
        } else {
            resolve(false);
        }
    });
}
function baCupom_showFound() {
	if (!baCupom_execute) return;
	var storeLS = LS.get('store');
	var result = storeLS.results[storeLS.nmelhor];
	var data = {'desconto':baCupom_formatPrice(storeLS.precooriginal - result.preco), 'cdn':baCupom_CDN, 'storeseo':storeLS.storeseo};
	baMisc_openDiv('discount.html',data);
}
function baCupom_showNoneByStore() {
	baCupom_flow('baCupom_showNoneByStore');
	baCupom_showMessage({
		title: 'Ops, você já tem o melhor preço!',
		content: 'Procuramos, mas não encontramos nenhum cupom para esta loja. Fique tranquilo que assim que encontramos, colocaremos aqui para você.',
		button: 'Voltar para a minha compra',
		onButton() {
			baCupom_closeDiv();
		}
	});
}
function baCupom_showVerifying() {
	baCupom_flow('baCupom_showVerifying');
	baCupom_showMessage({
		title: 'Procurando cupons...',
		bar: 100,
		button: 'Cancelar',
		onButton() {
			baCupom_callbackPopunder = function() { };
			baCupom_closeDiv();
		}
	});
}
function baCupom_showNone() {
	baCupom_flow('baCupom_showNone');
	baCupom_showMessage({
		title: 'Testes Finalizados',
		content: 'Você já possui o melhor preço!',
		button: 'Voltar para a minha compra',
		onButton() {
			baCupom_closeDiv();
		}
	});
}
function baCupom_showMessage(data) {
	baCupom_flow('baCupom_showMessage',data);	
	
	if (!baCupom_execute) {
		baCupom_flow('not execute!');
		return;
	}
	var storeLS = LS.get('store');
	if (!data) data = {};
	if (!data.cdn) data.cdn = baCupom_CDN;
	if (!data.storeseo) data.storeseo = storeLS.storeseo;
	baMisc_openDiv('message.html',data,function($div) {
		if (typeof data.title == 'undefined') $div.find('.TqH1lyg3McVT3DPgiYW').hide();
		if (typeof data.content == 'undefined') $div.find('.cxJJx4jgWeBoz').hide();
		if (typeof data.bar == 'undefined') $div.find('.Ls1zFgpOuru').hide();
		if (typeof data.button == 'undefined') $div.find('.g816mFB26mQD2V0').hide();
		if (data.onButton) $div.find('.g816mFB26mQD2V0').click(data.onButton);
	});
}
function baCupom_goLinkCupom(cupom,callback) {
	var url = cupom.link;
	baCupom_openPopunder(url,callback);
}
baCupom_callbackPopunder = null;
baCupom_timeoutPopunder = null;
function baCupom_openPopunder(url,callback,timeout) {
	baCupom_callbackPopunder = callback;
	var storeLS = LS.get('store');
	if (!storeLS.ativocupons) {
		baCupom_callbackPopunder = function() {
			clearTimeout(timeoutResultado);
			baCupom_checkResult();
		};
		setTimeout(function() { baCupom_popunderClosed(); },1000);
		return;
	}
	clearTimeout(baCupom_timeoutPopunder);
	if (timeout) {
		baCupom_timeoutPopunder = setTimeout(function() {
			baCupom_callbackPopunder();
			baCupom_callbackPopunder = function() { };
		},timeout);
	}
	var dataEmit = {'event':'open_popunder','url':url};
	browser.runtime.sendMessage(dataEmit);
}
function baCupom_popunderClosed() {
	if (!baCupom_execute) return;
	if (baCupom_callbackPopunder) return baCupom_callbackPopunder();
	var storeLS = LS.get('store') || {};
	var total = storeLS.cupons && storeLS.cupons.length || 0;
	browser.runtime.sendMessage({'event':'getCheckout'},function(checkout) {
		var dataEmit = checkout;
		dataEmit.flag = checkout.flagback;
		dataEmit.event = 'setCheckout';
		dataEmit.total = total;
		delete dataEmit.flagback;
		var canReload = baCupom_canStartReloading(storeLS);
		browser.runtime.sendMessage(dataEmit,function() {
			if (canReload) {
				location.reload();
			} else {
				baCupom_analizeResults();
			}
		});
	});
}
function baCupom_setHref(url) {
	location.href = url;
}
function baCupom_closeSelf() {
	window.close();
}
function baCupom_injectScript(actualCode) {
	var script = document.createElement('script');
	script.innerHTML = actualCode;
	(document.head||document.documentElement).appendChild(script);
	script.remove();
}
function baCupom_injectFile(fileName) {
	var script = document.createElement('script');
	script.src = browser.extension.getURL(fileName);
	(document.head||document.documentElement).appendChild(script);
	script.remove();
}
function baCupom_getPrecoAtual(cupom) {
	var storeLS = LS.get('store');
	var storeType = baCupom_getStoreType(storeLS);
	var custom_get = window['baCupom_getPrecoAtual_'+storeType];
	if (custom_get) return custom_get(cupom);
	return new Promise(function(resolve) {
		var $span = $(storeLS.checkout.selectortotal);
		var newpreco = convertePreco($span.text());
		resolve(newpreco);
	});
}
var baCupom_evInject = 0;
function baMisc_getPageVariable(varName) {
	return new Promise(function(resolve) {
		baCupom_evInject++;
		var evFn = "fnSendVar"+baCupom_evInject;
		var evKey = 'evInject'+baCupom_evInject;
		window.addEventListener(evKey,function(e) {
			if (e.detail) {
				resolve(e.detail);
			}
		});
		var f = function _evFn() {
			if (typeof _varName == 'undefined') return setTimeout(_evFn,100);
			
			window.dispatchEvent(new CustomEvent('_evKey',_varName));
			window.dispatchEvent(new CustomEvent('_evKey',{detail:_varName}));
		};
		var dsf = f.toString();
		dsf = dsf.split('_evFn').join(evFn);
		dsf = dsf.split('_evKey').join(evKey);
		dsf = dsf.split('_varName').join(varName);
		baCupom_injectScript(dsf+" "+evFn+"();");
	});
}
function baCupom_checkResult() {
	baCupom_injectScript('window.alert = window._alert;');
	if (!baCupom_execute) return;
	baCupom_closeErrors();
	var storeLS = LS.get('store');
	clearTimeout(timeoutResultado);
	if (!storeLS.cupons) {
		buscaCupons(storeLS);
		return;
	}
	var cupom = storeLS.cupons[storeLS.ncupom];
	var dtAgora = new Date().getTime();
	LS.set('lastupdate',dtAgora);
	baCupom_getPrecoAtual(cupom).then(function(newpreco) {
		storeLS = LS.get('store');
		storeLS.precoatual = newpreco;
		if (cupom && cupom.codigo == baCupom_getVoid()) {
			baCupom_flow('cupom void');
			baCupom_flow('atualizando preço original! '+newpreco);
			storeLS.precooriginal = newpreco;
		} else {
			var flowed = false;
			baCupom_flow('newpreco '+newpreco+' vs precooriginal '+storeLS.precooriginal);
			if (newpreco > storeLS.precooriginal) {
				baCupom_flow('aparentemente removemos um cupom que estava afetando o preço original');
				baCupom_flow('atualizado preço original! '+newpreco);
				storeLS.precooriginal = newpreco;
				storeLS.melhorpreco = newpreco;
				flowed = true;
			}
			if (!storeLS.melhorpreco) {
				baCupom_flow('primeiro melhor preço! '+newpreco);
				storeLS.melhorpreco = newpreco;
				flowed = true;
			}
			if (newpreco < storeLS.melhorpreco) {
				baCupom_flow('novo melhor preço! '+newpreco);
				storeLS.nmelhor = storeLS.ncupom;
				storeLS.melhorpreco = newpreco;
				LS.set('store',storeLS);
				flowed = true;
			}
			if (!flowed) baCupom_flow('preço encontrado '+newpreco);
		}
		if (storeLS.ncupom >= 0) {
			if (newpreco == storeLS.lastpreco) {
				newpreco = storeLS.precooriginal;
			} else {
				storeLS.lastpreco = newpreco;
			}
			var cupom = storeLS.cupons[storeLS.ncupom];
			if (cupom) storeLS.results.push({'codigo':cupom.codigo,'preco':newpreco});
			for (r of storeLS.results) {
			}
		}
		if (storeLS.confirmed || storeLS.done) {
			storeLS.confirmed = false;
			storeLS.done = true;
			if (!storeLS.warned) {
				if (storeLS.precoatual != storeLS.melhorpreco && !storeLS.retrymelhorpreco) {
					storeLS.retrymelhorpreco = true;
					LS.set('store',storeLS);
					baCupom_getDiscount();
					return;
				}
				storeLS.warned = true;
				LS.set('store',storeLS);
				var result = storeLS.results[storeLS.nmelhor];
				var data = {'desconto':baCupom_formatPrice(storeLS.precooriginal - result.preco),'symbol':'R$','extra':''};
				
				baTrackEventLoja('testador-success');
				baMisc_openDiv('success.html',data);
				baCupom_limpaInput(true);
			} else {
				LS.set('store',storeLS);
				baCupom_closeDiv();
			}
		} else {
			storeLS.ncupom++;
			LS.set('store',storeLS);
			var tmOut = 1000;
			var iLoja = parseInt(storeLS.idloja);
			if (iLoja == 14) tmOut = 10;
			setTimeout(function() { baCupom_getNext(); },tmOut);
		}
	});
}
function baCupom_analizeResults() {
	if (!baCupom_execute) return;
	var storeLS = LS.get('store');
	clearTimeout(timeoutResultado);
	var menorPreco = storeLS.precooriginal;
	storeLS.nmelhor = -1;
	var dtAgora = new Date().getTime();
	LS.set('lastupdate',dtAgora);
	for (var i = 0; i < storeLS.results.length; i++) {
		var r = storeLS.results[i];
		if (r.preco < menorPreco) {
			menorPreco = r.preco;
			storeLS.nmelhor = i;
		}
	}
	LS.set('store',storeLS);
	if (storeLS.nmelhor >= 0) {
		storeLS.removing = true;
		LS.set('store',storeLS);
		baCupom_confirm();
	} else {
		LS.set('store',storeLS);
		browser.runtime.sendMessage({'event':'setCheckout'},function(flag) {
            storeLS.done = true;
            storeLS.warned = true;
            LS.set('store',storeLS);
            baCupom_flow('baCupom_analizeResults não achou um melhorcupom');
            baCupom_showNone();
            baCupom_limpaInput();
		});
	}
}
function baCupom_confirm() {
	if (!baCupom_execute) return;
	$('#mYe2NBT1inAPZNbU').fadeOut(150);
	var storeLS = LS.get('store');
	var dtAgora = new Date().getTime();
	LS.set('lastupdate',dtAgora);
	if (storeLS.nmelhor >= 0) {
		storeLS.confirmed = true;
        if (baCupom_justRemoved) {
            baCupom_justRemoved = false;
        } else {
            baCupom_tentaRemoverCupom(storeLS).then(function(removed) {
				baCupom_justRemoved = true;
                if (removed) {
                    setTimeout(function() {
                        baCupom_confirm();
                    },3000);
                } else {
                    baCupom_confirm();
				}
            });
			return;
        }
		LS.set('flagOK',1);
		LS.set('store',storeLS);
		var cupom = storeLS.cupons[storeLS.nmelhor];
        baCupom_flow('vai link melhor cupom '+cupom.codigo);
		var dataEmit = {'event':'setCheckout', 'ncupom':storeLS.nmelhor, 'href':location.href, 'flag':'confirmado'};
		browser.runtime.sendMessage(dataEmit,function(flag) {
			if (!flag) return;
			baCupom_apply2check();
			return;
			baCupom_goLinkCupom(cupom,function() {
				var dataEmit = {'event':'setcodigo', 'ncupom':storeLS.nmelhor, 'href':location.href, 'flag':'confirmado'};
				browser.runtime.sendMessage(dataEmit,function(flag) {
					location.reload();
				});
			});
		});
	} else {
		LS.set('flagOK',0);
		LS.set('store',null);
		$('#mYe2NBT1inAPZNbU').stop().hide();
		$('#yMQHyTPqxOnB9BajTwB').stop().hide();
		baCupom_execute = false;
		clearTimeout(timeoutResultado);
		browser.runtime.sendMessage({'event':'setCheckout'},function(flag) {
			if (!flag) return;
			storeLS.done = true;
			storeLS.warned = true;
			LS.set('store',storeLS);
            baCupom_flow('baCupom_confirm não achou um melhorcupom');
            baCupom_showNone();
			baCupom_limpaInput();
		});
	}
}
function baCupom_getDiscount() {
	if (!baCupom_execute) return;
	var storeLS = LS.get('store');
	if (storeLS.confirmed || storeLS.done) {
		storeLS.confirmed = false;
		storeLS.done = true;
		LS.set('store',storeLS);
	}
	baCupom_apply();
	clearTimeout(timeoutResultado);
	timeoutResultado = setTimeout(baCupom_checkResult,baCupom_Timer);
}
function baCupom_stop() {
	baCupom_closeDiv();
	browser.runtime.sendMessage({'event':'setCheckout'},function(flag) {
		if (!flag) return;
		baCupom_apply({'codigo':baCupom_getVoid()});
	});
}
$(window).on('beforeunload',function() {
	clearTimeout(timeoutResultado);
});
$(window).on('keydown',function(e) {
	if (e.keyCode == 113) { 
		if (baCheckout.ambiente != 'www') LS.clear();
	}
});
$(document).on('click','#mYe2NBT1inAPZNbU [act="NHjCCy3jKbNtib9Ma6dW"]',function() {
	baCupom_confirm();
});
$(document).on('click','#mYe2NBT1inAPZNbU [act="KA3z9UkxekIw"]',function() {
	baCupom_closeDiv();
});
$(document).on('click','#mYe2NBT1inAPZNbU [act="ooajqpgZdjEDyeTg7dwn"]',function() {
	baCupom_beginApply(true);
});
function baCupomRibbon_hide(instant) {
	ba_info(agora(),'baCupomRibbon_hide()');
	var $div = $('#QL1LsH46hqNuRtV2N').parent('div');
	if (instant) $div.hide();
	else $div.fadeOut(200);
}
$(document).on('click','#QL1LsH46hqNuRtV2N .oQqFT8K65u',function(e) {
	baCupomRibbon_hide(true);
});
function baCupom_begin() {
	var delay = 750;
    baCupom_flow(location.href);
    var fluxo = LS.get('flow') || [];
    fluxo.forEach(function(text,i) {
		
    });
	baCupom_addStyle();
    if (baCupom_shouldRun()) {
        setTimeout(function() { baCupom_getLojas(); },delay);
    } else {
    }
}
function baCupom_shouldRun() {
    var url = location.href;
    if (url.indexOf('/cgi-local/site/carrinho/cupom_desconto.cgi') >= 0) return;
    return true;
}
async function baCupom_flow(msg) {
	var envData = await getEnvData();
    if (envData.debug) LS.push('flow',msg);
}
var ba_Cupom_currentURL = null;
function baCupom_getEnv() {
	return new Promise(resolve => {		
		browser.runtime.sendMessage({'event':'getEnv'},function(data) {
			resolve(data);
		});
	});
}
function baCupom_watchURL() {
	
	if (ba_Cupom_currentURL != location.href) {
		ba_Cupom_currentURL = location.href;
		browser.runtime.sendMessage({'event':'getEnv'},function(data) {
			if (!data || data.mode != 'primary') return;
			baCupom_ENV = data.env;
			baCupom_COLORS = data.colors;
			baCupom_begin();
		});
	}
}
var baCupom_intervalURL = setInterval(baCupom_watchURL,500);
$(window).on('beforeunload', function() { clearInterval(baCupom_intervalURL); });
