if (typeof browser === 'undefined') browser = chrome;
var addedReport = false;
var baCupom_CDN = "https://4e4356b68404a5138d2d-33393516977f9ca8dc54af2141da2a28.ssl.cf1.rackcdn.com";
$(document).on('click', '.showblock', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var block = $(this).attr('name');
    $('.block').removeClass('active');
    $('#' + block).addClass('active');
});
getter = new classGetter();
function getEnv() {
    browser.runtime.sendMessage({'event': 'getEnv', 'currentTab': true}, function (data) {
        var error = null;
        if (!data) {
            $('.block').removeClass('active');
            $('#notloaded').addClass('active');
            return;
        }
        if (!data.env || !data.env.ambiente)
            error = 'ambiente';
        if (!data.env || !data.env.host)
            error = 'host';
        if (!data.manifest || !data.manifest.name)
            error = 'name';
        if (!data.colors || !data.colors.secondary)
            error = 'colors';
        if (error) {
            return setTimeout(getEnv, 1000);
		}
		
		localStorage.setItem('localid',data.localid);
		var manifest = browser.runtime.getManifest();
        if (data) {
            var www = (data.env.ambiente != 'www') ? data.env.ambiente + '.' : '';
            var protocol = (data.env.ambiente == 'desenv3') ? 'http' : 'https';
            
            var base = protocol+'://'+www+data.env.host;
            var lojas = base+'/extensions/htmllojas?localid='+data.localid;
			var report = base+'/extensions/reportarerros?localid='+data.localid+'&version='+manifest.version+'&iframe=1&url='+encodeURIComponent(data.urlAtual);
			var $lojas = $('#lojas #fakeiframe');
			$lojas.load(lojas,() => {
				$lojas.find('.goloja').each((i,link) => {
					var $link = $(link);
					var href = $link.attr('href');
					$link.attr('href',base+href);
				});
			});
			
            $('#report iframe').attr('src',report);
                        
            $('#intro .name').text(data.manifest.name);
            $('.block').removeClass('active');
            $("#intro").addClass('active');
            $('.btn').css('background', data.colors.secondary);
        }
    });
    requestCupons();
}
function requestCupons() {
    $('.show-without-cupons').show();
    $('.hide-without-cupons').hide();
    browser.runtime.sendMessage({'event': 'getCuponsLojas'});
}
function recebeCupons(list) {
    if (!list) return setTimeout(requestCupons, 300);
    $('.show-without-cupons').hide();
    $('.hide-without-cupons').show();
    var lojas = list.filter(function (loja) { return loja.ativocupons && loja.cupons.length > 0; });
    geraListaLojas(lojas);
}
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.event == 'listaCupons') {
		recebeCupons(request.list);
	}
});
$(window).ready(function () {
    getEnv();
});
function ajustaAltura() {
    $('html,body').css('height', $('.block.active').height());
}
String.prototype.substitute = function (data) {
    var newvalue = this;
    for (var atr in data) {
        var vlr = data[atr];
        var rgx = new RegExp('{{' + atr + '}}', 'g');
        newvalue = newvalue.replace(rgx, vlr);
    }
    return newvalue;
};
function geraListaLojas(lista) {
    lista.sort(function (a, b) {
        return (a.nome < b.nome) ? -1 : +1;
    });
    var $tbody = $('#lojascupons tbody');
    var $template = $tbody.find('tr.template');
    
    lista.forEach(function (loja) {
        loja.qtcupons = loja.cupons.length;
        loja.dscupom = (loja.qtcupons == 1) ? 'cupom' : 'cupons';
		
        var $tr = $template.clone().removeClass('template').appendTo($tbody);
		baMisc_setDivValues($tr,loja);
        var $clist = $tr.find('.cupomlist');
        var $template2 = $clist.find('.template');
        
        loja.cupons.forEach(function (cupom) {
            cupom.href = loja.url + '#cupom' + cupom.id;
            if (cupom.href.indexOf('http') < 0)
                cupom.href = 'http://' + cupom.href;
            if (!cupom.codigo) {
            }
			$div = $template2.clone().removeClass('template').appendTo($clist);
			baMisc_setDivValues($div,cupom);
			
            $div.click(function (e) {
				e.preventDefault();
				e.stopPropagation();
				browser.runtime.sendMessage({'event': 'popupAbreCupom','cupom':cupom});
            });
        });
        $tr.click(function () {
            var $tr = $(this);
            $tr.toggleClass('open');
        });
    });
    var $input = $('#buscalojas');
    $input.on('keyup', function (e) {		
        var busca = $input.val().trim().toLowerCase();
		var $allTrs = $tbody.find('tr:not(.template)');
		var $allCupons = $tbody.find('.cupomlist > div:not(.template)');
		
        if (busca) {
			busca = baPopup_pureString(busca);
			
            $allTrs.hide();
			$allTrs.removeClass('open');
			
			$allCupons.hide();
			
			$allTrs.each(function() {
				var $tr = $(this);
				var $cupons = $tr.find('.cupomlist > div:not(.template)');
				
				var nome = $tr.find('.handler').text().trim().toLowerCase();
				nome = baPopup_pureString(nome);
				
				if (nome.indexOf(busca) >= 0) {
					
					$tr.css('display','table-row');
					
					$cupons.show();
				} else {				
					
					$cupons.each(function() {
						
						var $cupom = $(this);
						var descricao = $cupom.find('b').text().trim().toLowerCase();
						descricao = baPopup_pureString(descricao);
						
						if (descricao.indexOf(busca) >= 0) {
							
							$cupom.show();
							$tr.css('display','table-row');
						}
					});
				}				
			}); 
        } else {
			
            $allTrs.css('display', 'table-row');
			$allCupons.show();
        }
    });
}
function baPopup_pureString(strToReplace) {
	strSChar = "áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÖÔÚÙÛÜÇ";
	strNoSChars = "aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC";
	var newStr = "";
	for (var i = 0; i < strToReplace.length; i++) {
		if (strSChar.indexOf(strToReplace.charAt(i)) != -1) {
			newStr += strNoSChars.substr(strSChar.search(strToReplace.substr(i, 1)), 1);
		} else {
			newStr += strToReplace.substr(i, 1);
		}
	}
	return newStr;
}