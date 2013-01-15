$(function () {
	$('#enablePublishDate').change(function () {
		if ($('#publishDate').hasClass('show')) {
			$('#publishDate').removeClass('show');
		} else {
			$('#publishDate').addClass('show');
		}
	})
	// $('#enablePublishDate').toggle(function () {
	// 	$('#publishDate').show();
	// }, function () {
	// 	$('#publishDate').hide();
	// })
})