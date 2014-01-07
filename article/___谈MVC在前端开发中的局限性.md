# 谈MVC模式在前端开发中的局限性

## 有名无实的Router与不尽相同的Controller

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

举一个最熟悉的现有MVC站点的例子便是[github](https://github.com/)。你会发现你在github网站上的每一处点击都有唯一的URL对应，每一次交互的结果都是一个新页面响应。它使用javascript非常少，比如当你选择编辑时，它也会跳转到一个新的页面，而非在当前页弹出一个编辑框。