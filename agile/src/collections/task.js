/**
 * Created by fuyy on 2017/4/5.
 */
define([
    'backbone',
    'models/task'
], function (Backbone, task) {
    'use strict';
    var collection = Backbone.Collection.extend({
        model: task
    });

    return collection;
})