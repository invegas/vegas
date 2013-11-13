##为什么要搭建自己的缓存管理模块？

这个问题其实也是在问，为什么不使用现有的Cache存储系统，比如Redis，比如memcached。不是说Redis不够好，只是在处理某些场景中使用的Redis会显的太“笨重”了——Redis的优势之一在于能够使用于多进程共享，有完善的备份和恢复机制。但问题在于如果你的缓存仅供单个进程使用，单个node实例使用，并且是可以承受缓存的丢失，承受冷启动。那么是值得使用不到500行的代码来搭建一个自己的缓存模块。

在node中做缓存最简单的作法莫过于使用一个Object对象，将缓存以key-value的形式存入这个对象中，并且这么做的理由只有一个，就是更快的存取速度。相比Redis通过TCP连接的形式与客户端进行通信，在程序中直接使用对象进行存储的效率会是Redis的40倍。文章的最后我会给出一个性能测试：10000次的set操作，Redis使用的时间为12.5秒左右，平均运算次数为(operations per second)为8013 o/s，而如果使用原生的Object对象，10000次操作只需要0.3秒，平均运算次数为322581 o/s


##搭建自己的Cache模块需要解决什么问题

### 缓存淘汰算法
介于缓存只能够有限的使用内存，任何Cache系统都需要一个如何淘汰缓存的方案（缓存淘汰算法，或者称之页面置换算法）。在node中无法像Redis那样设置使用内存大小（Redis中的maxmemory），所以我们只能通过缓存的个数（key-value对数）来间接对缓存大小进行控制。但这同时也赋予了我们另一自由，就是用何种算法来淘汰多余的缓存，以便能提高命中率。Redis的只提供五种淘汰方案(maxmemory-policy):

- volatile-lru: remove a key among the ones with an expire set, trying to remove keys not recently used(根据过期时间，移除最长时间没有使用过的).
- volatile-ttl: remove a key among the ones with an expire set, trying to remove keys with short remaining time to live(根据过期时间，移除即将过期的).
- volatile-random: remove a random key among the ones with an expire set(根据过期时间任意移除一个).
- allkeys-lru: like volatile-lru, but will remove every kind of key, both normal keys or keys with an expire set(无论是否有过期时间，根据LRU原则来移除).
- allkeys-random: like volatile-random, but will remove every kind of keys, both normal keys and keys with an expire set(无论是否有过期时间，随机移除).

可见Redis的移除策略大部分是根据缓存的过期时间和LRU(Least Recently Used，最近最少使用，，其核心思想是“如果数据最近被访问过，那么将来被访问的几率也更高”)算法来移除的。但过期时间和LRU算法并非适用于任何的业务逻辑：1.有的业务可以无需给缓存设置过期时间；2.在某些场景中LFU(Least Frequently Used, 最近最多使用，其核心思想是“如果数据过去被访问多次，那么将来被访问的频率也更高”)算法比LRU更优，能够减少缓存缓存污染，同时正因为LRU算法存在一定的缺陷（存在热点数据时，LRU的效率很好，但偶发性的、周期性的批量操作会导致LRU命中率急剧下降），才会有一些列LRU算法的变形，比如LRU-K, Two queues, Multi Queue等。

所以我们决定在缓存模块中嵌入多个淘汰算法，不仅仅如此，我还设想将当用户不确定他所需要的淘汰算法时，我们可以同时运行多个算法，比如对前100000次get操作的各个算法进行命中率统计，100000次操作之后自动切换至命中率最高的算法。

###数据结构

以LRU算法为例，因为需要根据缓存访问的新鲜度来淘汰冷门缓存，非常明显这会是一个队首进热门数据，队尾出冷门数据的一个队列，假设我们用数组来实现：

```
Recently used unshift in                                  Cold cache pop
------>[{key: value}, {key: value},{key: value}......{key: value}]------>
|                                                |
|<--------------Recently used--------------------|
```

每一项的数据结构如下：
```
var cache = [
    {
        key: key,
        value: value,
        expire: 1000 * 3
    },
    {
        key: key,
        value: value,
        expire: 1000 * 3
    } 
    ...   
]
```
那么在每一次取缓存时(get操作)，就不得不对这个数组进行遍历。那么遍历的时间复杂度会是O(n)。如果当n较大时，遍历花费的时间是相当可观的。

