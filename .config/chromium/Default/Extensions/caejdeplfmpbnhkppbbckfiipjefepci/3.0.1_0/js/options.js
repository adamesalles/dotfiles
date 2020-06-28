$(window).ready(function () {
	$('#push-disable').click(function() {
		baOptions_hide('#td-push-disable');
		baOptions_show('#td-push-duration');
	});
	
	$('#push-disable-confirm').click(function() {
		var value = $('#push-disable-duration').val();
		baOptions_disableRow('#tr-push-enabled');
		
		baOptions_setValue('acceptpush',{flag:false,duration:value},function() {			
			baOptions_hide('#tr-push-enabled');			
			baOptions_hide('#td-push-duration');
			baOptions_show('#td-push-disable');
			baOptions_enableRow('#tr-push-enabled');
			baOptions_show('#tr-push-disabled');
		});
	});
	$('#push-disable-cancel').click(function() {			
		baOptions_hide('#td-push-duration');
		baOptions_show('#td-push-disable');
	});
	
	$('#push-enable').click(function() {
		baOptions_disableRow('#tr-push-disabled');
		
		baOptions_setValue('acceptpush',{flag:true},function() {
			baOptions_hide('#tr-push-disabled');
			baOptions_enableRow('#tr-push-disabled');
			baOptions_show('#tr-push-enabled');	
		});	
	});
	
	chrome.runtime.sendMessage({event:'getMuted'},function(data) {
		if (data.muted) {
			baOptions_show('#tr-push-disabled');
		} else {
			baOptions_show('#tr-push-enabled');
		}
	});
});
function baOptions_hide(selector) {
	var $thing = $(selector);
	$thing.hide();
}
function baOptions_show(selector) {
	var $thing = $(selector);
	var display = 'block';
	var tag = $thing[0].tagName;
	if (tag == 'TR') display = 'table-row';
	if (tag == 'TD') display = 'table-cell';
	$thing.css('display',display);
}
function baOptions_disableRow(selector) {
	var $row = $(selector);
	$row.css('opacity',0.5);
	$row.find('button,select,input').attr('disabled',true);
}
function baOptions_enableRow(selector) {
	var $row = $(selector);
	$row.css('opacity',1);
	$row.find('button,select,input').attr('disabled',false);	
}
function baOptions_setValue(code,value,callback) {		
	browser.runtime.sendMessage({event:'toggleOption',code:code,value:value},callback);
}