baCompAgressiva_CDN = "https://4e4356b68404a5138d2d-33393516977f9ca8dc54af2141da2a28.ssl.cf1.rackcdn.com";
baCompAgressiva_ENV = {};
baCompAgressiva_localid = null;
baCompAgressiva_position = {};
function baCompAgressiva_getEnv() {
	chrome.runtime.sendMessage({'event':'getEnv'},function(data) {
		if (data) {
			baCompAgressiva_localid = data.localid;
			baCompAgressiva_ENV = data.env;
			return;
		}
		baCompAgressiva_getEnv();
	});
}
	chrome.runtime.sendMessage({'event':'getEnv'},function(data) {
		baCompAgressiva_localid = data.localid;
		baCompAgressiva_ENV = data.env;
		
	});
chrome.runtime.sendMessage({'event':'getCompAgressivaPos'},function(data) {
	baCompAgressiva_position = data;
});
baEventos_ON('dadosComparacao',function(evData) {
	var dados = evData.dados;
	if (dados && dados.flag) baCompAgressiva_Display(dados);
});
function baCompAgressiva_Remove() {
	$('#compAgressiva').remove();
}
let baSendingError = false;
function baCompAgressiva_SetNoImage($clone) {
	var $thumb = $clone.find("[ba-bgimg='thumb']");
	$thumb.css('background-image','url('+baCompAgressiva_CDN+'/modules/baixou/shell/3.0/lay/produto-sem-imagem.jpg)');
}
function baCompAgressiva_Display(dados) {
	baCompAgressiva_Remove();
	var exturl = browser.extension.getURL('');
	var data = {
		'produtos': dados.produtos.length,
		'exturl': exturl
	};
	var env = baCompAgressiva_ENV;
	var wid = parseInt(env.wid);
	var ambiente = env.ambiente;
	if (wid != 0 && ambiente == 'www') ambiente = '';
	var www = (ambiente) ? ambiente+'.' : '';
	var baseurl = 'https://'+www+env.host;
	var $div = $('<div>');
	$div.appendTo($('body').eq(0));
	$div.load(exturl+"tpl/comp-agressiva.html",function() {
		baMisc_setDivValues($div,data);
		var $wrapper = $div.find('#produtos-wrapper');
		var $template = $wrapper.find('.produto-principal.template');
		var porloja = {};
		dados.produtos.forEach(function(pdata,i) {
			var idloja = pdata.idloja;
			var $clone = $template.clone();
			$clone.removeClass('template');
			
			if (i == 0) $clone.addClass('first');
			pdata.url = baseurl+(pdata.urlext || pdata.urlout);
			pdata.marca = env.url_cdn+'/lay/logos/marcas_'+pdata.storeseo+'.gif';
			
			baMisc_setDivValues($clone,pdata);
			if (pdata.thumb) {
				var img = new Image();
				img.onerror = function(ev) { baCompAgressiva_SetNoImage($clone); };
				img.src = pdata.thumb;
			} else {
				baCompAgressiva_SetNoImage($clone);
			}
			var parent = porloja[idloja];
			if (parent) {
				parent.qtde++;
				parent.$mais.css('display','inline');
				parent.$qtde.text(parent.qtde);
				$clone.appendTo(parent.$sub);
			} else {
				$clone.appendTo($wrapper);
				var $sub = $('<div class="tableint"></div>').hide().appendTo($clone);
				var $mais = $clone.find('.maisprodutos');
				var $qtde = $mais.find('.qtde');
				porloja[idloja] = {'$div':$clone, '$sub':$sub, '$mais':$mais, '$qtde':$qtde, 'qtde':0};
				$mais.click(function($e) {
					$e.preventDefault();
					$e.stopPropagation();
					$sub.toggle();
					$mais.find('.fa-svg').toggleClass('svg-visible');
				});
			}
		});
		$div.on('click','h1',function($e) {
			$e.preventDefault();
			$e.stopPropagation();
			if ($div.is('.stopping')) return $div.removeClass('stopping');
			$div.removeClass('minimized');
		});
		$div.on('click','#close-box',function($e) {
			$e.preventDefault();
			$e.stopPropagation();
			$div.fadeOut(100);
		});
		$div.on('click','#minus-box',function($e) {
			$e.preventDefault();
			$e.stopPropagation();
			$div.addClass('minimized');
			$e.stopPropagation();
		});
		var dataPostError = {
			localid: baCompAgressiva_localid,
			produto: dados.produto,
			master: dados.agrupamento,
			loja: dados.loja,
			url: location.href
		};
		if (baCompAgressiva_position) {
			$div.css(baCompAgressiva_position);
		}
		$div.on('click','.sendCompError',function($e) {
			$e.preventDefault();
			$e.stopPropagation();
			if (baSendingError) return;
			baSendingError = true;
			var $link = $(".baCompPopupLinkFooter a");
			$link.css('opacity',0.2);
			var $span = $link.find('span');
			$span.text('Informando erro...');
			chrome.runtime.sendMessage({'event':'sendCompError','data':dataPostError},feed => {
				if (feed.status) {
					$link.addClass('done');
					$span.text('Erro informado com sucesso!');
					$link.css('opacity',1);
				} else {
					$span.text('Falha ao informar erro.');
					$link.css('opacity',1);
				}
				baSendingError = false;
			});
		});
		$div.find('#compAgressiva').draggable({
			start: function() {
			},
			stop: function($e,data) {
				var max_width = $(window).width();
				var max_height = $(window).height();
				var div_width = $div.width();
				var div_height = $div.height();
				$div.addClass('stopping');
				data.position.right = max_width - div_width - data.position.left;
				data.position.bottom = max_height - div_height - data.position.top;
				var horizontal = (data.position.left < data.position.right) ? 'left' : 'right';
				var vertical = (data.position.top < data.position.bottom) ? 'top' : 'bottom';
				var newPos = {top:'auto', left:'auto', right:'auto', bottom:'auto'};
				newPos[horizontal] = data.position[horizontal];
				newPos[vertical] = data.position[vertical];
				$div.css(newPos);
				chrome.runtime.sendMessage({'event':'setCompAgressivaPos', 'newPos':newPos});
			}
		});
	});
}