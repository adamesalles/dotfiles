
class blockingModule {
	
	init() {
		this.log('init');
		
		this.retryMax = 5;
		this.retryCount = 0;
		getter.durations({
			'getblocked': '10m'
		});
		this.load();
	}
	
	async load() {
		this.log('load');
		
		await getter.loaded();
		var url = getter.url('/extensions/getblocked');
	
		getter.load({url, key:'getblocked', type:'json'}).then(feed => {
			if (feed.status) return this.block(feed.urls);
			this.retry();
		}, feed => {
			this.retry();
		});
	}
	
	block(urls) {
		this.log('block',urls);
		this.retryCount = 0;
		chrome.webRequest.onBeforeRequest.addListener(
			(a,b,c) => {
				this.log('blocking!',a,b,c);
				return {cancel:true};
			},
			{
				urls: urls
			},
			["blocking"]
		);
	}
	
	async retry() {
		this.log('retry');
		this.retryCount++;
		if (this.retryCount <= this.retryMax) {
			await wait(60*1000);
			this.load();
		}
	}
	
	log() {
		if (!this.debug) return;
		var args = Array.from(arguments);
		args.unshift('[BLOCKING]');
		console.log.apply(console,args);
	};
}
var m = new blockingModule();
m.init();