/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'models/global'
], function (Backbone, Global) {

    'use strict';

    var tagCollection = Backbone.Collection.extend({

        url: rootPath + "/tag/teamTagLists.shtml",

        refresh: function () {
            var teamId = Global.get('team');
            if (!teamId) return false;

            return this.fetch({
                reset: true,
                data: {
                    teamId: teamId
                }
            })
        },

        initialize: function () {
            this.listenTo(Global, 'change:team', this.refresh);
        }

    });
    return new tagCollection();
})