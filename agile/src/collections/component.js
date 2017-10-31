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
        url: rootPath + '/component/comBasicLists.shtml',

        getSelect2Data: function(){
            var data = this.toJSON();
                data.map(function(i){
                    i.text = i.name;
                    delete i.name;
                    return i;
                });
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