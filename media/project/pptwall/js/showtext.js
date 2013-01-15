window.App = window.App || {};
window.App.Text = window.App.Text || {};
window.App.View = window.App.View || {};
window.App.Manage = window.App.Manage || {};
window.App.Utility = window.App.Utility || {};

(function (global) {
	global.showTextByIndex = function (wrap, index) {
		var $texts = wrap.find('.text[data-index="' + index + '"]:not(.readed)');

		if ($texts.length == 0) {
			App.Manage.disableExecute();
			return;
		}

		$texts.each(function () {
			var effect = $(this).data('effect');
			if (effect) {
				$(this).addClass('text-' + effect + '-show').removeClass('text-' + effect + '-hide').removeClass('text-bg').addClass('text-readed');	
			} else {
            	var step = App.Utility.collectCanvasData($(this));
            	$(this)[0].style.WebkitTransform = "scale(1)" +  App.Utility.cssRotate(step.rotate, true) + App.Utility.cssTranslate(step.translate); 
			}           
		})
		//结束执行
		App.Manage.disableExecute();
	};

	global.initText = function (wrap) {
		var $texts = wrap.find('.text');
		$texts.each(function () {
			//init effect
			if ($(this).hasClass('readed')) return;
			var effect = $(this).data('effect');
			if (effect) {
				$(this).addClass('text-' + effect + '-hide');	
			} else {
				var step = App.Utility.collectCanvasData($(this));
            	$(this)[0].style.WebkitTransform =  "scale(1)" +  App.Utility.cssRotate(step.rotate, true) + App.Utility.cssTranslate(step.translate);  				
			}
		});
	};

	global.focusText = function (el) {
		el[0].style.WebkitTransform = "";
		el.addClass('focus');
        $('.cur .text:not(.focus)').addClass('blur');
	}

	global.resetFocus = function () {
		if ($('.focus').length == 0) return;
		var step = App.Utility.collectCanvasData($('.focus'));
        $('.focus')[0].style.WebkitTransform =  "";

    	var effect = $('.focus').data('effect');
		if (effect) {
			$('.focus').addClass('text-' + effect + '-show').removeClass('text-' + effect + '-hide').removeClass('text-bg');	
		} else {
        	var step = App.Utility.collectCanvasData($('.focus'));
        	$('.focus')[0].style.WebkitTransform = "scale(1)" +  App.Utility.cssRotate(step.rotate, true) + App.Utility.cssTranslate(step.translate); 
		} 

		$('.focus').removeClass('focus');
        $('.blur').removeClass('blur');
	}
})(App.Text);