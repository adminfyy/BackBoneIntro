/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'models/user'
], function ( Backbone, Model) {
    'use strict';
    var UserCollection = Backbone.Collection.extend({
        model: Model,
        url: rootPath + '/organization/findByPage.shtml',
        resFilter: function (data) {
            data.records = data.records || [];
            return data.records
        },
        getSelect2Data: function () {
            var data = this.toJSON();
                data.map(function(i){
                    i.text = i.name;
                    return i ;
                })
            return data;
        }
    });

    var instance = new UserCollection();
    instance.fetch({
        data: {
            pageSize: 100
        }
    });

    return instance;
})