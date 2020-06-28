if (typeof browser === 'undefined') browser = chrome;
baCupom_SIDs = [];
baCupom_toApply = [];
baCupom_Token = $('input[name="_csrf_token_"]').val();
function baCupomCustom_Aliexpress() {
	ba_info(agora(),'baCupomCustom_Aliexpress');
				
	baCupom_progressDefault = 'Estamos aplicando os descontos encontrados...';			
	baCupomCustom_Aliexpress_checkTotal();
	var storeLS = LS.get('store') || {};
	storeLS.storeseo = 'aliexpress';
	LS.set('store',storeLS);
	
	var $tables = $('table.item-group');
	if (!$tables.length) return;	
	if (storeLS.done) return;
	
	var action = baCupom_checkUpdateFlag();		
	if (action === 'keepgoing' && storeLS.confirmed) return baCupomCustom_Aliexpress_beginApply();
	if (action === 'ribbon' && storeLS.cupons && storeLS.cupons.length) return baCupomCustom_Aliexpress_mostraRibbon();	
				
	$tables.each(function() {
		var $table = $(this);
		var sid = $table.data('s-id');		
		
		var code = $('.currency').text();
		var preco_txt = $table.find('.product-price-title-multi').text() || $table.find('.product-price-total.ui-cost').text();
		var preco_vlr = baCupomCustom_Aliexpress_getCurrency(code,preco_txt);
		
		baCupom_SIDs.push({'sid':sid,'total':preco_vlr});
	});
	
	for (var i = 0; i < baCupom_SIDs.length; i++) {
		var obj = baCupom_SIDs[i];
		baCupomCustom_Aliexpress_GetSID(obj);
	}
}
function baCupomCustom_Aliexpress_mostraRibbon() {
	ba_info(agora(),'baCupomCustom_Aliexpress_mostraRibbon()');	
	var storeLS = LS.get('store');	
	
	var data = {};
	data.qtde = storeLS.cupons.length;
	data.txtquestion = baCupom_getTextQuestion();
	data.txtbutton = baCupom_getTextConfirm();	
	if (!data.qtde) return;					
	baCupom_createRibbon(storeLS,data,baCupomCustom_Aliexpress_beginApply);
}
function baCupomCustom_Aliexpress_GetSID(obj) {	
	ba_info(agora(),'baCupomCustom_Aliexpress_GetSID',obj);
	$.get('https://promotion.aliexpress.com/ajax_get_seller_coupon_activity_list_4_shopcart.do?sid='+obj.sid,function(script) {
		window.SHOPCART_SCAL_JSONP_TEXT = null; 
		var feed = window.SHOPCART_SCAL_JSONP_TEXT;
		baCupomCustom_Aliexpress_GotSID(obj,feed);
	}).fail(function(feed) {	
		baCupomCustom_Aliexpress_GotSID(obj,{'success':false,'error':feed.responseText});
	});
}
function baCupomCustom_Aliexpress_GotSID(obj,feed) {
	ba_info(agora(),'baCupomCustom_Aliexpress_GotSID',obj,feed);
	obj.success = feed.success;
	obj.done = true;
	if (feed.success === true) obj.cupoms = feed.sellerCouponActivityList;		
	
	var waiting = baCupom_SIDs.filter(function(row) { if (!row.done) return true; });
	if (waiting.length === 0) baCupomCustom_Aliexpress_cuponsReady();
}
function baCupomCustom_Aliexpress_getDate(cup,tipo) {
	if (tipo === 1) {
		var vlr = cup.couponConsumeStartDate;		
		var aux = '00:00:00';
	}
	if (tipo === 2) {
		var vlr = cup.couponConsumeEndDate || cup.expireTime;
		var aux = '00:00:00';
	}
	
	if (!vlr) return;
	
	var pts = vlr.split(' ');
	if (pts.length === 1) vlr = vlr + ' ' + aux;	
	return new Date(vlr);
}
function baCupomCustom_Aliexpress_getCurrency(code,txt) {	
	
	var txt2 = txt.replace(/[^\d.,]/g,'');
	var pts = txt2.split(',');
	var usa = false;
	if (pts[1] && pts[1].replace(/[^\d]/g,'').length === 2) usa = true;
	
	pts = pts.map(function(pt) { return (pt[0] === '.') ? pt.substring(1) : pt; });
	txt = pts.join(',');
		
	return (usa) ? convertePreco(txt) : parseFloat(txt.replace(/[^\d.]/g, ''));
}
function baCupomCustom_Aliexpress_cuponsReady() {
	ba_info(agora(),'baCupomCustom_Aliexpress_cuponsReady');
		
	var storeLS = LS.get('store') || {};
	storeLS.cupons = [];
	
	for (var i = 0; i < baCupom_SIDs.length; i++) {
		var obj = baCupom_SIDs[i];
		ba_info(agora(),'total',obj.total);	
		
		var list = [];
		
		for (var j = 0; j < obj.cupoms.length; j++) {
			var cup = obj.cupoms[j];
			cup.sid = obj.sid;
			
			var cupom_min = baCupomCustom_Aliexpress_getCurrency(cup.displayCurrencyCode,cup.displayCurrencyLimitStr);
			
			var code = cup.displayCurrencyCode;
			var cupom_min = baCupomCustom_Aliexpress_getCurrency(code,cup.displayCurrencyLimitStr);
			
			var dtnow = new Date();
			var dt1 = baCupomCustom_Aliexpress_getDate(cup,1);
			var dt2 = baCupomCustom_Aliexpress_getDate(cup,2);
			
			var ok = true;			
			if (!(obj.total >= cupom_min)) ok = false;
			if (dt1 && !(dtnow >= dt1)) ok = false;
			if (dt2 && !(dtnow <= dt2)) ok = false;
			
			ba_info(agora(),code,cupom_min,ok);	
			if (ok) list.push(cup);
		}
		
		if (list.length) {		
			list.sort(function(a,b) { return (a.couponAmt > b.couponAmt) ? -1 : +1; });
			var best = list[0];
			if (best.acquirable) storeLS.cupons.push(best);
		}
	}
	
	LS.set('store',storeLS);
		
	if (storeLS.cupons.length) {
		var data = {'qtde':storeLS.cupons.length, 'cdn':baCupom_CDN, 'storeseo':'aliexpress','txtquestion':baCupom_getTextQuestion(),'txtbutton':baCupom_getTextConfirm()};	
		baMisc_openDiv('found.html',data);	
	}
}
function baCupomCustom_Aliexpress_confirmApply() {
	ba_info(agora(),'baCupomCustom_Aliexpress_confirmApply');
	
	var storeLS = LS.get('store') || {};
	
	var data = {'cdn':baCupom_CDN, 'storeseo':storeLS.storeseo};
	baMisc_openDiv('apply.html',data);	
			
	var dtAgora = new Date().getTime();
	LS.set('lastupdate',dtAgora);
	LS.set('flagOK',1);		
	
	browser.runtime.sendMessage({'event':'setCheckout', 'href':location.href, 'flag':'confirmado'},function() {				
		storeLS.confirmed = true;
		LS.set('store',storeLS);	
		
		chrome.runtime.sendMessage({'event':'getEnv'},function(data) {		
			ba_AliExpress_ENV = data;			
			href = 'pt.aliexpress.com';
			location.href = 'https://'+ba_AliExpress_ENV.env.host+'/getdiscount-aliexpress/'+href+'/';
		});
		
	});
}
function baCupomCustom_Aliexpress_beginApply() {
	ba_info(agora(),'baCupomCustom_Aliexpress_beginApply');	
	var storeLS = LS.get('store');
	
	for (var i = 0; i < storeLS.cupons.length; i++) {
		baCupom_toApply.push(storeLS.cupons[i]);
	}
	
	baCupomCustom_Aliexpress_applyNext();
}
function baCupomCustom_Aliexpress_getButtonToggle(cup) {
	return $('table.item-group[data-s-id='+cup.sid+'] .j-store-coupon-tip');
}
function baCupomCustom_Aliexpress_getButtonApply(cup) {
	return $('table.item-group[data-s-id='+cup.sid+'] input[data-activity-id='+cup.activityId+']');
}
function baCupomCustom_Aliexpress_applyNext() {
	ba_info(agora(),'baCupomCustom_Aliexpress_applyNext');
	var cup = baCupom_toApply.shift();
	var storeLS = LS.get('store');
	
	if (cup) {		
		var total = storeLS.cupons.length;
		var n = total - baCupom_toApply.length;
		var p = n*100/total;
		
		var data = {'action':'Aplicando', 'total':total, 'ncupom':n, 'prcupom':p, 'cdn':baCupom_CDN, 'storeseo':storeLS.storeseo};
		data.texto = baCupom_progressDefault;
		baMisc_openDiv('progress.html',data);
		
		var $toggle = baCupomCustom_Aliexpress_getButtonToggle(cup);
		$toggle.eq(0).click(); 
		baCupomCustom_Aliexpress_waitDiv(cup);
	} else {			
		var total = 0;
		for (var i = 0; i < storeLS.cupons.length; i++) {
			var cup = storeLS.cupons[i];
			total += cup.couponAmt;
		}		
		
		var data = {'desconto':total,'symbol':'$','extra':'Clique em Comprar tudo para visualizar o desconto.'};					
		baMisc_openDiv('success.html',data);
		LS.set('flagOK',1);	
		
		storeLS.done = true;
		LS.set('store',storeLS);
	}
}
function baCupomCustom_Aliexpress_waitDiv(cup) {
	ba_info(agora(),'baCupomCustom_Aliexpress_waitDiv',cup);
	var $toggle = baCupomCustom_Aliexpress_getButtonToggle(cup);
	var $btn = baCupomCustom_Aliexpress_getButtonApply(cup);
	if ($btn.length) {
		$btn.eq(0).click(); 
		$toggle.eq(0).click(); 
		setTimeout(function() { baCupomCustom_Aliexpress_applyNext(); },2000);
	} else {
		setTimeout(function() { baCupomCustom_Aliexpress_waitDiv(cup); },100);
	}
}
function baCupomCustom_Aliexpress_checkTotal() {
	var code = $('.currency').text();
	var total_txt = $('.total-price-multi').text() || $('.total-price.ui-cost').text();			
	var total_vlr = baCupomCustom_Aliexpress_getCurrency(code,total_txt);
	var total_last = LS.get('lasttotal');
	if (!total_last || total_last != total_vlr) {
		ba_log(agora(),'total_vlr != lasttotal, resetando store');
		LS.set('store',null);
	}
	LS.set('lasttotal',total_vlr);
}