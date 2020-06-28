
let baAC_msgPerm1 = "As vezes temos avisos. Você quer ver avisos as vezes?";
let baAC_msgPerm2 = "Ops, estou confuso. Você tinha aceitado os avisos e então negou. Poderia responder de novo se quer avisos?";
let avisocupons_permission = {permissions: ['xxxxxxxxxxxx']};
function avisocupons_initPermission() {
	var permissao = getter.lsget('avisocupons','permissao');
	if (permissao == 'enabled') return;
	if (permissao == 'denied') return;
	client.deletePushByTag('cupom');
	browser.permissions.contains(avisocupons_permission,flag => {
		if (flag) {
			getter.lsset('avisocupons','permissao','enabled');
		} else {
			client.deletePushByCode('ACretry');
			client.gotPush({code:'ACask', custom:'avisocupons_permissao', mensagem:baAC_msgPerm1, duration:-1});
		}
	});
}
function avisocupons_retryPermission() {
	client.deletePushByCode('ACask');
	client.deletePushByCode('ACretry');
	client.gotPush({code:'ACretry', custom:'avisocupons_permissao', mensagem:baAC_msgPerm2, duration:-1, again:true});
}
function avisocupons_askPermission(callback) {
	browser.permissions.request(avisocupons_permission,flag => {
		callback(flag);
	});
}
function avisocupons_gotPermission() {
	client.deletePushByCode('ACask');
	client.deletePushByCode('ACretry');
	getter.lsset('avisocupons','permissao','enabled');
}
function avisocupons_denyPermission() {
	client.deletePushByCode('ACask');
	client.deletePushByCode('ACretry');
	getter.lsset('avisocupons','permissao','denied');
}
function avisocupons_verificaLista(feed) {
	return;
	var permissao = getter.lsget('avisocupons','permissao');
	if (permissao != 'enabled') {
		client.deletePushByCode('ACqtde');
		return;
	}
	let mute_all = getter.lsget('avisocupons','muteall','int') || 0;
	if (mute_all) return;
	let mutelojas = getter.lsget('avisocupons','mutelojas','json') || [];
	let mutecategorias = getter.lsget('avisocupons','mutecategorias','json') || [];
	let avisados = getter.lsget('avisocupons','avisados','json') || [];
	novos = feed.cupons.filter(a => {
		
		if (!a.idcategoria && !a.semcategoria) {
			
			return;
		}
		var aux = {};
		var ok = true;
		['id','titulo','idcategoria','semcategoria','idloja'].forEach(atr => aux[atr] = a[atr]);
		
		if (avisados.indexOf(a.id) >= 0) {
			ok = false;
		}
		
		if (mutelojas.indexOf(a.idloja) >= 0) {
			ok = false;
		}
		
		if (a.idcategoria && mutecategorias.indexOf(a.idcategoria) >= 0) {
			ok = false;
		}
		if (!ok) return;
		
		return true;
	});
	getter.lsset('avisocupons','novos',novos);
	var qtdeNovos = novos.length;
	client.deletePushByTag('cupom');
	if (qtdeNovos) {
		client.gotPush({code:'ACqtde', custom:'avisocupons_qtdenovos', qtde:qtdeNovos, duration:-1, again:true});
	} else {
		client.deletePushByCode('ACqtde');
	}
	getter.lsset('avisocupons','novos',novos);
}
function avisocupons_mostraLista() {
	client.deletePushByCode('ACqtde');
	client.deletePushByTag('cupom');
	let novos = getter.lsget('avisocupons','novos','json') || [];
	novos.forEach(p => {
		var cat = p.categorias && p.categorias[0];
		if (cat) {
			p.idcategoria = cat.id;
			p.nomecategoria = cat.nome;
		}
		p.tag = 'cupom';
		p.code = 'cupom'+(p.codigo || p.id).trim();
		p.custom = 'avisocupons_cupom';
		p.duration = -1;
		client.gotPush(p);
	});
}
function avisocupons_escondeAvisoQtde() {
	client.deletePushByCode('ACqtde');
}
function avisacupons_mutaLoja(loja,callback) {
	loja = parseInt(loja);
	let mutelojas = getter.lsget('avisocupons','mutelojas','json') || [];
	if (mutelojas.indexOf(loja) < 0) mutelojas.push(loja);
	getter.lsset('avisocupons','mutelojas',mutelojas);
	client.deletePushByLoja(loja);
	callback(true);
}
function avisacupons_mutaCategoria(categoria,callback) {
	categoria = parseInt(categoria);
	let mutecategorias = getter.lsget('avisocupons','mutelojas','json') || [];
	if (mutecategorias.indexOf(categoria) < 0) mutecategorias.push(categoria);
	getter.lsset('avisocupons','mutecategorias',mutecategorias);
	client.deletePushByCategoria(categoria);
	callback(true);
}
function avisacupons_mutaAll(callback) {
	getter.lsset('avisocupons','muteall',1);
	client.deletePushByTag('cupom');
	callback(true);
}
function avisocupons_init() {
	client.deletePushByTag('cupom');
	client.deletePushByCode('ACask');
	client.deletePushByCode('ACretry');
	client.deletePushByCode('ACqtde');
	return;
    browser.runtime.onMessage.addListener(function (request, sender, callback) {
		if (request.event == 'baAC_retryPermission') avisocupons_retryPermission();
		if (request.event == 'baAC_askPermission') avisocupons_askPermission(callback);
		if (request.event == 'baAC_gotPermission') avisocupons_gotPermission();
		if (request.event == 'baAC_denyPermission') avisocupons_denyPermission();
		if (request.event == 'baAC_mostraListaCupons') avisocupons_mostraLista();
		if (request.event == 'baAC_escondeAvisoQtde') avisocupons_escondeAvisoQtde();
		if (request.event == 'baAC_mutaLoja') avisacupons_mutaLoja(request.loja,callback);
		if (request.event == 'baAC_mutaCategoria') avisacupons_mutaCategoria(request.categoria,callback);
		if (request.event == 'baAC_mutaAll') avisacupons_mutaAll(callback);
		return true;
	});
	avisocupons_initPermission();
}