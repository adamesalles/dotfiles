var baExtURL = chrome.extension.getURL('');
var baMainSelector = '.R9yL7ufzNM3bVynpth8X';
var baGenericSelector = '.baPushGenericDiv';
var baQtyTotal = 0;
var baPushCodes = [];
window.addEventListener("beforeunload",function(e) {
	chrome.runtime.sendMessage({event:'tabClosed'});
});
function baPush_testPush() {
	baPush_showPush({
		data: {
			code: 'OMG123',
			duration: -1,
			imagem: 'https://wow.zamimg.com/images/icons/class-crests/x75/3.png'
		}
	});
}
function baPush_requestImgData(url) {
	return new Promise(resolve => {
		chrome.runtime.sendMessage({event:'getImageData',url},base64 => {
			resolve(base64);
		});
	});
}
async function baPush_showPush(request) {
	
	var data = request.data;
	data.root = baExtURL;
	var code = request.data.code;
	var custom = request.data.custom;
	if (!code) code = custom;
	
	var $body = $(document.body);
	var $push = $('<div>',{class:'R9yL7ufzNM3bVynpth8X baPushGenericDiv'}).appendTo($body);
	$push.data('push',data);
	$push.attr('cpush',code);
	$push.attr('code',code);
	$push.attr('npush',baQtyTotal);
	baQtyTotal++;
	var imagem = request.data.imagem;
	if (imagem && !imagem.includes('base64')) request.data.imagem = await baPush_requestImgData(imagem);
	
	baPush_setBottom($push);
	$push.load(baExtURL+'tpl/push.html',function() {
		
		baMisc_setDivValues($push,data);
		
		if (data.imagem) {
			var img = new Image();
			
			img.onload = function() {
				
				$push.css({display:'inline-block',opacity:0});
				
				$push.addClass('ba-fade-in');
			};
			img.src = data.imagem;
		} else {
			$push.css({display:'inline-block',opacity:0});
			$push.addClass('ba-fade-in');
		}
		data._duration = data.duration;
		var iSegundo = 1000;
		var iMinuto = iSegundo*60;
		var iHora = iMinuto*60;
		var iDia = iHora*24;
		function trySettingTimeout() {
			var dtNow = new Date().getTime();
			var qtPassed = dtNow - data.dtreceived;
			data.duration = data._duration - qtPassed;
			if (data.duration/iDia > 1) {
				setTimeout(trySettingTimeout,iHora);
				return;
			}
			setTimeout(function() {
				chrome.runtime.sendMessage({event:'pushClose',code:code});
				baPush_fadeOut($push);
			},data.duration);
		}
		if (data._duration != -1) trySettingTimeout();
	});
}
function baPush_gotPush(request) {
	var $body = $(document.body);
	if (!$body.length) return setTimeout(baPush_gotPush.bind(null,request),10);
	var code = request.data.code;
	var custom = request.data.custom;
	var again = request.data.again;
	if (!code) code = custom;
	if (again) {
		var $push = $("[cpush="+code+"]");
		if ($push.length) baPush_fadeOut($push,true);
	} else {
		if (baPushCodes.indexOf(code) >= 0) {
			return;
		}
	}
	baPushCodes.push(code);
	$('.baPushStyle'+baMainSelector).remove();
	
	var $head = $(document.head);
  	var $style = $('<style>',{class:'baPushStyle'+baMainSelector}).appendTo($head);
	let rules = [
		baMainSelector+'[code="'+code+'"] { background: '+request.colors.primary+' !important; }',
		baMainSelector+'[code="'+code+'"] .kWtYcurAYM7uIgX1szUU { border-color: '+request.colors.primary+' !important; background: '+request.data.corfundo+' !important; }',
		baMainSelector+'[code="'+code+'"] .N67WQZpHuDn { border-left-color: '+request.data.corfundo+' !important; }',
		baMainSelector+'[code="'+code+'"] .baConfirmMute { background: '+request.colors.tertiary+' !important; }',
		baMainSelector+'[code="'+code+'"] .baConfirmMute:hover { background: '+request.colors.tertiary_hover+' !important; }',
	];
	var styleSheet = $style[0].sheet;
	rules.forEach(rule => {
		styleSheet.insertRule(rule,styleSheet.cssRules.length);
	});
	
	baPush_showPush(request);
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.event == "showPush") {
		baPush_gotPush(request);
		
		sendResponse({status:true});
	}
	if (request.event == "removePush") {
		var $push = $('[cpush='+request.code+']');
		baPush_fadeOut($push);
	}
});
function baPush_setBottom($push,bAnimate) {
	var npush = $push.attr('npush');
	var height = $(baGenericSelector).height();
	var bottom = 20 + (height+10)*npush;
	var fn = (bAnimate) ? 'animate' : 'css';
	$push[fn]({'bottom':bottom});
}
function baPush_getDiv(e) {
	return $(e.target).parents(baGenericSelector);
}
function baPush_clickClose(e) {
	e.stopPropagation();
	
	var $push = $(e.target).parents(baGenericSelector);
	var code = $push.attr('code');
	if (!code) return;
	baPush_fadeOut($push);
	chrome.runtime.sendMessage({event:'pushClose',code:code});
}
function baPush_fadeOut($push,instant) {
	if (!$push.length) return;
	if ($push.attr('hiding') == '1') return;
	$push.attr('hiding',1);
	
	if (instant) {
		$push.attr('hiding',0);
		$push.remove();
	} else {
		$push.removeClass('ba-fade-in').addClass('ba-fade-out');
		setTimeout(function() {
			$push.attr('hiding',0);
			$push.remove();
		},700);
	}
	
	baPush_moveOthers($push);
}
function baPush_moveOthers($push) {
	var nclose = parseInt($push.attr('npush'));
	$(baGenericSelector).each(function() {
		var $other = $(this);
		var npush = parseInt($other.attr('npush'));
		if (npush > nclose) {
			$other.attr('npush',npush-1);
			baPush_setBottom($other,true);
		}
	});
	baQtyTotal--;
	if (baQtyTotal < 0) baQtyTotal = 0;
}
function baPush_clickClick(e) {
	
	var $push = $(e.target).parents(baMainSelector);
	
	if ($push.hasClass('showingMute')) return;
	
	var code = $push.attr('code');
	if (!code) return;
	
	chrome.runtime.sendMessage({event:'pushClick',code:code});
	
	var $link = $push.find('.MPR7mLB1PewLink');
	$link[0].click();
	
	baPush_moveOthers($push);
	
	$push.remove();
}
function baPush_clickHiddenLink(e) {
	e.stopPropagation();
}
function baPush_showMenuMute(e) {
	e.stopPropagation();
	var $push = $(e.target).parents(baMainSelector).addClass('showingMute');
	var $img = $push.find('.kWtYcurAYM7uIgX1szUU');
	var $content = $push.find('.MPR7mLB1Pew')
	var $title = $push.find('.B8EOEZqkPFH');
	var $text = $push.find('.PyLbF3Gup80v3y6');
	var $muting = $push.find('.JYYwKnfsnd');
	var $faMute = $push.find('.aD4Df36lzcfsiEdSsL');
	var $faClose = $push.find('.kVfyh4Ll5wJbFs0qRCM');
	var $faBack = $push.find('.WrSc3PC8wMheNLM');
	var code = $push.attr('code');
	if (!code) return;
	$faMute.hide();
	$faClose.hide();
	$text.hide();
	$img.animate({'left':-120});
	$content.css({'width':405}).animate({'left':5});
	$title.css('opacity',0).html('Silenciar notificações por...').animate({'opacity':1});
	$faBack.css({'opacity':0,'display':'block'}).animate({'opacity':1});
	$muting.css({'opacity':0,'display':'block'}).animate({'opacity':1});
}
function baPush_hideMenuMute(e) {
	e.stopPropagation();
	var $push = $(e.target).parents(baMainSelector).removeClass('showingMute');
	var data = $push.data('push');
	var titulo = data && data.titulo || $push.attr('titulo');
	var $img = $push.find('.kWtYcurAYM7uIgX1szUU');
	var $content = $push.find('.MPR7mLB1Pew');
	var $title = $push.find('.B8EOEZqkPFH');
	var $text = $push.find('.PyLbF3Gup80v3y6');
	var $muting = $push.find('.JYYwKnfsnd');
	var $faMute = $push.find('.aD4Df36lzcfsiEdSsL');
	var $faClose = $push.find('.kVfyh4Ll5wJbFs0qRCM');
	var $faBack = $push.find('.WrSc3PC8wMheNLM');
	$faBack.hide();
	$muting.hide();
	$img.animate({'left':0});
	$content.animate({'left':130,'width':280});
	$title.css('opacity',0).html(titulo).animate({'opacity':1});
	$text.css({'opacity':0,'display':'block'}).animate({'opacity':1});
	$faMute.css({'opacity':0,'display':'block'}).animate({'opacity':1});
	$faClose.css({'opacity':0,'display':'block'}).animate({'opacity':1});
}
function baPush_clickConfirmMute(e) {
	e.stopPropagation();
	var $push = $(e.target).parents(baMainSelector);
	var value = $push.find('[name=duracao]:checked').val();
	if (!value) return;
	var code = $push.attr('code');
	if (!code) return;
	chrome.runtime.sendMessage({event:'pushMuted',code:code,duration:value});
	$push.removeClass('showingMute');
	baPush_fadeOut($push);
}
function baPush_checkVisibility(e) {
	var v = document.visibilityState;
	if (v == 'visible') chrome.runtime.sendMessage({event:'pageVisible'});
}
$(document).on('visibilitychange',function() {
	baPush_checkVisibility();
});
$(document).on('click','.kVfyh4Ll5wJbFs0qRCM',baPush_clickClose);
$(document).on('click','.WrSc3PC8wMheNLM',baPush_hideMenuMute);
$(document).on('click','.aD4Df36lzcfsiEdSsL',baPush_showMenuMute);
$(document).on('click','.baConfirmMute',baPush_clickConfirmMute);
$(document).on('click','.MPR7mLB1PewLink',baPush_clickHiddenLink);
$(document).on('click',baMainSelector,baPush_clickClick);
baPush_checkVisibility();
