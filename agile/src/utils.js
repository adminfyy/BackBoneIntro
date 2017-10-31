define(function () {
    return {
        //确保名字包含list的属性固定为 数组 类型
        ensureListPropertyList: function (obj) {
            var keys = Object.keys(obj);
            keys.forEach(function (key) {
                var lowercaseKey = key.toLowerCase();
                if (/list/.test(lowercaseKey)) {
                    obj[ key ] = _.isArray(obj[ key ]) ? obj[ key ] : _.flatten([ obj[ key ] ]);
                }
            });
            
            return obj;
        },
        
        convertArray2Tree: function (array, root, parentKey) {
            parentKey || (parentKey = 'parentId');
            var bfsArray = [ root ];
            
            for (; bfsArray.length > 0;) {
                var node = bfsArray.shift();
                node.children = array.filter(function (i) {
                    return i[ parentKey ] === node.id && i.id !== node.id;
                });
                //添加元素
                Array.prototype.push.apply(bfsArray, node.children);
            }
            return root;
        },
        
        /**
         * 加工多选下拉框的值，始终返回一个数组;
         */
        getMultipleSelectValue: function (preValue) {
            if (_.isArray(preValue)) return preValue;
            if (typeof preValue === 'string') return [ preValue ];
            return [];
        }
    };
});