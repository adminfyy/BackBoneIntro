/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone'
],function (Backbone) {
    'use strict';
    var base = Backbone.Model.extend({
        idAttribute: "comId",
        defaults : {
            'name': '组件名'
        }
    });

    return base;
});