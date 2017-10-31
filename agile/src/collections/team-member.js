/**
 * Created by miaoym on 2017年5月5日
 */
define([
    "backbone",
    'models/global'
], function (Backbone, Global) {
    "use strict";
    var teamMemberCollection = Backbone.Collection.extend({
        url: rootPath + '/member/getTeamMembers.shtml',
        
        refresh: function () {
            this.fetch({
                reset: true, data: {
                    teamId: Global.get("team")
                }
            });
            return this;
        },
        
        getSelect2Data: function () {
            var data = this.toJSON();
            data = data.map(function (d) {
                return {
                    text: d.name + '(' + d.accountName + ')',
                    id: d.id
                };
            });
            return data;
        },
        
        initialize: function () {
            this.listenTo(Global, 'change:team', _.debounce(this.refresh, 200));
        },

        getMemberName: function (id) {
            id = Number(id);
            var name = "",
                user = this.get(id);

            if (user) {
                user = user.toJSON();
                name = user.name;
            }
            return name;
        },

        getAccountName: function (id) {
            id = Number(id);
            var name = "",
                user = this.get(id);

            if (user) {
                user = user.toJSON();
                name = user.accountName || "";
            }
            return name;
        }
    });
    return new teamMemberCollection();
});