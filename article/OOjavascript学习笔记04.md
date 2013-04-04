# 面向对象javascript学习笔记

### 各种混合继承

前几回谈的都是理想情况，有一个很现实的问题是，有的属性你希望从父类直接
继承拿来用，而有的属性你希望自定义。这样情况下你就希望深拷贝和浅拷贝
同时使用

```
function objectPlus(o, stuff) {
  var n;
  function F() {}
  F.prototype = o;
  n = new F();
  n.uber = o;
  for (var i in stuff) {
     n[i] = stuff[i];
  }
  return n;
}
```

上面生成了一个对象，该对象的原型链继承自`o`，但是属性
继承自`stuff`。

如果想继承多个父类的属性应该怎么办呢

```
function multi() {
  var n = {}, stuff, j = 0, len = arguments.length;
  for (j = 0; j < len; j++) {
     stuff = arguments[j];
     for (var i in stuff) {
      n[i] = stuff[i];
     }
  }
  return n;
}
```

这个方法简单粗暴，并没有分清楚是原型链的属性还是一般属性

#### Parasitic Inheritance

这个方法我不觉得有什么特别吧，而且我也不知道怎么翻译，只是
书上提到了我就顺带也搬过来

这个方法也是大神 Douglas Crockford 发明的，它能创建一个对象，
这个对象包含了另一个对象的所有功能，然后再这个方法中加入自己的功能

```
// 首先假设有这么一个对象
var twoD = {
  name: '2D shape',
  dimensions: 2
};

// 继承方法
function triangle(s, h) {
  var that = object(twoD); //首先用之前的任意一个继承方法克隆对象，返回给that
  that.name ='Triangle';
  that.getArea = function(){return this.side * this.height / 2;};
  that.side = s;
  that.height = h; // 以上都是增强自己的属性！
  return that; // 返回
}
```

因为这个方法只是一个函数而不是构造函数，所以当你需要用这个方法生成自己
子类的时候，不需要new关键字

```
>>> var t = triangle(5, 10);
>>> t.dimensions
```


