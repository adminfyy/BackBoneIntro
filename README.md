# Backbone 使用经验分享
[Backbone](http://backbonejs.org)主要包含下面几个模块，
## Backbone.Event 事件模式
Event是View跟Model还有Collection的基础，它主要实现了事件模式(订阅发布系统),个人理解;  
只要将Event模式集成到任何对象里面，这个对象就具备的Event的API;   
当有两个模块或者两个对象相互关联的时候，通过模式解耦之后，在这种模式下，每个对象只需要关注自身的数据以及方法，对于另外一个模块需要的就是一个信号以及数据;
引用前辈给我讲得一句话：  
>“事件模式是一个良好的解耦模式”

Event模块常用的api有:
```js
+ Event.on
+ Event.off
+ Event.trigger
+ Event.once
+ Event.listenTo
+ Event.listenToOnce
+ Event.stopListening
```
另外Model/Collection也具备上面的方法,在Model/Collection内置的方法中,一些操作数据的方法会触发特定的事件,事件列表如下：

+ "add" (model, collection, options) — when a model is added to a collection
+ "remove" (model, collection, options) — when a model is removed from a collection.
+ "update" (collection, options) — single event triggered after any number of models have been added or removed from a collection.
+ "reset" (collection, options) — when the collection's entire contents have been reset.
+ "sort" (collection, options) — when the collection has been re-sorted.
+ "change" (model, options) — when a model's attributes have changed.
+ "change:[attribute]" (model, value, options) — when a specific attribute has been updated.
+ "destroy" (model, collection, options) — when a model is destroyed.
+ "request" (model_or_collection, xhr, options) — when a model or collection has started a request to the server.
+ "sync" (model_or_collection, response, options) — when a model or collection has been successfully synced with the server.
+ "error" (model_or_collection, response, options) — when a model's or collection's request to the server has failed.
+ "invalid" (model, error, options) — when a model's validation fails on the client.
+ "route:[name]" (params) — Fired by the router when a specific route is matched.
+ "route" (route, params) — Fired by the router when any route has been matched.
+ "route" (router, route, params) — Fired by history when any route has been matched.
+ "all" — this special event fires for any triggered event, passing the event name as the first argument followed by all trigger arguments.

在Backbone的实现中, Collection监听了Model上面的‘all'事件, 具体实现请看 源码1173行左右
```js
var col = new Backbone.Collection([{ id: 'a'}, { id: 'b'}]);
var a = col.get('a');

col.on('change', function(){ console.log('collection change')})
a.on('change', function(){ console.log('Model change')})

a.set('name','jack')
// print 
// Model change
// Collection change
```
