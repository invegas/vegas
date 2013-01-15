window.App = window.App || {};
window.App.View = window.App.View || {};
window.App.Manage = window.App.Manage || {};
window.App.Utility = window.App.Utility || {};

(function (global) {
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



	global.initStep = function () {
		var steps = $('.step') //jQuery cache
		var stepCount = steps.length;
		var width = Config.StepView.width;
		var height = Config.StepView.height;
		steps.each(function () {
            $(this).css({
                'top': "-" + (height / 2) + "px",
                'left': "-" + (width / 2) + "px"
            })            
        	var minCanvasWidth =  Config.ViewPort.width > Config.ViewPort.height ? Config.ViewPort.height : Config.ViewPort.width;
        	var maxStepWidth =  Config.StepView.width > Config.StepView.height ? Config.StepView.width : Config.StepView.height;

        	var eachWidth = parseFloat(minCanvasWidth)  / (stepCount);
        	var eachScale = eachWidth / maxStepWidth;

        	Config.StepView.scale = eachScale;

        	App.Utility.cssStep($(this), App.Utility.collectStepData($(this)));
		})
	}

    global.showStep = function () {
        $('.cur').css('opacity', 1);
        $('.perv').css('opacity', 0.3);
    }

    global.enableTheme = function (el) {
        var theme = $('body').prop('class').split(',');
        for (var i in theme) {
            if (theme[i].indexOf('theme') > -1) {
                $('body').removeClass(theme[i]);    
            }
        }
        //启用主题
        if (el.data('theme')) {
            $('body').addClass('theme-' + el.data('theme'));
        } 
    }

    global.setSimpleStep = function (el) {
        var step = App.Utility.collectCanvasData(el);
        var zoomDuration = parseInt(Config.ViewPort.zoomDuration);
        this.showStep();
        this.enableTheme(el);
        $("#camera-move")[0].style.WebkitTransitionDuration = zoomDuration + "ms";
        $("#camera-move")[0].style.WebkitTransform = App.Utility.cssScale(step.scale) +  App.Utility.cssRotate(step.rotate, true) + App.Utility.cssTranslate(step.translate);      

        setTimeout(function () {
            App.Manage.disableExecute();    
        }, zoomDuration);
    }


	global.setStep = function (el, past) {
        //overview作特殊处理
        if (el.prop('id') == "overview") {
            $("#camera-move")[0].style.WebkitTransform = "";
            App.Manage.disableExecute();
            return;
        }

        var pastIsOverview = false;
        if (past.prop('id') == "overview") {
            pastIsOverview = true;
        }

        //目的地址信息
        var step = App.Utility.collectCanvasData(el);
        //当前地址信息
        var pastStep = App.Utility.collectCanvasData(past);

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
            //如果是自翻转
            var isSelf = past.data('self');
            if (isSelf) {
                var temp = App.Utility.collectStepData(past);
                App.Utility.cssStep(past, temp);
            };
            //初始化不透明度
            //show slider
            global.showStep();

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
            $("#camera-move")[0].style.WebkitTransform = "scale(" + scaleReview + ")" + App.Utility.cssTranslate(temp_t);

            setTimeout(function () {
                nextCall(callback);    
            }, zoomDuration);
        }

        var move = function () {
            //special overview
            if (pastIsOverview) {
                $("#camera-move")[0].style.WebkitTransitionDuration = moveDuration + "ms";
                $("#camera-move")[0].style.WebkitTransform =  App.Utility.cssTranslate(step.translate);                   

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
            // if (step.translate.z == pastStep.translate.z && step.scale == pastStep.scale) {
            if ((step.translate.x == pastStep.translate.x || step.translate.y == pastStep.translate.y) && step.translate.z == pastStep.translate.z) {
                scaleReview = step.scale;
            }            


            //normal
            $("#camera-move")[0].style.WebkitTransitionDuration = moveDuration + "ms";
            var temp_t = {
                x: step.translate.x,
                y: step.translate.y,
                z: 0,
            }
            $("#camera-move")[0].style.WebkitTransform = "scale(" + scaleReview + ")" + App.Utility.cssTranslate(temp_t);   
            setTimeout(function () {
                nextCall(callback);    
            }, moveDuration);                           
        }

        var zoomIn = function () {
            //如果已经在同一平面上，则不需要放大了(还需要优化)
            global.enableTheme(el);
            if (step.rotate == pastStep.rotate && step.translate.z == pastStep.translate.z && step.scale == pastStep.scale && past.prop('id') != "overview" ) {
                nextCall(callback);
                return;   
            }

            $("#camera-move")[0].style.WebkitTransitionDuration = zoomDuration + "ms";
            //可有可无 调整camera-move 的变形中心
            // $("#camera-move")[0].style.WebkitTransformOrigin = step.translate.x + "px " + step.translate.y + "px";
            // console.log('origin', $("#camera-move")[0].style.WebkitTransformOrigin);
            var isSelf = el.data('self');
            if (isSelf) {
                var temp = App.Utility.collectStepData(el);
                var temp = {
                    translate: {
                        x: temp.translate.x,
                        y: temp.translate.y,
                        z: temp.translate.z
                    },
                    rotate: {
                        x: 0,
                        y: 0,
                        z: 0
                    },
                    scale: temp.scale
                }
                App.Utility.cssStep(el, temp);
                $("#camera-move")[0].style.WebkitTransform = App.Utility.cssScale(step.scale) + " rotateZ(0deg) rotateY(0deg) rotateX(0deg) " + App.Utility.cssTranslate(step.translate);      
            } else {
                $("#camera-move")[0].style.WebkitTransform = App.Utility.cssScale(step.scale) +  App.Utility.cssRotate(step.rotate, true) + App.Utility.cssTranslate(step.translate);
            }
            
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
            App.Manage.disableExecute();
            $("#camera-move")[0].style.WebkitTransformOrigin = "50% 50%";
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
})(App.View)