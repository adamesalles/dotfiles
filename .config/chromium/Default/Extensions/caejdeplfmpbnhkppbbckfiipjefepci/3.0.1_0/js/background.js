if (typeof browser === 'undefined') browser = chrome;
getter = new classGetter();
getter.durations({
	'headerStoreList':'1h',
	'storeList': '10m',
	'getdatalabel':'7d',
	'cupomListModified':'10m'
});
var env = {};
var config = {};
var ambiente = 'www'; 
var old = JSON.parse(localStorage.getItem('env') || '{}');
var fullstatic = 'https://4e4356b68404a5138d2d-33393516977f9ca8dc54af2141da2a28.ssl.cf1.rackcdn.com';
var mode = '';
var http = (ambiente == 'www') ? 'https' : 'http';
var sAfiliadoOrigem = localStorage.getItem('afiliado-origem');
var storeList = Array();
var selectorList = Array();
var cuponsById = {};
var extColors = {};
var extLabel = {};
var localid = null;
var urlAtual = null;
var nossosIDs = [];
var thisRow = null;
var manifest = browser.runtime.getManifest();
function getMyId() {
	return browser.runtime.getURL('').split('//')[1].split('/')[0];
}
function getAllExtensions(callback) {
	$.get('extensions.json').done(function(extensionIdsJson) {
		var my_id = getMyId();
		
		nossosIDs = extensionIdsJson;
		
		if (!nossosIDs.filter) nossosIDs = JSON.parse(nossosIDs);
		
		thisRow = nossosIDs.filter(function (row) { return row.id == my_id; })[0];
		
		if (!thisRow) {
			
			thisRow = {'id': my_id, 'name': manifest.name};
			
			nossosIDs.push(thisRow);
		};
		if (callback) callback();
	});
}
getAllExtensions();
tabs2close = [];
tabs2cupom = [];
function init() {
    listaTabs = {};
    window.dispatchEvent(new Event('runModules'));
    registraTab = function (tabId) {
        if (!listaTabs[tabId]) {
            listaTabs[tabId] = {'tabId': tabId, 'myscript': false, 'completed': false};
        }
    };
    finalizaTab = function (tabId) {
        listaTabs[tabId] = null;
    };
    verificaTab = function (tabId) {
        var tab = listaTabs[tabId];
        if (!tab.myscript)
            return;
        if (!tab.completed)
            return;
        if (storeList.length > 0) {
            var dataSend = {mensagem: "executar", sL: storeList, aB: ambiente, ht: http, hST: env.host, lId: localid};
            finalizaTab(tabId);
            browser.tabs.sendMessage(tabId, dataSend, function () {});
        } else {
            atualizaLista(tabId);
        }
    };
    checkoutDATA = {};
    tabsLOJA = {};
    browser.runtime.onMessage.addListener(function (request, sender, callback) {
        var tab = sender && sender.tab;
        var tabId = tab && tab.id || 0;
		
		
		
        if (request.event == 'reloadExtension' && (env.ambiente != 'www' || env.debug)) {
            callback(true);
            setTimeout(function () {
				getter.reset();
                browser.runtime.reload();
            }, 100);
        }
        if (request.event == 'myscriptReady') {
            var tabId = sender.tab.id;
            registraTab(tabId);
            listaTabs[tabId].myscript = true;
            listaTabs[tabId].completed = true;
            verificaTab(tabId);
            var dataReady = {};
            dataReady['afforigem'] = localStorage.getItem('afiliado-origem');
            callback(dataReady);
        }
        if (request.event == 'setLojaTab') {
            var flag = 0;
            var loja = request.idloja;
            if (loja) {
                if (tabsLOJA[tabId] == loja) {
                    flag = 1;
                } else {
                    checkoutDATA[tabId] = null;
                    flag = -1;
                }
                tabsLOJA[tabId] = loja;
            }
            callback(flag);
        }
        if (request.event == 'windowFocus') {
            urlAtual = request.url;
        }
		
		
		
        if (request.event == 'setCheckout') {
            delete request.event;
            var dtAgora = new Date().getTime();
            request.lastUpdate = dtAgora;
            checkoutDATA[tabId] = request;
            callback(true);
        }
        if (request.event == 'getCheckout') {
            if (!checkoutDATA[tabId])
                checkoutDATA[tabId] = {};
            var dtAgora = new Date().getTime();
            var lastUpdate = checkoutDATA[tabId].lastUpdate;
            var dtDiff = (dtAgora - lastUpdate) / 1000;
            if (!lastUpdate || dtDiff > 120) {
                
            }
            checkoutDATA[tabId].ambiente = ambiente;
            checkoutDATA[tabId].localid = localid;
            callback(checkoutDATA[tabId]);
        }
        if (request.event == 'getSelectorList') {
            callback(selectorList);
        }
        if (request.event == 'getCupomList') {
            confereCuponsLojas(tab);
        }
		if (request.event == 'getCupomListForced') {
            confereCuponsLojas(tab,true);
		}
		if (request.event == 'open_popunder') {
			browser.tabs.create({url: request.url, active:false},function(newtab) {
				tabs2close.push({'source':tabId,'popunder':newtab.id});
				callback({'status':'open'});
			});
		}
    });
	browser.tabs.onUpdated.addListener(function(tabId,info) {
		if (info.status === 'complete') {
			var entry1 = tabs2close.find(function(t) { return t.popunder == tabId; });
			if (entry1) {
				chrome.tabs.get(entry1.popunder, function (tab) {
					if (tab && tab.url && !tab.url.includes('https://redir.lomadee.com')) {
						browser.tabs.executeScript(entry1.popunder,{code:'baCupom_closeSelf()',runAt:'document_end'});
						browser.tabs.executeScript(entry1.source,{code:'baCupom_popunderClosed()',runAt:'document_end'});
						var index = tabs2close.indexOf(entry1);
						tabs2close.splice(index,1);
					} 
				});
			}
			var entry2 = tabs2cupom.find(function(t) { return t.popup == tabId; });
			if (entry2) {
				browser.tabs.executeScript(entry2.popup,{code:'baScript_showModalCupom()',runAt:'document_end'});
			}
		}
	});
    
    
    
    browser.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
        var ids = [];
        nossosIDs.forEach(function (row) {
            ids.push(row.id);
        });
        if (ids.indexOf(sender.id) >= 0)
            sendResponse(true);
    });
	avisocupons_init();
}
var qtFalhas = 0;
function checkExt(i) {
	
	var allSet = (nossosIDs && nossosIDs.length && thisRow) ? true : false;
	
	if (!allSet) {
		
		qtFalhas++;
		
		if (qtFalhas < 5) {
			
			getAllExtensions(function() {
				
				checkExt(i);
			});
			return;
		}
		
		var my_id = getMyId();
		thisRow = {'id': my_id, 'name': manifest.name};
		nossosIDs = [thisRow];
		i = 0;
	}
	qtFalhas = 0;
    if (!i) i = 0;
    var row = nossosIDs[i];
    if (row) {
        row.found = false;
        var protocol = browser.runtime.getURL('').split('://')[0];
        $.get(protocol+ '://' + row.id + '/lay/logo.png', function (feed) {
            row.found = true;
            browser.runtime.sendMessage(row.id, {}, function (flag) {
                row.running = flag || false;
                if (row.running) {
                    mode = 'secondary';
                    return;
                }
                checkExt(i + 1);
            });
        }).fail(function () {
            checkExt(i + 1);
        });
    } else {
        var firstID = null;
        nossosIDs.forEach(function (row) {
            if (row.found && !firstID)
                firstID = row.id;
        });
        if (firstID == thisRow.id) {
            mode = 'primary';
            init();
            clearInterval(checkInterval);
        } else {
            mode = 'secondary';
        }
    }
}
load_files(true).then(function() {
    if (env.url_remove) setUninstall();
    checkInterval = setInterval(checkExt, 5000);
    checkExt();
    
    
    
    atualizaLista = function (tabId) {
		
        var onFeedLista = function (feed) {
            storeList = feed;
            selectorList = {};
            cuponsById = {};
            storeList.forEach(function (loja) {
				if (typeof(loja.buscacupons) == 'undefined') loja.buscacupons = '1';
				['ativo','ativocupons','ativoplugin','buscacupons'].forEach(function(flag) {
					loja[flag] = (loja[flag] == '1') ? true : false;
				});
				if (loja.labels) {
					loja.labels = loja.labels.map(wlabel => wlabel.toString());
					loja.inlabel = loja.labels.indexOf(env.wid.toString()) >= 0;
				}
				if (!loja.inlabel) return;
                if (loja.cupons) {
                    loja.cupons.forEach(function (cupom) {
                        cupom.storeseo = loja.storeseo;
                        cuponsById[cupom.id] = cupom;
                    });
                }
                selectorList[loja.idloja] = {
                    'idloja': loja.idloja,
					'url': loja.url,
					'ativocupons': loja.ativocupons,
					'buscacupons': loja.buscacupons,
                    'storeseo': loja.storeseo,
                    'checkout': loja.checkout
                };
            });
            if (tabId)
                verificaTab(tabId);
        };
        var dtCacheArquivo = parseInt(getter.time('storeList'));
        var dtModifiedZip = parseInt(getter.feed('headerStoreList'));
        if (dtCacheArquivo < dtModifiedZip) {
            getter.log('O header foi modificado em ',formatDate(dtModifiedZip),' mas o arquivo foi alterado em ',formatDate(dtCacheArquivo));
            getter.log('Vamos resetar esses dados pra forçar uma atualização do storeList!');
            getter.resetkey('storeList');
            getter.resetkey('headerStoreList');
        }
        if (ambiente == 'www') {
			
            var caminho = fullstatic + '/extensions/storeList.zip';
            getter.modified({url:caminho, key:'headerStoreList', duration:'default'}).then(function(data) {
				
				
                var durr = (data.old) ? '1s' : '1y';
				
                getter.zipjson({url:caminho+'?dt='+dt, key:'storeList', type:'json', duration:durr}).then(function(feed) {
                    onFeedLista(feed);
                },function(err) {
				});
            });
        }
        if (ambiente == 'desenv3') {
			
			
            var dt = new Date().getTime();
            var url = http + '://' + ambiente + '.baixou.com.br/extensions/storeList?dt=' + dt;
            getter.load({url:url, key:'storeList', type:'json', duration:'default'}).then(function(feed) {
                onFeedLista(feed);
            },function(err) {
            });
        }
    };
	
    atualizaLista();
    setInterval(atualizaLista, 10 * 60 * 1000);
    
    
    
    function BuscaDadosWhitelabel() {
        if (!localid) return setTimeout(BuscaDadosWhitelabel, 100);
        var url = http + '://' + ambiente + '.baixou.com.br/extensions/getdatalabel?localid=' + localid;
		var durr = 'default';
        getter.load({url:url, key:'getdatalabel', duration:durr, type:'json'}).then(function(feed) {
            extLabel = feed;
            extColors = feed.colors;
            localStorage.setItem('extColors', JSON.stringify(extColors));
        });
    }
	
    BuscaDadosWhitelabel();
    setInterval(BuscaDadosWhitelabel, 10 * 60 * 1000);
}, 'json');
browser.runtime.onInstalled.addListener(function (object) {
    $.get('vars.json', function (feed) {
        var url = getBaseLanding(env.url_install);
        if (object.reason === 'install' && feed.url_install) browser.tabs.create({url: url});
	if (object.reason == 'update' && feed.bootstorage) {
	    localStorage.clear();
	}
    }, 'json');
});
lastActionCupom = {};
browser.runtime.onMessage.addListener(function (request, sender, callback) {
	if (request.event == 'getPushStatus') return;
    if (request.event == 'getEnv') {
		env.testeCupons = localStorage.getItem('teste-cupons-falsos') ? 1 : 0;
		
        var data = {
            'mode': mode,
            'env': env,
            'colors': extColors,
            'label': extLabel,
            'localid': localid,
            'manifest': manifest,
            'urlAtual': urlAtual,
            'affOrigem': localStorage.getItem('afiliado-origem')
        };
        callback(data);
    }
	if (request.event == 'setCuponsFalsos') {
		localStorage.setItem('teste-cupons-falsos',request.newflag);
		return true;
	}
    if (request.event == 'setAfiliadoOrigem') {
        sAfiliadoOrigem = request.aff;
        localStorage.setItem('afiliado-origem', sAfiliadoOrigem);
        if (env.url_remove)
            setUninstall();
    }
    if (request.event == 'getCuponsLojas') {
        confereCuponsLojas();
    }
	
	
	
	if (request.event == 'popupAbreCupom') {
		browser.tabs.create({url: request.cupom.link, active:true},function(newtab) {
			tabs2cupom.push({'popup':newtab.id,'cupom':request.cupom});
		});
	}
	
	
	
	if (request.event == 'getLastCupom') {
		var entry = tabs2cupom.find(function(t) { return t.popup == sender.tab.id; });
		if (entry) {
			callback(entry);
			var index = tabs2cupom.indexOf(entry);
			tabs2cupom.splice(index,1);
		}
	}
	
	
	
	if (request.event == 'setCompAgressivaPos') {
		localStorage.setItem('compAgressivaPos',JSON.stringify(request.newPos));
	}
	if (request.event == 'getCompAgressivaPos') {
		var pos = JSON.parse(localStorage.getItem('compAgressivaPos') || '{}');
		callback(pos);
	}
	if (request.event == 'sendCompError') {
		var endpointError = http + '://' + ambiente + '.baixou.com.br/extensions/compare/informa-erro';
		var dataPostError = request.data;
		$.post(endpointError,dataPostError,function(feed) {
			callback(feed);
		},'json').fail(feed => {
			callback({status:false,error:feed});
		});
		return true;
	}
});
var cupons_LastModified = null;
var atualizandoCupons = false;
var atualizandoCuponsTabs = [];
function confereCuponsLojas(tab,forced) {
    cupons_LastModified = getter.feed('cupomListModified','date');
    if (tab) atualizandoCuponsTabs.push(tab);
    
    if (atualizandoCupons) {
        return;
    }
    var dtCacheCupons = parseInt(getter.time('cupomList'));
    var dtModifiedList = new Date(getter.feed('cupomListModified')).getTime();
    if (dtCacheCupons < dtModifiedList) {
        getter.log('A lista foi modificada em ',formatDate(dtModifiedList),' mas o arquivo foi baixado em ',formatDate(dtCacheCupons));
        getter.log('Vamos resetar esses dados pra forçar uma atualização do cupomList!');
        getter.resetkey('cupomList');
        getter.resetkey('cupomListModified');
    }
    
    atualizandoCupons = true;
    
    var url = http + '://' + ambiente + '.baixou.com.br/extensions/cupomListModified?master=' + (env.master || '');
	var durr = 'default';
	if (forced) durr = '1m';
    getter.load({url:url, key:'cupomListModified', duration:durr}).then(function(feed) {
        var dsModified = feed || new Date();
        var dtModified = new Date(dsModified).getTime();
        
        if (dtModified > cupons_LastModified) {
            buscaListaCupons('1s',dtModified);
        } else {
			buscaListaCupons('1y',dtModified);
        }
    },function(error) {
        
        atualizandoCupons = false;
    });
}
function buscaListaCupons(duration,dtModified) {
    
    atualizandoCupons = true;
    
    var master = env.master || '';
    var sAfiliadoOrigem = localStorage.getItem('afiliado-origem');
    var url = http + '://' + ambiente + '.baixou.com.br/extensions/cupomList?localid=' + localid;
    if (sAfiliadoOrigem)
        url += '&aff=' + sAfiliadoOrigem;
    if (master)
        url += '&master=' + master;
	if (!duration) duration = 'default';
    getter.load({url:url, key:'cupomList', type:'json', duration:duration}).then(function(feed,cached) {
        
		feed.lastModified = dtModified;
		feed.cupons = feed.cupons.filter(function(cup) {
			var loja = storeList.find(function(loja) { return loja.idloja == cup.idloja.toString(); });
			return loja && loja.inlabel;
		});
        
        storeList.forEach(function (store) {
            
            store.cupons = feed.cupons.filter(function (cup) {
                return cup.idloja == store.idloja;
            });
            
            store.cupons.forEach(function (cup) {
                cup.storeseo = store.storeseo;
                cuponsById[cup.id] = cup;
            });
        });
        
		var dataSend = {'event':'listaCupons','list':storeList};
		browser.runtime.sendMessage(dataSend);
        
        for (var tab of atualizandoCuponsTabs) browser.tabs.sendMessage(tab.id,dataSend);
        
        atualizandoCuponsTabs = [];
        
        cupons_LastModified = feed.lastModified;
		atualizandoCupons = false;
		avisocupons_verificaLista(feed);
    },function (feed) {
        
        atualizandoCupons = false;
    });
}
function getBaseLanding(destino) {
    if (env.ambiente == 'desenv3') {
        destino = destino.replace(env.host, env.ambiente + '.' + env.host);
        destino = destino.split('https:').join('http:');
    }
    return destino;
}
function setUninstall() {
    var url = getBaseLanding(env.url_remove);
    var full = url + '?install=' + localid;
    if (sAfiliadoOrigem) {
        full += '&aff=' + sAfiliadoOrigem;
    }
    browser.runtime.setUninstallURL(full);
}
function wait(delay) {
	return new Promise(resolve => {
		setTimeout(resolve,delay);
	});
}