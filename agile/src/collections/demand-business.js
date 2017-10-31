/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'models/demand-business',
    'utils'
], function (Backbone, Demand, utils) {
    'use strict';
    var constructor = Backbone.Collection.extend({

        model: Demand,

        url: 'productReq/getMultiProductReqList.shtml',

        resFilter: function (res) {
            res.reqList || (res.reqList = []);
            return res.reqList
        },

        //查询条件变更
        query: function () {
            var newQuery = utils.ensureListPropertyList(this.queryModel.toJSON());
            //触发 请求中 事件 (出现请求动画)
            this.trigger('requesting');
            return this.fetch({
                reset: true,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(newQuery)
            })
        },

        getSelect2Data: function () {
            var json = this.toJSON();
            json.map(function (i) {
                i.text = i.subject
            })
            return json
        },

        schema: {
            "success|3-1": true,
            "msg": "接口失败咯",
            "reqList|0-50": [{
                // 'id|+1':1,
                "subject": "@title",
                "planPublishDate": "@date",
                "multiComName": ["@name", "@name", "@name"],
                // 'mainComponent|1-30': 1,
                'issueType|1': [1, 2, 3],
                'state|1': ['新建', '进行中', '开发中', '待验收'],
                'isNew|1': true,
                'isVip3|1': true,
                'isSensive|1': true,
                'isKeyBusiness|1': true,
                'isCompetition|1': true,
                'isPotential|1': true,
                'isOther|1': true,
                'priority|1': [1, 2, 3, 4],
                'assigner': "@name",
                'isHasChild|1-2': true,
                'parentId|0-20': 1
            }]
        },

        listenToQuery: function () {
            // 查询对象Object
            this.queryModel = new Backbone.Model();
            this.listenTo(this.queryModel, 'change', _.debounce(this.query.bind(this), 250));
        }
    });
    var instance = new constructor();
    instance.listenToQuery();
    return instance;
});