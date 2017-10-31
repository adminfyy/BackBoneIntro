/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'models/product',
    'models/global'
], function (Backbone, Model, Global) {
    'use strict';
    var StageCollections = Backbone.Collection.extend({
        model: Model,

        url: rootPath + '/productReq/getReqListWithOutParent.shtml',

        refresh: function (options) {
            options = _.extend({
                reset: true,
                data: {
                    reqState: 2,
                    teamId: Global.get('team')
                }
            }, options)

            if (!options.silent) this.trigger('requesting')
            return this.fetch(options)
        },

        prioritySort: function () {
            return this.refresh({
                data: {
                    teamId: Global.get('team'),
                    reqState: 2,
                    orderType: "priority"
                }
            })

        },

        deadlineSort: function () {
            return this.fetch({
                data: {
                    teamId: Global.get('team'),
                    reqState: 2,
                    orderType: "deadline"
                }
            })

        }
    });
    var instance = new StageCollections();


    return instance;
})