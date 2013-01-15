window.Config = window.Config || {};

Config.ViewPort = {
    width: 1120,
    height: 700, 
    maxScale: 1.5,
    minScale: 0,
    perspective: 500,
    zoomDuration: 1500,
    moveDuration: 1500,
    rotateDuration: 1000,
    transitionDuration: 500,
    stepScale: 1
}

Config.StepView = {
	width: 960,
	height: 600,
	x: 0,
	y: 0,
	z: 0,
	rotateX: 0,
	rotateY: 0,
	rotateZ: 0,
	scale: 1
}

Config.keyMap = {
    go: [32],
    nextStep: [39],
    prevStep: [37],
    overview: [27]
}

Config.curStep ={}
