# 面向对象javascript学习笔记

### 深拷贝与浅拷贝

之前谈到的继承的方法有个前提，就是有一个构造函数
如果是两个没有构造函数的对象之间的继承应该怎么办？
那么可以这么做

```
function extendCopy(p) {
  var c = {};  
  for (var i in p) {
     c[i] = p[i];
  }
  c.uber = p;
  return c;
}
```

上面的方法可以称之为浅拷贝(shallow copy)，拷贝而来的属性并非自己复制一份
，而是指向父类的相应属性。相反有深拷贝(Deep copy)。即所有的属性都自己复制
一份，而非指向父类。（个人认为上面函数的拷贝是深是浅要依据所要继承的父类
属性的数据类型，当为函数或者数组是，为浅拷贝）

深拷贝的实现也十分简单，当判断拷贝的属性的数据类型是对象时，
则再一次执行深拷贝函数，你可以理解为递归

```
function deepCopy(p, c) {
  var c = c || {}; 
  for (var i in p) {
     if (typeof p[i] === 'object') {
      c[i] = (p[i].constructor === Array) ? [] : {};
      deepCopy(p[i], c[i]);
     } else {
      c[i] = p[i];
     } 
  }
  return c;
}
```