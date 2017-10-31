/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone'
],function (Backbone) {
    'use strict';
    var base = Backbone.Model.extend({
        idAttribute: "issueKey",
        defaults : {
            'name': 'base',
            "title": "需求标题",
            "content": "需求内容",
            "issueType": "1"
        },

        url: rootPath + "/demand/viewDemand.shtml",
        updateUrl: rootPath + "/demand/viewDemand.shtml"
    });

    return base;
});