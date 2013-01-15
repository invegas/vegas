window.App = window.App || {};
window.App.Manage = window.App.Manage || {};
window.App.View = window.App.View || {};
window.App.Text = window.App.Text || {};

(function (global) {
	global.config = {
		'isExecute': false,
		'stepIndex': {
			'cur': 0,
			'max': 0
		},
		'isThumb': false
	}
	global.keyAllow = function (code) {
		var cfg = Config.keyMap;
		for (var i in cfg) {
			var temp = cfg[i];
			for (var j = 0; j <temp.length; j++) {
				if (temp[j] == code) {
					return true;
				}
			}
		}

		return false;
	}

	global.keyMap = function (code) {
		if (!this.keyAllow(code)) {
			return;
		}

		if (this.config.isExecute) {
			return;
		}

		this.enableExecute();
		var cfg = Config.keyMap;
		for (var i in cfg) {
			var temp = cfg[i];
			for (var j = 0; j <temp.length; j++) {
				if (temp[j] == code) {
					switch (i) {
						case "go": {
							if (this.config.isThumb) {
								this.disableExecute();
								return;
							}
							this.go(); break;
						}
						case "nextStep": this.goNext(); break;
						case "prevStep": this.goPrev(); break;
						case "overview": this.thumbToggle(); break;
						default: this.disableExecute();break;
					}
				}
			}
		}
	}

	global.thumbToggle = function () {
		if (!this.config.isThumb) {
			this.enableThumb();
			this.config.isThumb = true;
		} else {
			this.disableThumb();
			this.config.isThumb = false;			
		}
	}

	global.enableThumb = function () {
		//去掉那些点击被聚焦的样式
		App.Text.resetFocus();
		
		var past = [];
		var future = [];		
		//如果现在是overview,则跳到下一步
		if ($('.cur').prop('id') == "overview") {
			this.getNextStep();	
		}

		var cur = $('.cur');
		while (cur.prev().length != 0) {
			var temp = cur.prev();
			past.push(temp);
			cur = temp;			
		}
		past = past.reverse();

		var cur = $('.cur');
		while (cur.next().length != 0) {
			var temp = cur.next();
			future.push(temp);
			cur = temp;
		}

		App.View.initCanvas();
		$('#camera-move')[0].style.WebkitTransform = "";
        $('.cur')[0].style.WebkitTransform = 'translateZ(-1000px) translate(0%, 0%)';
        $('.cur').addClass('thumb');

        var count = 0;
        for (var i = past.length - 1; i >= 0 ; i--) {
            count++;
            past[i][0].style.WebkitTransform = 'translateZ(-2500px) translate(-' + (80 + 20*count)  + '%, 0%) rotateY(75deg)';
            if (count <= 5) {
                past[i].addClass('thumb');    
            } else {
                past[i].removeClass('thumb');
            }
            
        }

        for (var j = 0; j < future.length; j++) {
            future[j][0].style.WebkitTransform = 'translateZ(-2500px) translate(' + (80 + 20*(j + 1))  + '%, 0%) rotateY(-75deg)';
            if ((j + 1) <= 5) {
                future[j].addClass('thumb');    
            } else {
                future[j].removeClass('thumb');
            }
        }

		this.disableExecute();
	}

	global.disableThumb = function () {
		$('.step').removeClass('thumb');
        App.View.initCanvas();
        App.View.initStep();	
        
        App.Text.initText($('.cur'));
		this.setStepIndex($('.cur'));
        App.View.setSimpleStep($('.cur'));
	}

	global.enableExecute = function () {
		$('#loading').css('opacity', 0.7);
		this.config.isExecute = true;
	}

	global.disableExecute = function () {
		$('#loading').css('opacity', 0);
		this.config.isExecute = false;
	}

	global.go = function () {
		var cur = this.config.stepIndex.cur;
		var max = this.config.stepIndex.max;

		//如果是第一幅ppt || 或者切换到下一幅
		if ($('.cur').prop('id') == "overview" || cur >= max) {			
			//获取当前步骤
			var steps = this.getNextStep();
			//初始化文字
			App.Text.initText(steps.cur);
			//重新配置cur and max
			this.setStepIndex(steps.cur);
			//初始化下一幅
			App.View.setStep(steps.cur, steps.prev);
			return;
		} 

		//如果本页还没有执行完
		if (cur < max) {
			if (this.getNextTextIndex($('.cur'))) {
				App.Text.showTextByIndex($('.cur'), this.config.stepIndex.cur);
			}
		}
	}

	global.goNext = function () {
		//如果不是略缩图状态
		if (!this.config.isThumb) {
			//如果不是略缩图状态
			var steps = this.getNextStep();
			App.Text.initText(steps.cur);
			this.setStepIndex(steps.cur);
			App.View.setStep(steps.cur, steps.prev);
		} else {
			var steps = this.getNextStep();
			this.enableThumb();
		}
	}

	global.goPrev = function () {
		//如果不是略缩图状态
		if (!this.config.isThumb) {
			var steps = this.getPrevStep();
			App.Text.initText(steps.cur);
			this.setStepIndex(steps.cur);
			App.View.setStep(steps.cur, steps.prev);
		} else {
			var steps = this.getPrevStep();
			this.enableThumb();
		}
	}



	global.setStepIndex = function (wrap) {
		var cur = this.config.stepIndex.cur;
		var max = this.config.stepIndex.max;
		cur = 0;
		max = 0;

		var $texts = wrap.find('.text');
		var _this = this;
		$texts.each(function () {
            var index = $(this).data('index');
            if (index != undefined) {
				if (index >= max) { 
					_this.config.stepIndex.max = index;
				}            	
            }
		});		
	}

	global.getNextTextIndex = function (wrap) {
		var max = this.config.stepIndex.max;
		this.config.stepIndex.cur = this.config.stepIndex.cur + 1;
		var cur = this.config.stepIndex.cur;
		if (cur > max) {
			return false;
		}
		var $texts = wrap.find('.text[data-index="' + cur + '"]');
		if ($texts.length == 0) {
			this.getNextTextIndex(wrap);
		} else {
			return true;
		}
	}

	global.getPrevStep = function () {
		var $steps = {};
		var steps = {};
		//转化模式
		if ($('.cur').prev().length != 0 && $('.cur').prev().hasClass('prev') || $('.cur').prev().length == 0 && $('.step:last').hasClass('prev')) {
    		var temp = $('.prev');
    		$('.cur').removeClass('cur').addClass('prev');
    		temp.removeClass('prev').addClass('cur');
    		steps = {
            	"cur": $('.cur'),
            	"prev": $('.prev')
        	}
        	return steps;
		}

		if ($('.cur').prev().length == 0) {
            $('.prev').removeClass('prev');
            $('.cur').removeClass('cur');			

            $('.step:first').addClass('prev');
            $('.step:last').addClass('cur');            
		} else {
            var temp = $('.cur');
            $('.prev').removeClass('prev');
            $('.cur').removeClass('cur');

            temp.prev().addClass('cur');
            temp.addClass('prev');            			
		}

        steps = {
            "cur": $('.cur'),
            "prev": $('.prev')
        }


        return steps;		

	}

    global.getNextStep = function () {
        var $steps = $('.step');
        var steps = {};
        //转化模式
        if ($('.cur').prev().length != 0 && !$('.cur').prev().hasClass('prev') || $('.cur').prev().length == 0 && $('.cur').next().hasClass('prev')) {
    		var temp = $('.prev');
    		$('.cur').removeClass('cur').addClass('prev');
    		temp.removeClass('prev').addClass('cur');
    		steps = {
            	"cur": $('.cur'),
            	"prev": $('.prev')
        	}
        	return steps;
        }

        //如果还没有开始阅读
        if ($('.cur').next().length == 0) {
            $('.prev').removeClass('prev');
            $('.cur').removeClass('cur');

            $('.step:first').addClass('cur');
            $('.step:last').addClass('prev');
        } else {
            var temp = $('.cur');
            $('.prev').removeClass('prev');
            $('.cur').removeClass('cur');

            temp.next().addClass('cur');
            temp.addClass('prev');
        }

        steps = {
            "cur": $('.cur'),
            "prev": $('.prev')
        }

        return steps;
    }	

    global.bindTextClick = function () {
    	$('.text').live('click', function () {
    		App.Text.resetFocus();
    		App.Text.focusText($(this));
    	})
    }

    global.bindResetClick = function () {
    	$('.focus').live('click', function () {
    		App.Text.resetFocus();
    	})
    }

})(App.Manage)