/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'models/component'
], function (Backbone, Model) {
    'use strict';
    var collection = Backbone.Collection.extend({
        url: 'component/getAllComList.shtml',

        model: Model,

        resFilter: function (res) {
            res.comList || (res.comList = [])
            return res.comList
        },

        getSelect2Data: function () {
            var data = this.toJSON();
            data.map(function (d) {
                d.id = d.comId;
                d.text = d.name;
                return d;
            });
            return data;
        },

        getZtreeData: function () {
            return this.toJSON();
        },

        getByParamFuzzy: function (e) {
            var data = this.toJSON();
            var arr = [];
            data.forEach(function (d) {
                if (d.name.toLowerCase().indexOf(e) >= 0) {
                    arr.push(d)
                }
            });
            return arr;
        },

        getComName: function (id) {
            id = Number(id);
            var name = "",
                com = this.get(id);
            if (com) {
                com = com.toJSON();
                name = com.name;
            }
            return name;
        },

        getGroupName: function (id) {
            id = Number(id);
            var name = "",
                com = this.get(id);
            if (com) {
                com = com.toJSON();
                name = com.groupName || "";
            }
            return name;
        },

        //获取某个组件到根节点 级联选择值
        getCascadeValue: function (id) {
            var casdeValue = [];
            var com = this.get(id);
            var parentId;
            while (com && com.get("name")) {
                casdeValue.unshift(com.get("name"));
                parentId = com.get('parentId');
                com = this.get(parentId);
                if (!parentId) {
                    break;
                }
            }
            return casdeValue.join(",");
        }
    });

    var instance = new collection();
    instance.fetch();
    return instance;
})