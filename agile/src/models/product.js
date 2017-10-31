/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'common',
    'models/global'
], function (Backbone, C, G) {
    'use strict';
    var base = Backbone.Model.extend({
        defaults: {
            "versionList": [],
            "isReady": 0,
            'subject': '未定义',
            "submitter": "",
            "creator": "",
            "issueKey": "",
            "isSplit": 0,
            "reqState": 1,
            "assigner": "",
            "description": " ",
            "priority": 3,
            //    默认值 1为需求 2缺陷
            "issueType": 1,
            "smTeamId": 0,
            "pmsId": "",
            "component": "",
            "createTime": "",
            "background": "",
            "rank": 0,
            "reqCommentList": [],
            "reqRelateList": [],
            "attachmentList": [],
            "reqTagList": [],
            "reqPartyList": [],
            "state": "",
            "acList": [],
            "tagName": "",
            "planPublishDate": "",
            "rootPath": rootPath,
            "storyNum": 0,
            "parentId": null,
            "blockNum": 0,
            "isBug": 0,
            "emergency": 0,
            "verRank": 1,
            "resolved": 0,
            "showType": '1',
            //todo 为什么需要团队id
            "teamId": ""
        },
        url: "productReq/productReqDetail.shtml",
        updateUrl: "productReq/editReq.shtml",
        updateSprintUrl: "productReq/editReq.shtml",

        resFilter: function (res) {
            return res['productReqFormMap'] || res;
        },
        _delete: function () {
            var model = this;
            return this.sync("read", this, {
                url: rootPath + '/productReq/delProductReq.shtml',
                data: {
                    productReqId: this.id
                },
                success: function (res) {
                    if (!res[C.SUCCESS]) {
                        layer.msg(res[C.MSG]);
                        return;
                    }
                    model.stopListening();
                    model.trigger('destroy', model, model.collection);

                    if (res.isRefresh) {
                        var eventMap = {
                            "demand": "DEMAND-REFRESH",
                            "PB": "PRODUCT-LIST-REFRESH"
                        };

                        Backbone.trigger(eventMap[res.target]);
                    }
                }
            });
        },
        //获取详情接口
        refresh: function () {
            return this.fetch({data: {id: this.model.id}});
        },

        /**
         * 统一获取详情接口参数
         * @returns {*}
         */
        fetch: function (options) {
            options || (options = {});
            _.extend(options, {data: {id: this.id, teamId: G.get('team')}});
            return Backbone.Model.prototype.fetch.call(this, options);
        },


        getLeafNodes: function () {
            var result = [];
            if (this.children) {
                result = this.children
                    .map(function (i) {
                        return i.getLeafNodes();
                    });
            }
            if (!result.length) result = [this.toJSON()];
            return _.flatten(result);
        },

        /**
         * 返回需求池里面可以进入产品列表的需求(数据结构 Model)
         */
        getLeafModels: function () {
            var result = [];
            if (this.children) {
                result = this.children
                    .map(function (i) {
                        return i.getLeafModels();
                    });
            }

            if (!result.length) result = [this];
            return _.flatten(result);
        },


        /**
         * 获取基础信息
         * @returns {*}
         */
        fetchBasicInfo: function (options) {
            options || (options = {});
            _.extend(options, {
                url: 'productReq/rowInfo.shtml',
                data: {id: this.id}
            });
            return Backbone.Model.prototype.fetch.call(this, options);
        }
    });

    return base;
});