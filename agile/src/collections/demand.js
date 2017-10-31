/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'models/demand',
    'models/global'
], function (Backbone, Demand, Global) {
    'use strict';
    var demandList = Backbone.Collection.extend({

        model: Demand,

        url: rootPath + '/demand/demandLists.shtml',

        refresh: function (options) {
            options = _.extend({
                reset: true,
                data: {
                    teamId: Global.get('team')
                }
            }, options);

            if (!options.silent) this.trigger('requesting');

            return this.fetch(options)
        },

        prioritySort: function () {
            return this.refresh({
                    data: {
                        teamId: Global.get('team'),
                        orderType: "priority"
                    }
                }
            )
        },

        deadlineSort: function () {
            return this.refresh({
                data: {
                    teamId: Global.get('team'),
                    orderType: "deadline"
                }
            })
        },

        search: function (data) {
            this.refresh({
                url: rootPath + '/demand/searchDemandLists.shtml',
                data: data
                // ,
                // resFilter: function(resp){
                //     return resp.demandFormMapList
                // }
            })
        }
    });

    return new demandList();
});