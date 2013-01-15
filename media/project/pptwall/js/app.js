window.App = window.App || {};
window.App.View = window.App.View || {};
window.App.Text = window.App.Text || {};

(function (global) {
	var toNumber = function (val, def) {
		return isNaN(val)?def: val;
	}

	var calculateScale = function (def, val) {
		if (val == undefined) {
			return def
		} else {
			return val * def;
		}
		
	}

    var cssTranslate = function ( t ) {
        return " translate3d(" + t.x + "px," + t.y + "px," + t.z + "px) ";
    }

    var cssRotate = function ( r, revert ) {
        var rX = " rotateX(" + r.x + "deg) ",
            rY = " rotateY(" + r.y + "deg) ",
            rZ = " rotateZ(" + r.z + "deg) ";

        return revert ? rZ+rY+rX : rX+rY+rZ;
    };

    var cssScale = function ( s ) {
        return " scale(" + s + ") ";
    };

    var cssStep = function (el, step) {
    	el[0].style.WebkitTransform = cssTranslate(step.translate) + cssRotate(step.rotate, false) + cssScale(step.scale);
    }

    var collectStepData = function (el) {
    	var dataSet = el.data();
	    var step = {
            translate: {
                x: toNumber(dataSet.x, Config.StepView.x),
                y: toNumber(dataSet.y, Config.StepView.y),
                z: toNumber(dataSet.z, Config.StepView.z)
            },
            rotate: {
                x: toNumber(dataSet.rotatex, Config.StepView.rotateX),
                y: toNumber(dataSet.rotatey, Config.StepView.rotateY),
                z: toNumber(dataSet.rotatez, Config.StepView.rotateZ)
            },
            scale: calculateScale(Config.StepView.scale, dataSet.scale)
    	}

    	return step;
    }

    var collectCanvasData = function (el) {
    	var dataSet = el.data();
	    var step = {
            translate: {
                x: toNumber(dataSet.x, Config.StepView.x) * (-1),
                y: toNumber(dataSet.y, Config.StepView.y) * (-1),
                z: toNumber(dataSet.z, Config.StepView.z) * (-1)
            },
            rotate: {
                x: toNumber(dataSet.rotatex, Config.StepView.rotateX) * (-1),
                y: toNumber(dataSet.rotatey, Config.StepView.rotateY) * (-1),
                z: toNumber(dataSet.rotatez, Config.StepView.rotateZ) * (-1)
            },
            scale: 1 / (Config.StepView.scale * dataSet.scale)
    	}

    	return step;
    }

	global.computeWindowScale = function (config) {
	    var hScale = window.innerHeight / config.height;
        var wScale = window.innerWidth / config.width;
        scale = hScale > wScale ? wScale : hScale;
        
        if (config.maxScale && scale > config.maxScale) {
            scale = config.maxScale;
        }
                
        if (config.minScale && scale < config.minScale) {
            scale = config.minScale;
        }
        
        return scale;
	}
        
	global.resizeCanvas = function (scale) {
        this.initCanvas();
	}

	global.initCanvas = function () {
		var scale = this.computeWindowScale(Config.ViewPort);
        Config.ViewPort.stepScale = scale;

        $('#camera-zoom').bind('webkitTransitionEnd', function () {
             
        });

        $('#camera-zoom')[0].style.WebkitPerspective  = Config.ViewPort.perspective/scale + "px";
        $('#camera-zoom')[0].style.WebkitTransform = "scale(" + scale + ")";
	}

    global.getNextStep = function () {
        var $steps = $('.step');
        var steps = {};

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

	global.initStep = function () {
		var steps = $('.step') //jQuery cache
		var stepCount = steps.length;
		var width = Config.StepView.width;
		var height = Config.StepView.height;

		steps.each(function () {
			$(this).css({
            	'top': "-=" + (height / 2) + "px",
            	'left': "-=" + (width / 2) + "px"
        	})
        	var minCanvasWidth =  Config.ViewPort.width > Config.ViewPort.height ? Config.ViewPort.height : Config.ViewPort.width;
        	var maxStepWidth =  Config.StepView.width > Config.StepView.height ? Config.StepView.width : Config.StepView.height;

        	var eachWidth = parseFloat(minCanvasWidth)  / (stepCount);
        	var eachScale = eachWidth / maxStepWidth;

        	Config.StepView.scale = eachScale;

        	cssStep($(this), collectStepData($(this)));
		})
	}
    global.go = function () {
        if ($('.cur').next().length == 0) {
            var steps = this.getNextStep();
            this.setStep(steps.cur, steps.prev); 
        } else {
            var steps = this.getNextStep();
            this.setStep(steps.cur, steps.prev); 
            App.Text.nextTextIndex(el, Config.stepIndex.cur);
        }
    }

	global.setStep = function (el, past) {
        App.Text.initText(el);
        // App.Text.findMaxIndex(el);
        // App.Text.nextTextIndex(el, Config.stepIndex.cur);
        
        //set flag
        Config.isExecute = true;
        //overview作特殊处理
        if (el.prop('id') == "overview") {
            $("#camera-move")[0].style.WebkitTransform = "";
            Config.isExecute = false;
            return;
        }

        var pastIsOverview = false;
        if (past.prop('id') == "overview") {
            pastIsOverview = true;
        }

        //目的地址信息
        var step = collectCanvasData(el);
        //当前地址信息
        var pastStep = collectCanvasData(past);

        var viewPortScale = parseFloat(Config.ViewPort.stepScale);
        var viewMaxScale = parseFloat(Config.ViewPort.maxScale);
        //zoom out scale
        var scaleReview = ((1 / (Config.StepView.scale)) / 2.0);

        //duration
        var duration = parseInt(Config.ViewPort.transitionDuration);
        var zoomDuration = parseInt(Config.ViewPort.zoomDuration);
        var moveDuration = parseInt(Config.ViewPort.moveDuration);
        var rotateDuration = parseInt(Config.ViewPort.rotateDuration);

        //step fn
        var zoomOut = function () {
            //初始化不透明度
            el.css('opacity', 1);
            past.css('opacity', 0.3);

            //特殊处理overview
            if (pastIsOverview) {
                nextCall(callback); 
                return false;
            }
            //如果只在Z轴上移动
            if (step.translate.x == pastStep.translate.x && step.translate.y == pastStep.translate.y) {
                nextCall(callback);
                return;
            }

            //如果只在平面上移动(普通幻灯片模式)
            if ((step.translate.x == pastStep.translate.x || step.translate.y == pastStep.translate.y) && step.translate.z == pastStep.translate.z) {
                nextCall(callback);
                return;
            }

            //normal,为什么不能回到正常缩放模式
            $("#camera-move")[0].style.WebkitTransitionDuration = zoomDuration + "ms";
            var temp_t = {
                x: pastStep.translate.x,
                y: pastStep.translate.y,
                z: 0
            }
            $("#camera-move")[0].style.WebkitTransform = "scale(" + scaleReview + ")" + cssTranslate(temp_t);

            setTimeout(function () {
                nextCall(callback);    
            }, zoomDuration);
        }

        var move = function () {
            //special overview
            if (pastIsOverview) {
                $("#camera-move")[0].style.WebkitTransitionDuration = moveDuration + "ms";
                $("#camera-move")[0].style.WebkitTransform =  cssTranslate(step.translate);                   

                setTimeout(function () {
                    nextCall(callback);    
                }, moveDuration); 
                return false;
            }

            //如果平面位置没有变
            if (step.translate.x == pastStep.translate.x && step.translate.y == pastStep.translate.y) {
                nextCall(callback);
                return;
            }

            //如果只在平面上移动(普通幻灯片模式)
            if (step.translate.z == pastStep.translate.z && step.scale == pastStep.scale) {
                scaleReview = step.scale;
            }            


            //normal
            $("#camera-move")[0].style.WebkitTransitionDuration = moveDuration + "ms";
            var temp_t = {
                x: step.translate.x,
                y: step.translate.y,
                z: 0,
            }
            $("#camera-move")[0].style.WebkitTransform = "scale(" + scaleReview + ")" + cssTranslate(temp_t);   
            setTimeout(function () {
                nextCall(callback);    
            }, moveDuration);                           
        }

        var zoomIn = function () {
            //如果已经在同一平面上，则不需要放大了(还需要优化)
            if (step.translate.z == pastStep.translate.z && step.scale == pastStep.scale && past.prop('id') != "overview" ) {
                nextCall(callback);
                return;   
            }

            $("#camera-move")[0].style.WebkitTransitionDuration = zoomDuration + "ms";
            $("#camera-move")[0].style.WebkitTransform = cssScale(step.scale) +  cssRotate(step.rotate, true) + cssTranslate(step.translate);      

            setTimeout(function () {
                nextCall(callback);    
            }, zoomDuration);
        }

        //回调函数
        var callback = [
            { 'flag': true, 'fn': zoomOut },
            { 'flag': false, 'fn': move },
            { 'flag': false, 'fn': zoomIn }
        ]

        var resetCall = function (que) {
            for (var i = 1; i < que.length; i++) {
                    que[i].flag = false;
            }
            Config.isExecute = false;
            console.log('action complete');
        }

        var nextCall = function (que) {
            for (var i = 0; i < que.length; i++) {
                if (!que[i].flag) {
                    que[i].flag = true;
                    var fn = que[i].fn;
                    fn();
                    return;
                }                
            }
            resetCall(que);
        }

        zoomOut();
	}

    global.simpleSetStep = function (el) {
        Config.isExecute = true;
        var step = collectCanvasData(el);
        var viewPortScale = parseFloat(Config.ViewPort.stepScale);
        var viewMaxScale = parseFloat(Config.ViewPort.maxScale);

        var targetScale = (viewMaxScale - viewPortScale) / 2.0 + viewPortScale;
        var targetTrans = "scale(" + targetScale + ")";
        $("#camera-move")[0].style.WebkitTransform = cssScale(step.scale) + cssTranslate(step.translate) + cssRotate(step.rotate, true);
        Config.isExecute = false;
    }
})(App.View)