prettyPrint();
var category = $('body').attr('data-category');
$('#category option[value="' + category + '"]').attr('selected', true);
//结束编辑
$('.edit-end').click(function () {
	window.location = '/blog/' + $(".title").attr('data-origin');
})
//保存成功
$('.edit-save').click(function () {
	var _this = $(this);
	var title = $('.title');

	var category = $('#category').val();
	title.attr('data-origin', title.text());

	$(this).text("保存中");
	$.ajax({
		url: '/editBlog',
		type: 'post',
		data: {
			title: title.text(),
			content: $(".content").html(),
			id: $("body").attr('data-id'),
			category: category
		},
		success: function (data) {
			if (data.status == "ok") {
				$('.save-status').show();
				$('.save-status-success').show();
				$('.save-status-failed').hide();

				_this.text("保存");
				$('.info-tag').text(category);
			} else {
				$('.save-status').show();
				$('.save-status-success').hide();
				$('.save-status-failed').show();

				_this.text("保存");
			}
		}
	})
})