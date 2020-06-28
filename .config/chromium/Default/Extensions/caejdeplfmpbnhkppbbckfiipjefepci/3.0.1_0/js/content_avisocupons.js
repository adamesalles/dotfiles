if (typeof browser === 'undefined') browser = chrome;
function baAC_mostraQtdeBovos() {
	let data = {qtde:5, hidebg:true};
	baMisc_openDiv('avisocupons_qtdenovos.html',data,feed => {
	});
}
$(document).on('click','#baAC_permissao .baAC-button.baAC-clickable',ev => {
	
	let $btn = $(ev.target);
	let flag = parseInt($btn.attr('flag'));
	
	if (flag) {
		baAC_pedePermissao();
	} else {
		baAC_negaPermissao();
	}
});
function baAC_pedePermissao() {
	browser.runtime.sendMessage({'event':'baAC_askPermission'},feed => {
		var lastError = chrome.runtime.lastError;
		if (feed) {
			browser.runtime.sendMessage({'event':'baAC_gotPermission'});
		} else {
			browser.runtime.sendMessage({'event':'baAC_retryPermission'});
		}
	});
}
function baAC_negaPermissao() {
	browser.runtime.sendMessage({'event':'baAC_denyPermission'});
}
$(document).on('click','#mYe2NBT1inAPZNbUQtdeNovos .baAC-button.baAC-clickable',ev => {
	
	let $btn = $(ev.target);
	let flag = parseInt($btn.attr('flag'));
	
	if (flag) {
		baAC_mostraListaCupons(ev);
	} else {
		baAC_escondeAvisoQtde(ev);
	}
});
function baAC_mostraListaCupons(ev) {
	browser.runtime.sendMessage({'event':'baAC_mostraListaCupons'});
}
function baAC_escondeAvisoQtde() {
	browser.runtime.sendMessage({'event':'baAC_escondeAvisoQtde'});
}
$(document).on('click','#baAC_cupom .baAC-icon.baAC-clickable',ev => {
	let $icon = $(ev.currentTarget || ev.target);
	let name = $icon.attr('name');
	if (name == 'mute') baAC_mostraDivMute(ev);
	if (name == 'close') baPush_clickClose(ev);
	if (name == 'back-to-cupom') baAC_escondeDivMute(ev);
});
$(document).on('click','#baAC_cupom .baAC-button.baAC-clickable',ev => {
	let $btn = $(ev.currentTarget || ev.target);
	let name = $btn.attr('name');
	if (name == 'mute-loja') baAC_mutaLoja(ev);
	if (name == 'mute-cat') baAC_mutaCategoria(ev);
	if (name == 'mute-all') baAC_perguntaMuteAll(ev);
	if (name == 'back-to-mute') baAC_mostraDivMute(ev);
	if (name == 'confirm-mute-all') baAC_muteAll(ev);
});
function baAC_mostraDivMute(ev) {
	var $push = baPush_getDiv(ev);
	$push.find('.baACcupomMuteAll').hide();
	$push.find('.baACcupomContent').hide();
	var $btncat = $push.find('[name=mute-cat]');
	var idcat = parseInt($btncat.attr('cat'));
	if (!idcat) $btncat.remove();
	$push.find('.baACcupomMute').show();
}
function baAC_escondeDivMute(ev) {
	var $push = baPush_getDiv(ev);
	$push.find('.baACcupomMute').hide();
	$push.find('.baACcupomMuteAll').hide();
	$push.find('.baACcupomContent').show();
}
function baAC_mutaLoja(ev) {
	var $push = baPush_getDiv(ev);
	var $btn = $push.find('[name=mute-loja]');
	var idloja = parseInt($btn.attr('loja'));
	baAC_fade($push);
	browser.runtime.sendMessage({'event':'baAC_mutaLoja',loja:idloja},feed => {
	});
}
function baAC_mutaCategoria(ev) {
	var $push = baPush_getDiv(ev);
	var $btn = $push.find('[name=mute-cat]');
	var idcat = parseInt($btn.attr('cat'));
	baAC_fade($push);
	browser.runtime.sendMessage({'event':'baAC_mutaCategoria',categoria:idcat},feed => {
	});
}
function baAC_perguntaMuteAll(ev) {
	var $push = baPush_getDiv(ev);
	$push.find('.baACcupomMute').hide();
	$push.find('.baACcupomMuteAll').show();
}
function baAC_muteAll(ev) {
	var $push = baPush_getDiv(ev);
	baAC_fade($push);
	browser.runtime.sendMessage({'event':'baAC_mutaAll'},feed => {
	});
}
function baAC_fade($push) {
	$push.removeClass('ba-fade-in').css('opacity',0.5);
	$push.find('.baAC-clickable').removeClass('baAC-clickable').addClass('baAC-disable').attr('disabled',true);
}