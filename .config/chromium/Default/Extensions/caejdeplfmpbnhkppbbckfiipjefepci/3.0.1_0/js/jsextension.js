(() => {
	var src = document.currentScript.src;
	var parts = src.split('?host=');
	var okOrigin = parts[1].split('&')[0];

	customDATA = {};
	
	var qs = function() {
		return document.querySelector.apply(document,arguments);
	}

	var qsa = function() {
		return document.querySelectorAll.apply(document,arguments);
	}

	function css(obj,values) {
		Object.keys(values).forEach(key => {
			obj.style[key] = values[key];
		});
	}

	function rebindNetshoes(){
		/*
		jQBaixou(".required").click(function(){
			var $this = this;
			setTimeout(function(){atualizaBarra($this.nextSibling.getAttribute('data-thumb'), document.getElementsByClassName('new-price')[0].innerHTML, /[\d\w]{3,3}-[\d]{4,4}-[\d]{3,3}/, /[\d,.]+/)},700);
			setTimeout(rebindNetshoes, 500);
		});
		*/
	}

	function rebindCentauro(){
		/*
		jQBaixou(".color-swatch").click(function(){
			atualizaBarra(siteMetadata.paginaInfo.produtoInfo.id+jQBaixou(this).data("value"), _produtoInfo.precosProduto[jQBaixou(this).data("product-skuid")].value);
		});
		*/
	}

	function rebindEpoca(){
		/*
		customDATA.epoca = {};

		var skuname = jQBaixou('.skuselector-specification-label:checked').val();

		if (skuname){
			customDATA.epoca.skuname = true;
			for (var i = 0; i < skuJson.skus.length; i++){
				if (skuJson.skus[i].skuname == skuname){
					if (skuJson.skus[i].available){
						atualizaBarra(skuJson.skus[i].sku, skuJson.skus[i].bestPriceFormated, null, /[0-9,.]+/);
					}else{
						atualizaBarra(skuJson.skus[i].sku, '');
					}
				}
			}
		} else {
			customDATA.epoca.skuname = false;
		}
		jQBaixou('.skuselector-specification-label').click(function(){atualizaEpoca();});
		*/
	}


	function habilitaCarregamentoDinamico() {
		var dd = document.domain;
		dd = dd.replace('www.','');
	
		if (dd == 'centauro.com.br'){
			setTimeout(rebindCentauro, 500);
			return;
		}
		if (dd == 'epocacosmeticos.com.br'){
			setTimeout(rebindEpoca, 500);
			return;
		}		
		if (dd == 'netshoes.com.br'){
			setTimeout(rebindNetshoes,500);
			return;
		}
	}

	function atualizaBarra(codigo, preco, regexpc, regexpp){
		if (codigo){
			if (regexpc){ codigo = codigo.match(regexpc);}
			if (regexpp){ preco = preco.match(regexpp);}

			var obj = qs('#HWSSbE5eo2');
			var src = obj.src;

			if (src.match(/preco=[^&]+/i)){
				src = src.replace(/preco=[^&]+/i,'preco='+preco);
			}else{
			src += '&preco='+preco;
			}
			if (src.match(/codigo=[^&]+/i)){
				src = src.replace(/codigo=[^&]+/i,'codigo='+codigo);
			}else{
			src += '&codigo='+codigo;
			}			
			obj.src = src;
		}
	}

	function randName(size){
		var text = "";
		var possible = "abcdefghijklmnopqrstuvwxyz_";
		for( var i=0; i < size; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		return text;
	}
	
	function criaBarraBaixou(destino){
		baixou_iframeTop = document.createElement('iframe');
		baixou_iframeTop.id = 'HWSSbE5eo2';
		baixou_iframeTop.style.width = '100%';
		baixou_iframeTop.style.display = 'none';
		baixou_iframeTop.style.height = '41px';
		baixou_iframeTop.style.zIndex = '10000001';
		baixou_iframeTop.style.position = 'fixed';
		baixou_iframeTop.style.top = '0px';
		baixou_iframeTop.style.left = '0px';
		baixou_iframeTop.style.backgroundColor = "transparent";
		baixou_iframeTop.frameBorder = "0";
		baixou_iframeTop.scrolling = "no";
		baixou_iframeTop.allowTransparency = "true";
		baixou_iframeTop.src = destino;

		document.body.insertBefore(baixou_iframeTop,document.body.firstChild);

		baixou_divEspaco = document.createElement('div');
		baixou_divEspaco.id = 'au4O8MJyTH5KrbwVG';
		baixou_divEspaco.style.height = '40px';
		baixou_divEspaco.style.display = 'none';

		document.body.insertBefore(baixou_divEspaco,document.body.firstChild);
	}

	var customStyles = [];

	function addNewStyle(newStyle,saveIt) {
		var styleElement = document.createElement('style');
		styleElement.type = 'text/css';
		styleElement.id = randName(15);
		document.getElementsByTagName('body')[0].appendChild(styleElement);
		styleElement.appendChild(document.createTextNode(newStyle));
		var iStyle = styleElement.id;

		if (saveIt) customStyles.push(iStyle);

		return iStyle;
	}

	function getHeight() {
		var myHeight = 0;
		if (typeof (window.innerHeight) == 'number') {
			//Non-IE
			myHeight = window.innerHeight;
		} else if (document.documentElement && document.documentElement.clientHeight) {
			//IE 6+ in 'standards compliant mode'
			myHeight = document.documentElement.clientHeight;
		} else if (document.body && document.body.clientHeight) {
			//IE 4 compatible
			myHeight = document.body.clientHeight;
		}
		return myHeight;
	}

	var anim = 0;
	var caixaAberta = false;
	var idstyleSaraiva = null;
	var caixaAbertaTimeout = null;

	var iFrame = qs('#HWSSbE5eo2');

	if (iFrame && iFrame.contentWindow && iFrame.contentWindow.postMessage) {
		if (!caixaAberta) iFrame.contentWindow.postMessage({'acao':'confirmaAbreCaixa'}, "*");
	}

	window.addEventListener('message', event => {		
		var evOrigin = event.origin;

		if (evOrigin.indexOf(okOrigin) >= 0) {

			if (event.data.acao == 'fechaIframe') {

				window.postMessage(event.data,'*');

				var espaco = qs('#au4O8MJyTH5KrbwVG'); espaco.parentElement.removeChild(espaco);

				qsa('[top_before]').forEach(obj => restoreVALUE(obj,'top'));
				qsa('[margin_top_before]').forEach(obj => restoreVALUE(obj,'margin-top'));

				if (idstyleSaraiva) qs('style#'+idstyleSaraiva).remove();

				customStyles.forEach(function(iStyle) {
					var style = qs('style#'+iStyle);
					if (style) style.remove();
				});

				caixaAberta = false;
			}

			if (event.data.acao == 'abreCaixa') {
				var iframe = qs("#HWSSbE5eo2");
				iframe.style.height = (getHeight() + 41) + 'px';
			}


			if (event.data.acao == 'fechaCaixa') {
				var iframe = qs("#HWSSbE5eo2");
				iframe.style.height = '41px';
			}

			/* EXIBE_CAIXA */
			if (event.data.acao == 'exibeCaixa') {

				if (location.href.indexOf('epocacosmeticos.com.br') >= 0) {
					// se ainda não rodou o check do epoca, vamos ignorar essa barra
					if (!customDATA.epoca) return;
				}

				if ((window==window.top)) {
					var iframe = qs("#HWSSbE5eo2");
					css(iframe,{'height':'41px', 'width':'100%', 'zIndex':'2147483647', 'position':'fixed', 'top':'0px', 'left':'0px'});
					css(iframe,{'backgroundColor':'transparent', 'display':'block !important'});

					var espaco = qs("#au4O8MJyTH5KrbwVG");
					css(espaco,{'height':'40px', 'display':'block'});

					addNewStyle('#HWSSbE5eo2, #au4O8MJyTH5KrbwVG {display:block !important;}');
					addNewStyle('.avast-extension-safeshop-bar {display:none !important;}');

					qsa('*').forEach(obj => {
						var this_pos = obj.style.position;
						var this_top = obj.style.top;
						var this_id = obj.id;
						if (this_pos == 'fixed' && this_id != "HWSSbE5eo2" && (this_top == '0px' || this_top== '0')) updateVALUE(obj,'top','41px');
					});
				}

				caixaAberta = true;
				mantemCaixaAberta();
			}
		}
	});

	function mantemCaixaAberta() {
		clearTimeout(caixaAbertaTimeout);
		if (!caixaAberta) return;

		caixaAbertaTimeout = setTimeout(function() {
			if (!caixaAberta) return;
			var div = qs("#HWSSbE5eo2");
			if (div) div.style.display = 'block';
			mantemCaixaAberta();
		},500);
	}

	function updateVALUE(obj,field,newval) {
		var before = obj.style[field];
		var attrname = field.replace('-','_') + '_before';
		obj.style[field] = newval;
		obj[attrname] = before;
	}

	function restoreVALUE(obj,field) {
		var attrname = field.replace('-','_') + '_before';
		var before = obj[attrname];
		obj.style[field] = before;
	}
	
	if(typeof hideAddOn=='function') hideAddOn = function(){};
	
	var dd = document.domain; 
	dd = dd.replace('www.',''); 	

	if (dd=='extra.com.br' || dd=='pontofrio.com.br' || dd=='casasbahia.com.br') {
		if (typeof($) != 'undefined') $.event.remove = function(){};
		window.addEventListener = function(){};
	}	
	if (document.readyState == 'complete'){
		habilitaCarregamentoDinamico();
		addNewStyle('html {margin-top:0px !important;} #HWSSbE5eo2 {top:0px !important;}');
	} else {
		document.addEventListener('DOMContentLoaded', function() {
			if ((window==window.top)) {
				var iframe = qs("#HWSSbE5eo2");
				if (!iframe) {
					var doc = qs('html');
					var html = doc.innerHTML;
					if (html.indexOf("baixou.com.br/extensions/findProduct") > 0){
						var patt = /http:\/\/.*baixou\.com\.br\/extensions\/findProduct.*?"/i;
						var url = patt.exec(html);
						criaBarraBaixou(url);
					}
				}
			}
			habilitaCarregamentoDinamico();
			addNewStyle('html {margin-top:0px !important;} #HWSSbE5eo2 {top:0px !important;}');
		});
	}

})();