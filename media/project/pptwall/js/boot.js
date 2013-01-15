$(function(){	
	window.configModel = new ConfigModel();
	$(document).keyup(function (e) {
		configModel.distribute(e.keyCode);
        var portView = new PortView();
        portView.portView3dOn();
        // portView.randomRotateOn();
	})

	setTimeout(function () {
		// $('body').addClass('body-normal');
	}, 4000);
	

	// $('.pic').hover(function () {
	// 	var _this = $(this);
	// 	window.originTop = $(this).css('top');
 //        window.timer = setInterval(function () {
 //            _this.animate({'top': '-=20px'},400)
 //                    .animate({'top':'+=20px'},{duration:800, easing:'easeOutBounce'});
 //        }, 100);
	// },function () {
 // 		clearInterval(timer);
 //        $(this).stop(true,true).animate({'top': originTop},{duration: 300});
	// }).click(function () {
	// 	var ileft = (960 - parseInt($(this).css('width'))) / 2;
	// 	var itop = (600 - parseInt($(this).css('height'))) / 2;
	// 	//.addClass('move-to-center')
 //        $(this).stop(true,true).animate({'top': originTop},{duration: 300}).animate({
 //            'left': ileft + "px",
 //            'top':  itop + "px"
 //        },800);
	// 	// $(this).animate({
	// 	// 	'left: ileft + "px",
	// 	// 	top: itop + "px"
	// 	// });
	// });
});

