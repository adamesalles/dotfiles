// // ===================================================================
// Função pra verificar se o storeLS é de uma loja especial
// ===================================================================
var LS = new baLocalStorage('autocupom');
var baCupom_storeTypes = {
	'centauro': {ids:[6],			refresh:true,	startreloading:true},
	'b2w':		{ids:[14,17,19],	refresh:true,	startreloading:true},
	'gearbest': {ids:[232],			refresh:false,	startreloading:true},
	'printi':	{ids:[212],			refresh:true,	startreloading:true},
	'natura':	{ids:[153],			refresh:true,	startreloading:false}
};
function baCupom_getStoreType(storeLS) {
	if (!storeLS) return false;
	var storeType = null;
	var iLoja = parseInt(storeLS.idloja);
	Object.keys(baCupom_storeTypes).forEach(function(key) {
		var type = baCupom_storeTypes[key];
		if (type.ids && type.ids.indexOf(iLoja) >= 0) storeType = key;
	});
	return storeType;
}
function baCupom_needRefresh(storeLS) {
	var storeType = baCupom_getStoreType(storeLS);
	if (!storeType) return false;
	var oType = baCupom_storeTypes[storeType];
	return oType.refresh;
}
function baCupom_canStartReloading(storeLS) {
	var storeType = baCupom_getStoreType(storeLS);
	if (!storeType) return true;
	var oType = baCupom_storeTypes[storeType];
	return oType.startreloading;
}
function getHeaderToken(name,prefix) {
	if (!prefix) prefix = 'header';
	var metaname = prefix+'-'+name;
	return getMetaContent(metaname);
}
function getMetaContent(metaname) {
	var meta = document.querySelector("meta[name='"+metaname+"']");
	if (meta) return meta.content;
}
function getMetaParams() {
	var dslist = getMetaContent('request-params') || '[]';
	return JSON.parse(dslist);
}
// ===================================================================
// NATURA
// ===================================================================
function setHeadersNatura(request) {
	var sAuth = getHeaderToken('authorization');
	var sToken = getHeaderToken('access_token');
	var sClientID = getHeaderToken('client_id');
	request.setRequestHeader("authorization", sAuth);
	request.setRequestHeader("access_token", sToken);
	request.setRequestHeader("client_id", sClientID);
	request.setRequestHeader("accept", '*/*');
	request.setRequestHeader("content-Type", 'application/json');
}
window.baCupom_getPrecoAtual_natura = function() {
	return new Promise(function(resolve) {
		var list = getMetaParams();
		var request = list.find(d => d && d.operationName == 'CurrentOrder');
		var variables = request && request.variables;
		var extensions = request && request.extensions;
		$.ajax({
			type: 'GET',
			url: 'https://apigql.natura.com.br/ecommerce/graphql?operationName=CurrentOrder&variables='+variables+'&extensions='+extensions,
			beforeSend: setHeadersNatura,
			complete: function(feed) {
				var data = feed.responseJSON;
				try {
					var price = data.data.atg.order.priceInfo.total;
					resolve(price);
				} catch(e) {
					resolve(0);
				}
			}
		});
	});
};
var waitingFakeNatura = false;
baCupom_makefake_natura = function() {
	return new Promise(resolve => {
		var list = getMetaParams();
		var request = list.find(d => d && d.operationName == 'AddCoupon');
		if (request) {
			resolve(request);
			return;
		}
		if (waitingFakeNatura) {
			setTimeout(() => baCupom_makefake_natura().then(resolve),100);
			return;
		}
		waitingFakeNatura = true;
		var store = LS.get('store');
		var inputEl = jQuery(store.checkout.selectorinput)[0];
		var buttonEl = jQuery(store.checkout.selectorbtn)[0];
		inputEl.value = store.void || baCupom_getVoid();
		inputEl.dispatchEvent(new KeyboardEvent('change',{bubbles:true}));
		buttonEl.click();
		baCupom_makefake_natura().then(resolve);
	});
};
window.baCupom_apply_natura = function(cupom,resolve) {
	baCupom_makefake_natura().then(request => {
		var extensions = request && request.extensions;
		var dtPost = {
			'extensions':extensions,
			'variables':{'couponCode':cupom.codigo},
			'operationName':'AddCoupon'
		};
		$.ajax({
			type: 'POST',
			url: 'https://apigql.natura.com.br/ecommerce/graphql',
			data: JSON.stringify(dtPost),
			beforeSend: setHeadersNatura,
			complete: function(feed) {
				resolve('ready');
			}
		});
	});
};
// ===================================================================
// CENTAURO
// ===================================================================
function getOptionsCentauro(customOptions,customHeaders) {
	var sAuth = getHeaderToken('Authorization');
	var sToken = getHeaderToken('x-client-token');
	var sCV = getHeaderToken('x-cv-id');
	var options = {
		"credentials":"include",
		"headers":{			
			"accept":"application/json, text/plain, */*",	
			"authorization": sAuth,
			"sec-fetch-mode": "cors",
			"x-client-token": sToken,
			"x-cv-id": sCV,
		},
		"referrer":"https://www.centauro.com.br/checkouts/carrinho",
		"referrerPolicy":"no-referrer-when-downgrade",
		"body":null,
		"method":"GET",
		"mode":"cors"
	};
	if (customOptions) Object.keys(customOptions).forEach(key => options[key] = customOptions[key]);
	if (customHeaders) Object.keys(customHeaders).forEach(key => options.headers[key] = customHeaders[key]);
	return options;
}
window.baCupom_getPrecoAtual_centauro = function() {	
	return new Promise(resolve => {
		var url = "https://apigateway.centauro.com.br/ecommerce/v4.2/carrinhos";
		var options = getOptionsCentauro();
		
		CustomEvents.fetch(url, options).then(data => {
			var price = data && convertePreco(data.total) || 0;
			resolve(price);
		});
	});
};
window.baCupom_apply_centauro = function(cupom,resolve) {
	var url = "https://apigateway.centauro.com.br/ecommerce/v4.2/carrinhos/promocodes";
	var method = 'POST';
	var body = JSON.stringify({'codigoPromocode':cupom && cupom.codigo});
	var headers = {'Content-Type':'application/json;charset=UTF-8'};
	var options = getOptionsCentauro({method,body},headers);
	CustomEvents.fetch(url, options).then(data => {
		resolve('ready');
	});
	return true;
};
// ===================================================================
// GEARBEST
// ===================================================================
window.baCupom_getStoreTrack_gearbest = function(storeTrack,resolve) {
	baMisc_getPageVariable('GLOBAL').then(async function(gbGLOBAL) {
		var regex = /https:\/\/ad.zanox.com\/ppc\/\?\w+&ulp=\[\[https:\/\/www\.gearbest\.com\/[\w-]+/gm;
		var m = regex.exec(storeTrack);
		if (m) {
			// significa que a url está no formato correto
			storeTrack = storeTrack.replace('https://www.gearbest.com',gbGLOBAL.DOMAIN_MAIN);
			// então vamos trocar a url pra domain_main e retornar o valor
			resolve(storeTrack);
		}
		var envData = await getEnvData();
		var prefix = (envData.ambiente == 'www') ? '' : envData.ambiente+'.';
		resolve('https://'+prefix+envData.host+'/tracking?url='+encodeURIComponent(gbGLOBAL.DOMAIN_MAIN));
	});
}
window.baCupom_getPrecoAtual_gearbest = function(cupom) {
	return new Promise(function(resolve) {
		baMisc_getPageVariable('payVars').then(function(payVars) {
			baMisc_getPageVariable('EXCHANGERATE').then(function(EXCHANGERATE) {
				var rate = EXCHANGERATE.find(x => x.currencyCode == 'BRL');
				baCupom_isCupomAplicado_gearbest(cupom).then(function(isAplicado) {
					var storeLS = LS.get('store');
					if (!isAplicado && storeLS.precooriginal) {
						resolve(storeLS.precooriginal);
						return;
					}
					$.ajax({
						type: 'POST',
						url: 'https://order.gearbest.com/checkout/list',
						data: {'couponCode':cupom && cupom.codigo},
						success: function(feed) {
							var t = feed.data.total;
							var r = t.goodsAmount + t.shippingAmount - t.discountAmount;
							resolve(r*rate.currencyRate);
						}
					});
				});
			});
		});
	});
}
window.baCupom_apply_gearbest = function(cupom,resolve) {
	// no processo de testes não é necessário fazer nada aqui porque o 'check' acaba por aplicar o cupom
	var store = LS.get('store');
	// se estiver na hora de aplicar o melhor cupom, vamos retornar false assim ele faz o fluxo normal usando os selectors
	if (store.done) return false;
	resolve('ready');
	return true;
}
window.baCupom_isCupomAplicado_gearbest = function(cupom) {
	return new Promise(function(resolve) {
		if (!cupom) {
			resolve(false);
			return;
		}
		$.ajax({
			type: 'POST',
			url: 'https://order.gearbest.com/checkout/list',
			data: {'couponCode':cupom.codigo},
			success: function(feed) {
				resolve(feed.data.total.discountAmount);
			}
		});
	});
}
// ===================================================================
// B2W
// ===================================================================
function baCupom_b2w_endpoint(tipo) {
	var dd = document.domain;
	dd = dd.replace('www.','');
	var baseCart = 'https://'+dd+'/api/v3/cart';
	var baseCheckout = 'https://'+dd+'/api/v1/restql/run-query/checkout/checkout-with-primepricing/3?checkoutId=';
	var storeLS = LS.get('store');
	if (storeLS.idloja == '17') {
		baseCart = 'https://api.shoptime.com.br/v3/cart';
	}
	if (tipo == 'cart') return baseCart;
	if (tipo == 'checkout') return baseCheckout;
}
window.baCupom_getPrecoAtual_b2w = function(cupom) {
	var baseCheckout = baCupom_b2w_endpoint('checkout');
	return new Promise(function(resolve) {
		baMisc_getPageVariable('cage_global_variable').then(function(cage_global_variable) {
			var cartId = cage_global_variable.cart.id;
			var checkoutId = cage_global_variable.checkout.id;
			baCupom_isCupomAplicado_b2w(cupom,cartId).then(function(isAplicado) {
				var storeLS = LS.get('store');
				if (!isAplicado && storeLS.precooriginal) {
					resolve(storeLS.precooriginal);
					return;
				}
				$.ajax({
					type: 'GET',
					url: baseCheckout+checkoutId,
					success: function(feed) {
						var r = feed.checkout.result;
						var total = r.amountDue - r.freight.price;
						resolve(total);
					},
					error: function() {
						resolve(storeLS.precooriginal || 0);
					}
				});
			});
		});
	});
}
window.baCupom_apply_b2w = function(cupom,resolve) {
	var baseCart = baCupom_b2w_endpoint('cart');
	baMisc_getPageVariable('cage_global_variable').then(function(cage_global_variable) {
		var cartId = cage_global_variable.cart.id;
		$.ajax({
			type: 'PUT',
			url: baseCart+'/'+cartId+'/coupon/'+cupom.codigo,
			complete: function() { resolve('ready'); }
		});
	});
	return true;
}
window.baCupom_isCupomAplicado_b2w = function(cupom,cartId) {
	var baseCart = baCupom_b2w_endpoint('cart');
	var storeLS = LS.get('store');
	return new Promise(function(resolve) {
		if (cupom) {
			$.ajax({
				type: 'GET',
				url: baseCart+'/'+cartId,
				success: function(feed) {
					var flag = (feed && feed.coupon && feed.coupon.id == cupom.codigo);
					resolve(flag);
				},
				error: function() {
					resolve(false);
				}
			});
		} else {
			// se já terminamos o fluxo, NÃO vamos deletar o cupom (pq isso iria remover o cupom aplicado com desconto)
			if (storeLS.done) {
				resolve(false);
				return;
			}
			$.ajax({
				type: 'DELETE',
				url: baseCart+'/'+cartId+'/coupon',
				success: function() {
					resolve(false);
				},
				error: function() {
					resolve(false);
				}
			});
		}
	});
}
// ===================================================================
// PRINTI
// ===================================================================
window.baCupom_apply_printi = function(cupom,resolve) {
	$.ajax({
		type: 'POST',
		url: 'https://www.printi.com.br/v2/cart/voucher/'+cupom.codigo,
		complete: function() { resolve('ready'); }
	});
	return true;
};
window.baCupom_getPrecoAtual_printi = function(cupom) {
	return new Promise(resolve => {
		var storeLS = LS.get('store');
		$.ajax({
			type: 'GET',
			url: 'https://www.printi.com.br/v2/cart',
			success: function(feed) {
				let seo = feed.seo;
				if (!cupom || cupom.codigo == seo.discountCode) {
					resolve(seo.cartTotalValue);
				} else {
					resolve(storeLS.precooriginal || 0);
				}
			}, error: function() {
				resolve(storeLS.precooriginal || 0);
			}
		});
	});
};
