/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'models/component',
    'models/global'
], function (Backbone, Model, Global) {
    'use strict';
    var collection = Backbone.Collection.extend({
        url: 'component/getTeamComList.shtml',
        model: Model,
        getSelect2Data: function () {
            var data = this.toJSON();
            data.map(function (d) {
                d.id = d.comId;
                d.text = d.name;
                return d;
            });
            return data;},

        getZtreeData: function() {
            return this.toJSON();
        },

        getByParamFuzzy: function(e) {
            var data = this.toJSON();
            var arr =[];
            data.forEach(function(d) {
                if(d.name.toLowerCase().indexOf(e)>=0) {
                    arr.push(d)
                }
            });
            return arr;
        },

        resFilter: function (res) {
            res.comList || (res.comList = []);
            return res.comList;
        },

        initialize: function () {
            this.refresh();
            this.listenTo(Global, 'change:team', _.debounce(this.refresh, 200))
        },

        refresh: function refreshTeam () {
            var teamId = Global.get('team');
            if (!teamId) return;
            return this.fetch({
                data: {
                    teamId: Global.get('team')
                }
            })
        }
    });
    return new collection();
})