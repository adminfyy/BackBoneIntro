/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'models/team'
], function (Backbone, Model) {
    'use strict';
    var collection = Backbone.Collection.extend({

        model: Model,

        url: rootPath + "/template/getAllTemplate.shtml",

        resFilter: function (data) {
            data.templateList = data.templateList || [];
            return data.templateList
        },

        getSelect2Data: function () {
            var data = this.toJSON();
            data.map(function (i) {
                i.text = i.name;
                return i;
            });
            return data;
        },

        schema: {
            "success|1": true,
            "msg": "@paragraph",
            "templateList|1-20": [{
                'id|1-20': 20,
                "name": "@name"
            }]
        }

    });

    var instance = new collection();
        instance.fetch();
    return instance;
})