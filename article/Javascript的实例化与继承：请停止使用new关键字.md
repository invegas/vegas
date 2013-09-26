#Javascript的实例化与继承：请停止使用new关键字

必须承认标题是有些耸人听闻了:)。我的本意其实是想说，使用new关键字并非是最佳的实践，换而言之，我觉得有更好的实践，能让javascript中的实例化和继承的工作更友好一些。本文所做的工作就是对与new相关联的面向对象一系列操作进行封装，甚至完全抛弃new关键字，以便提供更快捷的、更易让人理解的实现面向实现方式。


##传统的实例化与继承

假设我们有两个类`Class:function Class() {}`和`SubClass:function SubClass()`{}，SubClass需要继承自Class，传统方法的方法一般是按如下步骤来组织和实现的：

- Class中 **被继承的属性和方法** 必须放在Class的prototype属性中
- SubClass中 **自己的方法和属性** 也必须放在自己prototype属性中
- SubClass的prototype对象的prototype(__proto__)属性 必须指向的Class的prototype

这样以来，由于prototype链的 特性，SubClass的实例便能追溯到Class的方法。这样便实现而来继承

```
new SubClass()      Object.create(Class.prototype)
    |                    |
    V                    V
SubClass.prototype ---> { }
                        { }.__proto__ ---> Class.prototype
```

还是举一个具体的例子吧，比如我们要做以几个功能:

- 有一个父类叫做Human
- 使一个名为Man的子类继承自Human
- 子类继承父类的一切属性，并调用父类的构造函数，实例化这个子类

代码如下：

```
// 构造函数/基类
function Human(name) {
    this.name = name;
}

/* 
    基类的方法保存在构造函数的prototype属性中
    便于子类的继承
*/
Human.prototype.say = function () {
    console.log("say");
}

/*
    道格拉斯的object方法（等同于object.create方法）
*/
function object(o) {
    var F = function () {};
    F.prototype = o;
    return new F();
}

// 子类构造函数
function Man(name, age) {
    // 调用父类的构造函数
    Human.call(this, name);
    // 自己的属性age
    this.age = age;
}

// 继承父类的方法
Man.prototype = object(Human.prototype);
Man.prototype.constructor = Man;

// 实例化子类
var man = new Man("Lee", 22);
console.log(man);
// 调用父类的say方法：
man.say();
```

[DEMO](http://jsfiddle.net/gP9g5/)

通过上面的DEMO我们可以总结出传统的实例化与继承的几个特点:

- 传统方法中的“类”一定是一个构造函数——你可能会问还有可能不是构造函数吗？当然可以，文章的最后会介绍如何实现一个不是构造函数的类。
- 属性和方法的继承一定是通过prototype实现，也一定是通过Object.create方法。
- 实例化一个对象，一定是通过new关键字来实现的。（你能回忆起除了new关键字，还有其他哪些方式来创建一个对象吗？）

上面有一个小细节也许会让有的朋友会疑惑，何以见得，Object.create方法是与道格拉斯的object方法是一致呢？

呵，这当然不是想当然的，而是在MDN上，object方法是作为Object.create的一个Polyfill方案：

- [Object.create](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
- [Douglas Crockford's object method](http://javascript.crockford.com/prototypal.html)

**那么new关键字的不足之处在哪？**


在《Javascript语言精粹》(Javascript: The Good Parts)中，道格拉斯认为应该避免使用new关键字:

> If you forget to include the new prefix when calling a constructor function, then this will not be bound to the new object. Sadly, this will be bound to the global object, so instead of augmenting your new object, you will be clobbering global variables. That is really bad. There is no compile warning, and there is no runtime warning. (page 49)

大意是说在应该使用new的时候如果忘了new关键字，会引发一些问题。

但个人认为这个理由牵强了，毕竟你遗忘使用任何关键字都会引起一系列的问题。再退一步说，这个问题是[完全可以避免的](http://stackoverflow.com/questions/383402/is-javascript-s-new-keyword-considered-harmful#answer-383503)：

```
function foo()
{   
   // 如果忘了使用关键字，这一步骤会悄悄帮你修复这个问题
   if ( !(this instanceof foo) )
      return new foo();

   // 构造函数的逻辑继续……
}
```
或者更通用的抛出异常即可

```
function foo()
{
    if ( !(this instanceof arguments.callee) ) 
       throw new Error("Constructor called as a function");
}
```

又或者按照[John Resig的方案](http://ejohn.org/blog/simple-class-instantiation/)，我们准备一个makeClass工厂函数，把大部分的初始化功能放在一个init方法中，而非构造函数自己中：

```
// makeClass - By John Resig (MIT Licensed)
function makeClass(){
  return function(args){
    if ( this instanceof arguments.callee ) {
      if ( typeof this.init == "function" )
        this.init.apply( this, args.callee ? args : arguments );
    } else
      return new arguments.callee( arguments );
  };
}
```


我认为new关键字不是一个好的实践的原因是因为：

> new is a remnant of the days where JavaScript accepted a Java like syntax for gaining “popularity”.
And we were pushing it as a little brother to Java, as a complementary language like Visual Basic was to C++ in Microsoft’s language families at the time.

和道格拉斯说的：

> This indirection was intended to make the language seem more familiar to classically trained programmers, but failed to do that, as we can see from the very low opinion Java programmers have of JavaScript. JavaScript’s constructor pattern did not appeal to the classical crowd. It also obscured JavaScript’s true prototypal nature. As a result, there are very few programmers who know how to use the language effectively.

简单来说，javascript是一种prototypal类型语言，在创建之初，是为了迎合市场的需要，让人们觉得它和Java是类似的，才引入了new关键字。Javascript本应通过它的Prototypical特性来实现实例化和继承，但new关键字让它变得不伦不类。


##把传统方法加以改造


既然new关键字不够友好，那么我们有两个办法可以解决这个问题，一是完全抛弃new关键字，二是把含有new关键字的操作封装起来，只向外提供友好的接口。现在我们先做第二件事。

我希望我们的基类`Class`，只向外提供两个接口：

- Class.extend 用于拓展子类
- Class.create 用于创建实例

用类似于`Backbone.js`中创建子类方式创建子类

```
// 基类
function Class() {}

// 将extend和create置于prototype对象中，以便子类继承
Class.prototype.extend = function () {};
Class.prototype.create = function () {};

// 为了能在基类上直接以.extend的方式进行调用
Class.extend = function (props) {
    return this.prototype.extend.call(this, props);
}

```
因为我们希望子类也能派生出自己的子类，也能实例化，所以我们把公共的extend和create方法放在Class的prototype属性中。接下是具体实现：

```
Class.prototype.create = function (props) {
    /*
        create实际上是对new的封装；
        create返回的实例实际上就是new构造出的实例；
        this即指向调用当前create的构造函数；
    */
    var instance = new this();
    /*
        将传入的参数作为该实例的“私有”属性，
        更准确应该说是“实例属性”，因为并非私有
        而是这个实例独有
    */
    for (var name in props) {
        instance[name] = props[name];
    }
    return instance;
}

Class.prototype.extend = function (props) {
    /*
        派生出来的新的子类
    */
    var SubClass = function () {};
    /*
        继承父类的属性和方法，
        当然前提是父类的属性都放在prototype中
        而非上面create方法的“实例属性”中
    */
    SubClass.prototype = Object.create(this.prototype);
    // 并且添加自己的方法和属性
    for (var name in props) {
        SubClass.prototype[name] = props[name];
    }
    SubClass.prototype.constructor = SubClass;

    /*
        介于需要以.extend的方式和.create的方式调用：
    */
    SubClass.extend = SubClass.prototype.extend;
    SubClass.create = SubClass.prototype.create;

    return SubClass;
}
```
还是以上面Human和Man的例子进行测吧：

```
var Human = Class.extend({
    say: function () {
        console.log("Hello");
    }
});

var human = Human.create();
console.log(human)
human.say();

var Man = Human.extend({
    walk: function () {
        console.log("walk");
    }
});

var man = Man.create({
    name: "Lee",
    age: 22
});

console.log(man);
// 调用父类方法
man.say();

man.walk();
```

[DEMO](http://jsfiddle.net/VsuA2/)

nice!基本框架已经搭建起来，接下来继续补充功能

1. 我们希望把构造函数独立出来，并且统一命名为init。就好像`Backbone.js`中每一个view都有一个`initialize`方法一样

2. 我还想新增一个子类方法调用父类同名方法的机制，比如说在父类和子类的中都定义了一个say方法，那么只要在子类的say中调用`this.callSuper()`就能调用父类的say方法了。例如：


```
// 基类
var Human = Class.extend({
    /*
        你需要在定义类时定义构造方法init
    */
    init: function () {
        this.nature = "Human";
    },
    say: function () {
        console.log("I am a human");
    }
})

var Man = Human.extend({
    init: function () {
        this.sex = "man";
    },
    say: function () {
        // 调用同名的父类方法
        this.callSuper();
        console.log("I am a man");
    }
});
```

那么Class.create就不仅仅是new一个构造函数了：

```
Class.create = Class.prototype.create = function () {
    /*
        注意在这里我们只是实例化一个构造函数
        而非最后返回的“实例”，这个实例目前只是一个“壳”
        需要init函数对这个“壳”填充属性和方法
    */
    var instance = new this();

    /*
        如果对init有定义的话
    */
    if (instance.init) {
        instance.init.apply(instance, arguments);
    }
    return instance;
}

实现在子类方法调用父类同名方法的机制，我们可以借用John Resig的[实现](http://ejohn.org/blog/simple-javascript-inheritance/)

```

Class.extend = Class.prototype.extend = function (props) {
    var SubClass = function () {};
    var _super = this.prototype;

     SubClass.prototype = Object.create(this.prototype);
     for (var name in props) {
        // 如果父类同名属性也是一个函数
        if (typeof props[name] == "function" 
            && typeof _super[name] == "function") {
            // 重新定义用户的同名函数，把用户的函数包装起来
            SubClass.prototype[name] 
                = (function (super_fn, fn) {
                return function () {

                    // 如果用户有自定义callSuper的话，暂存起来
                    var tmp = this.callSuper;
                    // callSuper即指向同名父类函数
                    this.callSuper = super_fn;
                    /*
                        callSuper即存在子类同名函数的上下文中
                        以this.callSuper()形式调用
                    */
                    var ret = fn.apply(this, arguments);
                    this.callSuper = tmp;

                    /*
                        如果用户没有自定义的callsuper方法，则delete
                    */
                    if (!this.callSuper) {
                        delete this.callSuper;
                    }

                    return ret;
                }
            })(_super[name], props[name])  
        } else {
            SubClass.prototype[name] = props[name];    
        }

        ..
    }

    SubClass.prototype.constructor = SubClass; 
}
```

最后我们给出一个完整吧，并且做了一些优化

```
function Class() {}

Class.extend = function extend(props) {

    var prototype = new this();
    var _super = this.prototype;

    for (var name in props) {

        if (typeof props[name] == "function" 
            && typeof _super[name] == "function") {

            prototype[name] = (function (super_fn, fn) {
                return function () {
                    var tmp = this.callSuper;

                    this.callSuper = super_fn;

                    var ret = fn.apply(this, arguments);

                    this.callSuper = tmp;

                    if (!this.callSuper) {
                        delete this.callSuper;
                    }
                    return ret;
                }
            })(_super[name], props[name])
        } else {
            prototype[name] = props[name];    
        }
    }

    function Class() {}

    Class.prototype = prototype;
    Class.prototype.constructor = Class;

    Class.extend =  extend;
    Class.create = Class.prototype.create = function () {

        var instance = new this();

        if (instance.init) {
            instance.init.apply(instance, arguments);
        }

        return instance;
    }

    return Class;
}
```

来，我们测试一下吧

```
var Human = Class.extend({
    init: function () {
        this.nature = "Human";
    },
    say: function () {
        console.log("I am a human");
    }
})

var human = Human.create();
console.log(human);
human.say();

var Man = Human.extend({
    init: function () {
        this.callSuper();
        this.sex = "man";
    },
    say: function () {
        this.callSuper();
        console.log("I am a man");
    }
});

var man = Man.create();
console.log(man);
man.say();

var Person = Man.extend({
    init: function () {
        this.callSuper();
        this.name = "lee";
    },
    say: function () {
        this.callSuper();
        console.log("I am Lee");
    }
})

var person = Person.create();
console.log(person);
person.say();
```
[DEMO](http://jsfiddle.net/4qRUz/)

真的要抛弃new关键字了


无论如何上面的方法我们都使用了new关键字，接下来叙述的是真正不是用new关键字的方法

第一个问题是：如何生成一个对象？

```
var obj = {};
var obj = new Fn();
var obj = Object.create(null)
```

第一个方法可拓展性太低，第二个方法我们已经决定抛弃了，那重点就在第三个方法

你们还记得第三个方法是怎么用的吗？在MDN中是这样解释的

> Creates a new object with the specified prototype object and properties.

假设我们有一个矩形对象：

```
var Rectangle = {
    area: function () {
        console.log(this.width * this.height);
    }
};
```

我们想生成一个有它所有方法的对象应该怎么办？

```
var rectangle = Object.create(Rectangle);
```

生成之后，我们还可以给这个实例赋值长宽，并且取得面积值

```
var rect = Object.create(Rectangle);
rect.width = 5;
rect.height = 9;
rect.area();
```

这是一个很神奇的过程，我们没有使用new关键字，但是我们实例化了一个对象，给这个对象加上了自己的属性，并且成功调用了类的方法。

但是我们希望能自动化赋值长宽，没问题，那就定义一个create方法

```
var Rectangle = {
    create: function (width, height) {
      var self = Object.create(this);
      self.width = width;
      self.height = height;
      return self;
    },
    area: function () {
        console.log(this.width * this.height);
    }
};
```

怎么使用呢？

```
var rect = Rectangle.create(5, 9);
rect.area();
```

现在你可能大概明白了，在纯粹使用Object.create的机制下，已经完全抛弃了构造函数这个概念了。一切都是对象，一个类也可以是对象，这个类的实例不过是装饰过的它自己的复制品。

那么如何实现继承呢，假设我们需要一个正方形，继承自这个长方形

```
var Square = Object.create(Rectangle);

Square.create = function (side) {
  return Rectangle.create.call(this, side, side);
}

var sq = Square.create(5);
sq.area();
```

这种做法其实和我们第一种最基本的类似

```
function Man(name, age) {
    Human.call(this, name);
    this.age = age;
} 
```

上面的方法还是太复杂了，我们希望自动化，于是我们可以写这么一个extend函数

```
function extend(extension) {
    var hasOwnProperty = Object.hasOwnProperty;
    var object = Object.create(this);

    for (var property in extension) {
      if (hasOwnProperty.call(extension, property) || typeof object[property] === "undefined") {
        object[property] = extension[property];
      }
    }

    return object;
}

/*
    其实上面这个方法可以直接写成prototype方法：Object.prototype.extend
    但这样盲目的修改原生对象的prototype属性是大忌
    于是还是分开来写了
*/

var Rectangle = {
    extend: extend,
    create: function (width, height) {
      var self = Object.create(this);
      self.width = width;
      self.height = height;
      return self;
    },
    area: function () {
        console.log(this.width * this.height);
    }
};
```

这样当我们需要继承时，就可以像前几个方法一样用了

```
var Square = Rectangle.extend({
    create: function (side) {
         return Rectangle.create.call(this, side, side);
    }
})

var s = Square.create(5);
s.area();
```

OK，今天的课就到这里了。其实还有很多工作可以做，比如实现多继承(Mixin模式)，如何实现自定义的instancef方法等等。这篇文章算抛砖引玉吧，有兴趣的朋友可以继续研究下去。

引用资料

[Why Prototypal Inheritance Matters](http://aaditmshah.github.io/why-prototypal-inheritance-matters/)

[Object.create](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)

[Object.create() Improves Constructor-Based Inheritance In Javascript - It Doesn't Replace It](http://www.bennadel.com/blog/2184-Object-create-Improves-Constructor-Based-Inheritance-In-Javascript-It-Doesn-t-Replace-It.htm)

[JS101: Object.create](http://dailyjs.com/2012/06/04/js101-object-create/)

[Simple “Class” Instantiation](http://ejohn.org/blog/simple-class-instantiation/)

[Understanding the difference between Object.create() and new SomeFunction() in JavaScript](http://stackoverflow.com/questions/4166616/understanding-the-difference-between-object-create-and-new-somefunction-in-j)

[What is the reason to use the 'new' keyword here?](http://stackoverflow.com/questions/12592913/what-is-the-reason-to-use-the-new-keyword-here)

[JavaScript inheritance: Object.create vs new](http://stackoverflow.com/questions/13040684/javascript-inheritance-object-create-vs-new)

[Is JavaScript 's “new” Keyword Considered Harmful?](http://stackoverflow.com/questions/383402/is-javascript-s-new-keyword-considered-harmful)
