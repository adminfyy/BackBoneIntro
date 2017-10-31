/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'mock',
    'models/e2e'
], function (Backbone, Mock, Model) {
    'use strict';
    var Collection = Backbone.Collection.extend({
        model: Model,
        url: 'end2end/getEnd2EndReqList.shtml',
        schema: {
            "success": true,
            "totalReqCount": '298',
            "list|10-12": [{
                "id|+1": 1,
                "subject": "@name",
                "pmsId|+1": 2121,
                "po": "@cname",
                "comName": "@word(3,6)",
                "comId": "@integer",
                "multiComName": "@name",
                "state|1": [
                    '客户提出',
                    '需求审核',
                    '新建',
                    '就绪',
                    '已规划',
                    '研发中',
                    '发布',
                    '升级',
                    '关闭'
                ],
                "emergency|1": [0, 1],
                "isVip3|1": [0, 1],
                "isMultiVersion|1": [0, 1],
                "isObservation|1": [0, 1],
                "isMultiComponent|1": [0, 1],
                "planPublishDate": "2017-@integer(5,10)-@integer(1,30)",
                "pmsCreateTime": "2017-@integer(5,10)-@integer(1,30)",
                "pmsAuditTime": "2017-@integer(5,10)-@integer(1,30)",
                "createTime": "2017-@integer(5,10)-@integer(1,30)",
                "readyTime": "2017-@integer(5,10)-@integer(1,30)",
                "planVersionTime": "2017-@integer(5,10)-@integer(1,30)",
                "developingTime": "2017-@integer(5,10)-@integer(1,30)",
                "releaseTime": "2017-@integer(5,10)-@integer(1,30)",
                "deployStartTime": "2017-@integer(5,10)-@integer(1,30)",
                "deployEndTime": "2017-@integer(5,10)-@integer(1,30)",
                "customerCheckTime": "2017-@integer(5,10)-@integer(1,30)",

                "pmsAuditPeriod": "@integer(0,20)",
                "planReqPeriod": "@integer(0,20)",
                "handleReqPeriod": "@integer(0,20)",
                "deployPeriod": "@integer(0,20)",
                "customerCheckPeriod": "@integer(0,20)",
                "observationPeriod": "@integer(0,20)",
                "childReqList|0-2":
                    [{
                        "id|+1": 12,
                        "subject": "@name",
                        "pmsId|+1": "2121",
                        "po": "@cname",
                        "isMultiComponent|1": [0, 1],
                        "comName": "@word(3,6)",
                        "comId": "@integer",
                        "multiComName": "@name",
                        "state|1": [
                            '客户提出',
                            '需求审核',
                            '新建',
                            '就绪',
                            '已规划',
                            '研发中',
                            '发布',
                            '升级',
                            '关闭'
                        ],
                        "emergency|1": [0, 1],
                        "isVip3|1": [0, 1],
                        "planPublishDate": "2017-@integer(5,10)-@integer(1,30)",
                        "pmsCreateTime": "2017-@integer(5,10)-@integer(1,30)",
                        "pmsAuditTime": "2017-@integer(5,10)-@integer(1,30)",
                        "createTime": "2017-@integer(5,10)-@integer(1,30)",
                        "readyTime": "2017-@integer(5,10)-@integer(1,30)",
                        "planVersionTime": "2017-@integer(5,10)-@integer(1,30)",
                        "developingTime": "2017-@integer(5,10)-@integer(1,30)",
                        "releaseTime": "2017-@integer(5,10)-@integer(1,30)",
                        "deployStartTime": "2017-@integer(5,10)-@integer(1,30)",
                        "deployEndTime": "2017-@integer(5,10)-@integer(1,30)",
                        "customerCheckTime": "2017-@integer(5,10)-@integer(1,30)",
                        "isMultiVersion|1": [0, 1],
                        "isObservation|1": [0, 1],

                        "pmsAuditPeriod": "@integer(0,20)",
                        "planReqPeriod": "@integer(0,20)",
                        "handleReqPeriod": "@integer(0,20)",
                        "deployPeriod": "@integer(0,20)",
                        "customerCheckPeriod": "@integer(0,20)",
                        "observationPeriod": "@integer(0,20)"
                    }]
            }]
        },

        resFilter: function (res) {
            res.reqList || (res.reqList = []);
            if (this.totalCount != res['totalReqCount']) {
                this.totalCount = res['totalReqCount'];
                this.trigger('change:total-count');
            }
            return res.reqList;
        },

        filterChange: function () {
            this.goPage(1);
            this.pagination.trigger('change:page');
        },

        query: function () {
            this.trigger('requesting');
            var data = this.queryModel.toJSON();
            var pagination = this.pagination.toJSON();
            _.extend(data, pagination);
            return this.fetch({
                reset: true,
                type: 'POST',
                processData: true,
                contentType: 'application/json',
                data: JSON.stringify(data)
            })
        },

        //分页操作
        totalCount: 0,

        goPage: function (page) {
            this.pagination.set('page', page)
        },

        goNext: function () {
            var nextPage = this.pagination.get('page') + 1;
            if (nextPage > Math.ceil(this.totalCount / this.pagination.get('pageSize'))) return;
            this.pagination.set('page', nextPage)
        },

        goPrevious: function () {
            var previousPage = this.pagination.get('page') - 1;
            if (previousPage < 1) return;
            this.pagination.set('page', this.pagination.get('page') - 1)
        },

        getPaginationElements: function () {
            var currentPage = Number(this.pagination.get('page'));
            var totalPage = Math.ceil(this.totalCount / (this.pagination.get('pageSize'))) || 1;
            var withFirstPage = true;
            var withLastPage = true;
            var template = "<li class='noop'><a href=\"#\" data-index='pageIndex'>pageIndex</a></li>";
            var previous = "<li><a href=\"#\" data-index='previous'>上一页</a></li>";
            var next = "<li><a href=\"#\" data-index='next'>下一页</a></li>";
            var first = "<li><a href=\"#\" data-index='1'>1...</a></li>";
            var last = "<li><a href=\"#\" data-index='" + totalPage + "'>..." + totalPage + "</a></li>";
            var elements = [];

            if ((currentPage - 3) <= 1) withFirstPage = false;
            if ((currentPage + 3) > totalPage) withLastPage = false;
            var delta = 0;

            for (var i = (currentPage - 3 < 1) ? 1 : currentPage - 3; i <= totalPage && delta <= 5;) {
                var element = template.replace(/pageIndex/g, i.toString());
                if (i === currentPage) element = element.replace('noop', 'active');
                elements.push(element);
                i++;
                delta++;
            }
            if (withFirstPage) elements.unshift(first);
            if (withLastPage) elements.push(last);
            elements.unshift(previous);
            elements.push(next);
            return elements;
        },

        initialize: function () {
            // Mock.mock(this.url, this.schema);
            this.queryModel = this.filter = new Backbone.Model({
                'orderType': 1
            });

            this.pagination = new Backbone.Model({
                'page': 1,
                'pageSize': 10
            });

            this.listenTo(this.queryModel, 'change', this.filterChange);
            this.listenTo(this.pagination, 'change:pageSize', this.filterChange);
            this.listenTo(this.pagination, 'change:page', _.debounce(this.query, 100));
        }
    });

    var instance = new Collection();
    return instance;
});