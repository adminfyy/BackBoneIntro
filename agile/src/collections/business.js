define(['backbone'], function (Backbone) {

    var constructor = Backbone.Collection.extend({

        url: 'busline/getBusLineList.shtml',

        resFilter: function (res) {
            return res['buslineList'] || []
        },

        //数据结构模型 规则参照mock.js
        schema: {
            //always true
            "success": true,
            "msg": "@paragraph",
            "buslineList|5-20": [{
                "id|+1": 1,
                "name": "业务线@integer(0,10)",
                "remark": "@word"
            }]
        },

        getSelect2Data: function () {
            var data = this.toJSON();
            data.map(function (i) {
                i.text = i.name;
                return i;
            });
            return data;
        },
    });

    var i = new constructor();
    i.fetch();
    return i;
});