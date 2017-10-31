/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'models/team'
], function (Backbone, Model, Mock) {
    'use strict';
    var collection = Backbone.Collection.extend({

        model: Model,

        url: rootPath + "/teammanager/getTeamList.shtml",

        resFilter: function (data) {
            data.teamList = data.teamList || [];
            return data.teamList
        },

        schema: {
            "success": true,
            "msg": "@paragraph",
            "teamList|1-20": [{
                'id|1-20': 20,
                'orgId|1-20': 20,
                'component|1-20': 20,
                'teamName': '@cname团队',
                'orgName': '@name',
                'componentName': '@name',
                'templateName': '@name'
            }]
        }
    });

    return new collection();
})