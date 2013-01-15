window.App = window.App || {};
window.App.Utility = window.App.Utility || {};

(function (global) {
	global.toNumber = function (val, def) {
		return isNaN(val)?def: val;
	}

	global.calculateScale = function (def, val) {
		if (val == undefined) {
			return def
		} else {
			return val * def;
		}
		
	}

    global.cssTranslate = function ( t ) {
        return " translate3d(" + t.x + "px," + t.y + "px," + t.z + "px) ";
    }

    global.cssRotate = function ( r, revert ) {
        var rX = " rotateX(" + r.x + "deg) ",
            rY = " rotateY(" + r.y + "deg) ",
            rZ = " rotateZ(" + r.z + "deg) ";

        return revert ? rZ+rY+rX : rX+rY+rZ;
    };

    global.cssScale = function ( s ) {
        return " scale(" + s + ") ";
    };

    global.cssStep = function (el, step) {
    	el[0].style.WebkitTransform = this.cssTranslate(step.translate) + this.cssRotate(step.rotate, false) + this.cssScale(step.scale);
    }

    global.collectStepData = function (el) {
    	var dataSet = el.data();
	    var step = {
            translate: {
                x: this.toNumber(dataSet.x, Config.StepView.x),
                y: this.toNumber(dataSet.y, Config.StepView.y),
                z: this.toNumber(dataSet.z, Config.StepView.z)
            },
            rotate: {
                x: this.toNumber(dataSet.rotatex, Config.StepView.rotateX),
                y: this.toNumber(dataSet.rotatey, Config.StepView.rotateY),
                z: this.toNumber(dataSet.rotatez, Config.StepView.rotateZ)
            },
            scale: this.calculateScale(Config.StepView.scale, dataSet.scale)
    	}

    	return step;
    }

    global.collectCanvasData = function (el) {
    	var dataSet = el.data();
	    var step = {
            translate: {
                x: this.toNumber(dataSet.x, Config.StepView.x) * (-1),
                y: this.toNumber(dataSet.y, Config.StepView.y) * (-1),
                z: this.toNumber(dataSet.z, Config.StepView.z) * (-1)
            },
            rotate: {
                x: this.toNumber(dataSet.rotatex, Config.StepView.rotateX) * (-1),
                y: this.toNumber(dataSet.rotatey, Config.StepView.rotateY) * (-1),
                z: this.toNumber(dataSet.rotatez, Config.StepView.rotateZ) * (-1)
            },            
            scale: 1 / (Config.StepView.scale * dataSet.scale)
    	}

    	return step;
    }
})(App.Utility)