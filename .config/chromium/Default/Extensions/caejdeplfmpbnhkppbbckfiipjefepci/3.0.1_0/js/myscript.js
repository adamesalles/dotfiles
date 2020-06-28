var fnAppendChiid = Element.prototype.appendChild;
function baAppend(object,parent) {
	if (!parent) {
		var body = document.querySelector('body');
		var head = document.querySelector('head');
		parent = head || body;
	}
	fnAppendChiid.apply(parent,[object]);
}
function fnExec() {
	var dd = document.domain;
	dd = dd.replace('www.','');
	if (typeof jQuery !== 'undefined') {
		var _remove = jQuery.fn.remove;
		function podeRemover(el) {
			return (!el.id || (el.id != 'HWSSbE5eo2' && el.id != 'au4O8MJyTH5KrbwVG'));
		}
		if (dd == 'epocacosmeticos.com.br' || dd == 'netshoes.com.br') {
			jQuery.fn.extend({ remove: function(selector, keepData) { for(var i = 0, len = this.length; i < len; i++) { if(this[i] && this[i].parentElement) { var el = this[i]; if (podeRemover(el)) _remove.call( jQuery(el), selector, keepData ); } } return this; } });
		} else {
			jQuery.fn.extend({ remove: function() { for(var i = 0, len = this.length; i < len; i++) { if(this[i] && this[i].parentElement) { var el = this[i]; if (podeRemover(el)) this[i].parentElement.removeChild(this[i]); } } return this; } });
		}
		if (dd == 'saraiva.com.br') {
			var _removeChild = Element.prototype.removeChild;
			Element.prototype.removeChild = function(child) { _removeChild.call(this,child); };
		}
	}
}
fnExec();
if (typeof browser === 'undefined') browser = chrome;
var dominioAtual = null;
var abrirBarra = 1;
var localId = '';
var ambiente = null; 
var limitSeconds = 5;
var static = null;
var protocol = null;
var host = null; 
baTempoLimite = null;
baTempoLimiteEstourado = false;
var windowLoaded = false;
baJSLoaded = false;
ba_ultimoResult = null;
ba_pageObserver = null;
var staticalways = '4e4356b68404a5138d2d-33393516977f9ca8dc54af2141da2a28.ssl.cf1.rackcdn.com';
var baScript_storeList = null;
var baScript_dadosEncontrados = false;
var baScript_storeRegex = null;
var baScript_iframeTop = null;
var baScript_divEspaco = null;
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	
	if (request.mensagem == "executar") {
		if (abrirBarra == 1) {
			ambiente = request.aB;
			host = request.hST;
			localId = request.lId;
			if (ambiente == 'www') {
				protocol = 'https';
				static = staticalways;
			} else {
				protocol = 'https';
				static = ambiente+'.baixou.com.br';
			}
			baScript_storeList = request.sL;
			baScript_verificaURL();
		}
	}
});
browser.runtime.sendMessage({'event':'myscriptReady'},function(data) {
	for(var field in data) window['baDATA_'+field] = data[field];
});
function baScript_verificaURL() {
	baScript_storeRegex = null;
	dominioAtual = window.location.href;
	for (var i = 0; baScript_storeList && i < baScript_storeList.length; i++) {
		var regex = XRegExp(baScript_storeList[i].r_dominio, 'i');
		var match = XRegExp.exec(dominioAtual, regex);
		if (match) {
			baScript_storeRegex = baScript_storeList[i];
			break;
		}
	}
	var dtAgora = new Date();
	baTempoLimite = dtAgora.setSeconds(dtAgora.getSeconds() + limitSeconds);
	if (baScript_storeRegex) {
		delete baScript_storeRegex.regexpreco;
		delete baScript_storeRegex.regexcodigo;
		buscaIframe();
	}
}
$(window).ready(function() {
	if (baScript_dadosEncontrados) return;
	baScript_verificaURL();
});
var baFoundData = false;
var lastParam = null;
async function buscaIframe(returnAfter) {
	await baDebug.waitSetup();
	if (baTempoLimite) {
		var dtAgora = new Date();
		var dtMax = limitSeconds*1000;
		var dtDiff = dtMax - (baTempoLimite - dtAgora.getTime());
		ba_log(agora(),'buscaIframe',dtDiff+'/'+dtMax);
	}
	var str = getPageContent();
	var result = {};
	var notRegex = ['idloja','nome','url','ativo','ativoplugin','labels','checkout','storeseo','inlabel'];
	var notKeys = ['index','input','groups'];
	Object.keys(baScript_storeRegex).forEach(key => {
		if (notRegex.indexOf(key) >= 0) return;
		var regra = baScript_storeRegex[key];
		if (regra != '' && typeof(regra) == 'string') {
			baDebug.setSection('regex',key,regra);
			var multi = false;
			if (regra.indexOf('|MULTI') >= 0) {
				regra = regra.replace('|MULTI','');
				multi = true;
			}
			var flags = 'i';
			if (multi) flags += 'g';
			var regex = XRegExp(regra, flags);
			var match, pos = 0;
			var keysfound = {};
			while (match = XRegExp.exec(str, regex, pos)) {
				for (var key2 in match) {
					if (isNaN(key2) && notKeys.indexOf(key2) < 0) {
						var value = match[key2];
						if (value && value.trim) value = value.trim();
						if (!keysfound[key2]) {
							keysfound[key2] = value;
						}
					}
				}
				pos = (multi) ? match.index + match[0].length : str.length+1;
			}
			var allkeys = Object.keys(keysfound);
			allkeys.sort((a,b) => a < b ? -1 : 1);
			if (allkeys.length) {			
				var mkey = allkeys[0];
				var mkey_ = mkey+'_';
				var mkey__ = mkey+'__';
				
				if (keysfound[mkey__] && !keysfound[mkey_]) keysfound[mkey_] = keysfound[mkey__];
				delete keysfound[mkey__];
				if (keysfound[mkey_] && !keysfound[mkey]) keysfound[mkey] = keysfound[mkey_];
				delete keysfound[mkey_];
			}
			Object.keys(keysfound).forEach(key2 => {
				var value = keysfound[key2];
				result[key2] = value;
				baDebug.setSection('regex',key,regra,value);
			});
		}
	});
	result = buscaResultJS(result);
	
	var ok = true;
	
	if (!result.preco) ok = false;
	
	if (!result.codigo && !result.codigo2 && !result.ean) ok = false;
	if (returnAfter) return {'ok':ok,'result':result};	
	if (ok) baFoundData = true;
	
	
	if (baTempoLimite && dtAgora.getTime() >= baTempoLimite) {
		baTempoLimiteEstourado = true;
		ok = true;
	}
	var delay = (baTempoLimiteEstourado) ? 1000 : 100;
	ba_log(agora(),'Result',ok,result);
	if (!ok) return setTimeout(function() { buscaIframe(); },delay);
	var param = '';
	for (var key in result) {
		var value = result[key];
		var encoded = (key == 'descricao') ? encodeURI(Base64.encode(value)) : encodeURIComponent(value);
		param += '&' + key + '=' + encoded;
	}
	if (param == lastParam) return;
	lastParam = param;
	var urlCoded = encodeURI(Base64.encode(location.href));
	var manifest = browser.runtime.getManifest();
	var params = 'url='+urlCoded+'&localId='+localId+'&version='+manifest.version+param;
	if (window.baDATA_afforigem) params = 'aff='+window.baDATA_afforigem+'&'+params;
	var www = ambiente+'.';
	if (host.indexOf('baixou.com.br') < 0) www = '';
	destino = 'https://' + www + host+'/extensions/findProduct/?' + params;
	removeIframe();
	baCompAgressiva_Remove();
	mostraIframe();
}
function baDebugJS_setSection(p1,p2) {
	baDebug.setSection('regex',p1,'detectado via JS',p2);
}
function buscaResultJS(result) {
	var dd = document.domain;
	dd = dd.replace('www.','');
	
	if (dd == 'sephora.com.br') {
		var $checked = $('.full-container .col-infos .col-bundle .wrap-group .grouped-list .item input[type="checkbox"]:checked');
		if ($checked.length == 1) {
			var $li = $checked.parent();
			var ref = $li.find(".reference:contains('REF:')").text();
			var preco = $li.find(".special-price .price").text().trim() || $li.find(".regular-price .price").text().trim();
			result.ean = (ref) ? ref.split('REF:#')[1] : '';
			result.preco = (preco) ? preco.split(' ')[1] : '';
			baDebugJS_setSection('ean',result.ean);
			baDebugJS_setSection('r_preco',result.preco);
		}
	}
	
	if (dd == 'petlove.com.br') {
		var script = $('.products-content script:first-child').text();
		var regex = /var productDataJson = (.*)/g;
		var match = regex.exec(script);
		if (match) {
			try {
				var productDataJson = JSON.parse(match[1]);
				var innerCode = $('.item-variant.selected input').val();
				productDataJson.variants.forEach(function(variant) {
					if (variant.id == innerCode) {
						result.codigo = variant.sku;
						baDebugJS_setSection('r_codigo',result.codigo);
					}
				});
			} catch(e) {
			}
		}
	}
	
	if (dd == 'amazon.com.br') {
		
		var primeiro = document.querySelectorAll('.a-size-large.a-color-price.olpOfferPrice.a-text-bold')[0];
		if (primeiro && !result.preco) {
			var dspreco = primeiro.innerText.trim();
			var regex = XRegExp('(?<preco>[0-9.,]+)', 'i');
			var match = XRegExp.exec(dspreco, regex);
			result.preco = match.preco;
			baDebugJS_setSection('r_preco',result.preco);
		}
	}
	return result;
}
async function mostraIframe() {
	if (!document.body) return setTimeout(mostraIframe,50);
	if (!document.head) return setTimeout(mostraIframe,50);
	var dd = document.domain;
	dd = dd.replace('www.','');
	if (dd == 'sephora.com.br') {
		$('.item input:not(.baTriggerChange)').addClass('baTriggerChange').change(verificaMudancaSephora);
	}
	if (dd == 'petz.com.br') {
		addObserverPetz();
	}
	if (dd == 'petlove.com.br') {
		addObserverPetLove();
	}
	if (dd == 'compracerta.com.br') {
		addObserverCompraCerta();
	}
	baDebug.setSection('link','Barra',destino);
	var tag = document.createElement('meta');
	tag.name = 'baixouURL';
	tag.content = browser.extension.getURL('');
	baAppend(tag);
	if (!baJSLoaded) {
		var url = browser.extension.getURL('js/jsextension.js?host='+host);
		loadjscssfile(url, 'js');
		baJSLoaded = true;
	} 
	
	baScript_iframeTop = document.querySelector('#HWSSbE5eo2');
	if (!baScript_iframeTop) baScript_iframeTop = document.createElement('iframe');
	baScript_iframeTop.src = destino;
	baScript_iframeTop.id = 'HWSSbE5eo2';
	baScript_iframeTop.style.width = '100%';
	baScript_iframeTop.style.height = '41px';
	baScript_iframeTop.style.zIndex = '10000001';
	baScript_iframeTop.style.position = 'fixed';
	baScript_iframeTop.style.top = '0px';
	baScript_iframeTop.style.left = '0px';
	baScript_iframeTop.style.display = 'none';
	baScript_iframeTop.style.maxWidth = 'none';
	baScript_iframeTop.style.backgroundColor = "transparent";
	baScript_iframeTop.frameBorder = "0";
	baScript_iframeTop.scrolling = "no";
	baScript_iframeTop.allowTransparency = "true";
	baScript_divEspaco = document.querySelector('#au4O8MJyTH5KrbwVG');
	if (!baScript_divEspaco) baScript_divEspaco = document.createElement('div');
	baScript_divEspaco.id = 'au4O8MJyTH5KrbwVG';
	baScript_divEspaco.style.height = '40px';
	baScript_divEspaco.style.display = 'none';
	
	var showB = false;
	if (showB) {
		baScript_iframeTopB = document.createElement('iframe');
		baScript_iframeTopB.src = destino.replace('/findProduct/','/findProductB/');
		baScript_iframeTopB.id = 'HWSSbE5eo2B';
		baScript_iframeTopB.style.width = '50px';
		baScript_iframeTopB.style.height = '400px';
		baScript_iframeTopB.style.zIndex = '10000001';
		baScript_iframeTopB.style.position = 'fixed';
		baScript_iframeTopB.style.top = '200px';
		baScript_iframeTopB.style.right = '0px';
		baScript_iframeTopB.style.display = 'block';
		baScript_iframeTopB.style.backgroundColor = "transparent";
		baScript_iframeTopB.frameBorder = "0";
		baScript_iframeTopB.scrolling = "no";
		baScript_iframeTopB.allowTransparency = "true";
	}
	
	var script = document.createElement('script');
	script.textContent = '('+fnExec.toString()+')()';
	(document.head||document.documentElement).appendChild(script);
	script.remove();
	
	var dd = document.domain;
	dd = dd.replace('www.','');
	if (dd == 'walmart.com.br') {
		var style = document.createElement('style');
		style.textContent = '';
		style.textContent += 'div#product-toolbar.product-toolbar.clearfix.fixed.active { margin-top:37px } ';
		style.textContent += 'nav#site-menu.site-menu.fixed.animate { margin-top:40px; } ';
		(document.head||document.documentElement).appendChild(style);
	}
	
	insertAfter(baScript_iframeTop, document.body);
	
	document.body.insertBefore(baScript_divEspaco, document.body.firstChild);
	if (showB) {
		document.body.insertBefore(baScript_iframeTopB, document.body.firstChild);
	}
}
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
function refreshIframe() {
	removeIframe();
	buscaIframe();
}
function removeIframePart(part) {
	if (part) {
		var parent = $(part).parent()[0];
		if (parent) parent.removeChild(part);
	}
}
function removeIframe() {
	$('style').each(function() {
		var $node = $(this);
		var content = $node.html();
		if (content == '#HWSSbE5eo2, #au4O8MJyTH5KrbwVG {display:block !important;}') $node.remove();
	});
	
	removeIframePart(baScript_iframeTop);
	removeIframePart(baScript_divEspaco);
	
	baTempoLimite = null;
}
window.addEventListener('focus',function() {
	browser.runtime.sendMessage({'event':'windowFocus','url':location.href});
});
window.addEventListener('blur',function() {
	browser.runtime.sendMessage({'event':'windowBlur','url':location.href});
});
function verificaMudancaSephora() {
	
	var atual = JSON.parse(JSON.stringify(ba_ultimoResult));
	
	buscaIframeSephora();
	
	if (atual && ba_ultimoResult && atual.ean == ba_ultimoResult.ean) {
		return;
	}
	if (ba_ultimoResult && ba_ultimoResult.ean && ba_ultimoResult.preco) {
		
		refreshIframe();
		return;
	}
	removeIframe();
}
function buscaIframeSephora() {
	var result = {};
	var $checked = $('.full-container .col-infos .col-bundle .wrap-group .grouped-list .item input[type="checkbox"]:checked');
	if ($checked.length == 1) {
		var $li = $checked.parent();
		var ref = $li.find(".reference:contains('REF:')").text();
		var preco = $li.find(".special-price .price").text().trim() || $li.find(".regular-price .price").text().trim();
		result.ean = (ref) ? ref.split('REF:#')[1] : '';
		result.preco = (preco) ? preco.split(' ')[1] : '';
	}
	ba_ultimoResult = result;
}
function addObserverPetz() {
	
	var target = $('#divProdutoVariacao')[0]; 
	
	var config = {childList:true}; 
	
	var condition = function(mutation) {
		
		
		return (mutation.addedNodes && mutation.addedNodes.length);
	}
	
	addObserver(target,config,condition);
}
function addObserverPetLove() {
	
	var target = $('.box-sku-pricelist')[0]; 
	
	var config = {attributes:true,subtree:true}; 
	
	var condition = function(mutation) {
		
		
		return (mutation.type == 'attributes' && $(mutation.target).hasClass('selected'));
	};
	
	addObserver(target,config,condition);
}
function addObserverCompraCerta() {
	
	var target = $('.skuReference')[0]; 
	
	var config = {attributes:true}; 
	
	var condition = function(mutation) {
		return true;
	};
	
	addObserver(target,config,condition);
}
function addObserver(target,config,condition) {
	
	if (ba_pageObserver) return;
	
	var timeoutRefresh = null;
	
	ba_pageObserver = new MutationObserver(function(mutations) {
		
		mutations.forEach(function(mutation) {
			
			var ok = condition(mutation);
			
			if (ok) {
				
				
				clearTimeout(timeoutRefresh);
				timeoutRefresh = setTimeout(refreshIframe,300);
			}
		});
	});
	
	ba_pageObserver.observe(target,config);
}
baScript_showModalCupom = function() {
	browser.runtime.sendMessage({'event':'getLastCupom'},function(dados) {
		if (dados) baMostraCupomFront(dados.cupom);
	});
}
baHideCupomFront = function() {
	$('#ATtRj3szCuUW,#ATtRj3szCuUW_cover').fadeOut(200);
};
baMostraCupomFront = function(xCupom) {
	var oCupom = (!xCupom || typeof xCupom == 'string') ? JSON.parse(xCupom || '{}') : xCupom;
	var sMid = '';
	var autoclose = false;
	if (!oCupom.codigo) oCupom.codigo = '';
	if (!oCupom.titulo) oCupom.titulo = '';
	if (!oCupom.descricao) oCupom.descricao = '';
	if (!oCupom.nomeplugin) oCupom.nomeplugin = '';
	if (!oCupom.storeseo) oCupom.storeseo = '';
	var exturl = browser.extension.getURL('');
	var $cupom = $('<div>',{id:'ATtRj3szCuUW'});
	
	$cupom.load(exturl+'tpl/front-cupom.html',(html) => {
		baMisc_setDivValues($cupom,oCupom);
		
		if (oCupom.codigo == '') {
			$cupom.find('.Ec9cCvNJebFBtVfzppU.nocode').show();
		} else {
			$cupom.find('.Ec9cCvNJebFBtVfzppU.withcode').show();
		}
		$cupom.find('.rkOLw892VRRlqnCopy').attr('data-clipboard-text',oCupom.codigo);
		var wheight = $(window).height();
		var cheight = 330;
		var top = wheight/2 - cheight/2;
		if (top > 175) top = 175;
		var wwidth = $(window).width();
		var cwidth = 550;
		var left = wwidth/2 - cwidth/2;
		$cupom.css({'top':top,'left':left});
		var $cover = $("<div id='ATtRj3szCuUW_cover'></div>").appendTo($body);
		$cover.click(baHideCupomFront);
		$cupom.find('#rkOLw892VRRlqnCopy').click(function() {
			$cupom.find('.textocodigo').baSelectText();
			document.execCommand('copy');
			$cupom.find(".Ec9cCvNJebFBtVfzppU").addClass("RaAFMFZzfn4rRXsq");
			$cupom.find(".rkOLw892VRRlqnCopy").html("Copiado!");
		});
	});
	var $body = $(document.body);
	$cupom.appendTo($body);
		
	loadjscssfile(exturl+'css/front-cupom.css','css');
};
$(document).on('click','#ATtRj3szCuUW_close',baHideCupomFront);
$.fn.baSelectText = function(){
    this.find('input').each(function() {
        if($(this).prev().length == 0 || !$(this).prev().hasClass('p_copy')) {
            $('<p class="p_copy" style="position: absolute; z-index: -1;"></p>').insertBefore($(this));
        }
        $(this).prev().html($(this).val());
    });
    var doc = document;
    var element = this[0];
    if (doc.body.createTextRange) {
        var range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
};
function getCookie(cn) {
    var name = cn+"=";
    var allCookie = decodeURIComponent(document.cookie).split(';');
    var cval = [];
    for(var i=0; i < allCookie.length; i++) {
        if (allCookie[i].trim().indexOf(name) == 0) {
            cval = allCookie[i].trim().split("=");
        }
    }
    return (cval.length > 0) ? cval[1] : "";
}
async function verificaCookieAfiliado() {
	var envData = await getEnvData();
	if (!envData.host) return;	
	var sAff = getCookie('baAff');
	if (sAff && location.href.indexOf(envData.host) >= 0) browser.runtime.sendMessage({'event':'setAfiliadoOrigem','aff':sAff});
}
$(window).ready(function() {
	verificaCookieAfiliado();
});
function randName(size) {
	var text = "";
	var possible = "abcdefghijklmnopqrstuvwxyz_";
	for (var i = 0; i < size; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}
function getPageContent() {
	var html = document.querySelector('html');
	return (html) ? html.innerHTML : '';
}
function loadjscssfile(filename, filetype) {
	return new Promise(resolve => {
		if (filetype == "js") { 
			var fileref = document.createElement('script');
			fileref.setAttribute("type", "text/javascript");
			fileref.setAttribute("src", filename);
		} else if (filetype == "css") { 
			var fileref = document.createElement("link");
			fileref.setAttribute("rel", "stylesheet");
			fileref.setAttribute("type", "text/css");
			fileref.setAttribute("href", filename);
		}
		if (typeof fileref != "undefined") {
			fileref.onload = resolve;
			baAppend(fileref);
		}		
	});
}
$(window).on('keydown',function(e) {
	if (e.keyCode == 113) { 
		browser.runtime.sendMessage({'event':'reloadExtension'},function(flag) {
			if (!flag) return;
			var LS = new baLocalStorage('autocupom');
			LS.clear();
			$('body').fadeOut(1000);
			setTimeout(function() { location.reload(); },1000);
		});
	}
});
var ba_Script_currentURL = location.href;
function baScript_watchURL() {
	
	if (ba_Script_currentURL != location.href) {
		ba_Script_currentURL = location.href;
		baScript_verificaURL();
	}
}
var ba_Script_intervalURL = setInterval(baScript_watchURL,500);
$(window).on('beforeunload', function() { clearInterval(ba_Script_intervalURL); });
