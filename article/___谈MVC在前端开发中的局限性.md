# 谈MVC模式在前端开发中的局限性

## 有名无实的Router

### ASP.NET MVC

如果你还没有接触过后端的MVC框架的话，不妨先看看下面这段ASP.NET MVC代码并且了解一下后端MVC的工作原理。它摘自ASP.NET MVC教程中非常著名的项目[MVC Music Store](http://mvcmusicstore.codeplex.com/)，一段Controller组件代码：

```
public class StoreManagerController : Controller
{
    private MusicStoreEntities db = new MusicStoreEntities();

    // GET: /StoreManager/

    public ViewResult Index()
    {
        var albums = db.Albums.Include(a => a.Genre).Include(a => a.Artist);
        return View(albums.ToList());
    }

    // GET: /StoreManager/Details/5

    public ViewResult Details(int id)
    {
        Album album = db.Albums.Find(id);
        return View(album);
    }
}
```
我们知道Controller的职责之一是负责响应用户在视图上的行为，而具体每个行为应如何进行响应，需要落实到Controller具体的方法上，这个方法我们可以称之为action。上面代码中的两个公开方法`Index()`与`Details()`就是两个action。它们都属于`StoreManager`这个Controller。如果你有使用过前端的Ember.js的话，应该对这两个概念非常熟悉。

但问题来了，如何将用户在视图上的行为，与响应行为的方法关联起来？甚至能与Controller和action关联起来？ URL便是方法之一。上面代码每个action上的注释便代表这个这个action对应的URL。也就是说，当用户点击该URL时，框架中的Router服务便能通过URL解析出应该调用哪个Controller及该Controller下的哪一个action进行响应，以上面的例子为例，可以知道URL的规则为`{controller}/{action}/{id}`。

那么响应的结果应该是什么呢？从上面的代码`ViewResult`和`return View()`两处可以看出，两个action返回的都是新的视图。

举一个最熟悉的现有MVC站点的例子便是[github](https://github.com/)。你会发现你在github网站上的每一处点击都有唯一的URL对应，每一次交互的结果都是服务器返回新的页面。它使用javascript非常少，比如当你选择编辑时，它也会跳转到一个新的页面，而非在当前页弹出一个编辑框。

为什么首先要聊这么多的服务器端MVC框架的特性。因为接下来回过头来看前端的MVC框架时，你会发现有非常多的差异

### Javascript MVC

从上面可以看出，服务器端的MVC框架服务的是整个站点，它依靠不断的返回页面来响应用户请求，因此Router服务至关重要。而使用MVC框架的前端页面，大多数是Single Page Application，甚至还不如单页面，只是页面上的某一个组件，比如一个Slide。因此将用户的行为转化为URL是不现实。你或许会说的确无法生产新的页面，那么降低页面粒度如何呢？也就是说在服务器端一个URL映射的是一个页面，那么我们将URL映射为页面的某个区域或者功能呢？

比如以下面这段Backbone.js的TodoList应用Router为例：

```
var TodoRouter = Backbone.Router.extend({
    routes: {
        'todo/add': 'add', // 新增项
        'todo/edit/:id': 'edit', // 编辑项
        'todo/remove/:id': 'remove', // 删除项

        'filter/completed': 'filterCompleted', // 过滤出已完成
        'filter/uncompleted': 'filterUncompleted' // 过滤出未完成
    }
    // Todo
});
```
如果依照这样Route规划，我们希望当用户输入`http://example.com#todo/add`时，我们弹出的是一个新增输入框；而当用户输入`http://example.com#todo/edit/123456`页面出现编辑id为123456的这条记事的编辑框。这样我们便将URL映射的页面粒度降低为输入框粒度。

但是这样会引起另一个问题，注意上面route的差别：`todo/`域名下操作的是单条的记录，而`filter/`域名下操作的是对列表进行筛选。所以还不得不考虑一种情况，如果用户想在筛选的情况下可否对每一项进行操作？如果允许的话，参考排列组合，route是否需要新增为2 x 3 = 6项？如新增`http://example.com#filter/completed/todo/add`这样的路由。

这样的设定明显是不合理。之所以会产生这样的问题是因为对后端而言URL与页面是一一对应的关系。而如果降低页面粒度的话，无法将页面功能与Route对应起来，或者说如果想让Route覆盖单一页面上的所有功能的成本太高了。

## 前端的解决之道

当然Route在前端MVC框架中并非武功尽废，我们仍然可以保留这样的机制，但是仅用于高粒度的操作，比如上面例子中的筛选功能。

其实Route仅仅是桥梁，将用户的行为与响应用户行为的方法联系起来。Route机制已经在前端行不通了，问题便是寻求另一种联系的机制。

### Observer Pattern + MV

Google程序员[Addy Osmani](http://addyosmani.com/blog/)(同时也是[Learning JavaScript Design Patterns](http://addyosmani.com/resources/essentialjsdesignpatterns/book/)的作者)有一个非常著名的项目——[Todomvc](http://todomvc.com/)。他用所有的前端MVC框架将Todo List这个app重写了一遍。我们看看他的解决方法是什么

以Backbone.js为例，为了方便说明，在他的基础上我再次进行了简化，简化到只有50行代码，只保留了新增和删除方法。实际演示效果在[这里](http://jsfiddle.net/JPL94/7/)：

```
var Todo = Backbone.Model.extend();

var Todos = Backbone.Collection.extend({
    model: Todo
});

var todos = new Todos();

var ItemView = Backbone.View.extend({
    tagName: "li",
    template: _.template($("#item-template").html()),
    render: function () {
        this.$el.html(this.template(this.model.toJSON()));
        return this;
    },
    initialize: function () {
        this.listenTo(this.model, 'remove', this.remove);
    },
    events: {
        "click .delete": "clear"
    },
    clear: function () {
        todos.remove(this.model);
    }
});

var AppView = Backbone.View.extend({
    el: $("body"),
    initialize: function () {
        this.listenTo(todos, 'add', this.addOne);
    },  
    addOne: function(todo) {
        var view = new ItemView({
            model: todo
        });
        this.$("#list").append(view.render().el);
    },    
    events: {
        "click #create": "create"
    },
    create: function () {
        var model = new Todo({
            title: this.$("#input").val()
        });
        todos.add(model);
    }
})

var app = new AppView();
```
这个应用有两个视图，全局视图`AppView`和单个项目视图`ItemView`，还有一个相当于Model层的Collection`todos`。它没有显式的将Controller层独立出来。你可能会说Backbone不像Angular和Ember，它本就没有Controller的设定，我不这么认为，Backbone里Router就是Controller与Router的结合体。比如它可以加入一个Router这么干：
```
var TodoRouter = Backbone.Router.extend({
    routes: {
        'todo/add': 'add'
    },
    add: function () {
        // do something
    }
});
```
翻译过来是：`#todo/add`对应的action是`add`——如果放在服务端的话这不就是把用户的行为(URL)与action联系起来了吗。

回到这个应用，它没有将Controller显式的独立出来并不代表Controller不存在。**我们需要的不是一个叫做Controller的东西，而是一些能够响应用户行为的方法**。那么它把Controller放在哪了？它使用了的是最原始的解决办法，放在用户行为事件的回调函数中，比如这段代码：

```
events: {
    "click #create": "create"
},
create: function () {
    var model = new Todo({
        title: this.$("#input").val()
    });
    todos.add(model);
}
```
虽然这种方法比较原始，但不应该认为它是一种低级的解决方案。当然接下来我们会在Emberjs和Knockoutjs看到一些其他的解决方法，从职责上来说，他们的工作是一致的。

回想在文章开头介绍的ASP.NET MVC的一个action，它做了哪些事情：
```
    public ViewResult Details(int id)
    {   
        // 执行了Model层的查找(query)操作
        Album album = db.Albums.Find(id);
        // 将查找返回的结果传递给视图(View)
        return View(album);
    }
```
用户的操作会涉及数据和视图更改，视图通常是被数据影响，是可视化的数据。上面的代码很好的说明了这一点，并且视图的更新和数据的操作都是在同一个action里完成的。
