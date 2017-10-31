/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone'
], function (Backbone) {
    'use strict';
    var base = Backbone.Model.extend({
        defaults: {
            id: null,
            teamName: '',
            component: [],
            componentName: "",
            orgId: "",
            orgName: "",
            templateId: "",
            templateName: "",

            smIdList: [],
            poIdList: [],
            memberIdList: []
        },

        urlMap: {
            'create': rootPath + "/teammanager/addTeam.shtml",
            'delete': rootPath + '/teammanager/deleteTeam.shtml',
            'update': rootPath + "/teammanager/editTeam.shtml",
            'read': rootPath + '/teammanager/getTeamDetail.shtml'
        },

        //删除
        destroy: function () {
            var model = this;
            var options = {
                data: {
                    teamId: this.id
                },
                //Backbone默认destory方法会 不转换data成为json
                type: 'GET',
                processData: true,
                wait: true
            };
            return Backbone.Model.prototype.destroy.call(this, options);
        },

        //查询详情
        fetch: function (options) {
            options = _.extend({
                data: {
                    teamId: this.get('id')
                }
            }, options);

            return Backbone.Model.prototype.fetch.call(this, options)
        },

        resFilter: function (res) {
            if (!res['success']) {
                layer.msg(res['msg']);
                //return null so that could not be setted
                return null;
            }
            return res['teamFormMap'] || null
        }
    });

    return base;
});