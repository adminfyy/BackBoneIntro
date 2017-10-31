/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'collections/team-member',
    'models/global',
    'collections/team-component'
], function (Backbone, teamMembers, Global, teamComponent) {
    'use strict';
    var base = Backbone.Model.extend({
        url: 'productReq/productReqDetail.shtml',
        urlMap: {
            'read': 'productReq/productReqDetail.shtml',
            'create': 'productReq/saveReq.shtml',
            'update': 'productReq/editReq.shtml',
            'delete': 'productReq/delProductReq.shtml',
            'basic-info': 'productReq/rowInfo.shtml'
        },
        // schema: {},
        defaults: {
            "isBusinessBoard": 0,
            "teamRank": null,
            "versionName": "[未规划版本]",
            "canSplit": 1,
            "canBack": 0,
            "canCancel": 0,
            "canDelete": 1,
            "tagName": "",
            "parentId": null,
            "state": "",
            "isNew": 0,
            "isVip3": 0,
            "isSensive": 0,
            "isKeyBusiness": 0,
            "isCompetition": 0,
            "isPotential": 0,
            "isOther": 0,
            "subject": "",
            "planPublishDate": null,
            "planDeliverTime": null,
            "issueType": "",
            "priority": 4,
            "description": "",
            "multiComName": '',
            "mainComponent": "",
            "mainComponentId": "",
            'isMultiComponent': 0,
            "relateComponentId": "",
            "createTime": "",
            "buslineRank": "",
            "storyNum": 0,
            "emergency": 0,
            'submitter': '',
            "gradeArea": "",
            "sensiveReason": "",
            "keyBusinessReason": "",
            "competitionSituation": "",
            "potentialReason": "",
            "otherReason": "",
            "solutionWikiUrl": "",
            "acList": [],
            "attachmentList": [],
            "reqCommentList": [],
            "wikiLinkList": [],
            "reqTagList": [],
            "reqRelateList": [],
            "versionList": [],
            "reqTreeList": [],
            "buslineName": "",
            "isSplit": 0,
            "assigner": "",
            "comName": '',
            "canShowKeyWords": '1',
            'pmsId': null
        },

        resFilter: function (res) {
            return res['productReqFormMap'] || res;
        },

        initialize: function () {
            Backbone.Model.prototype.initialize.call(this);

            if (this.get('isSplit')) {
                if (!this.collection) return;
                var childConstructor = this.collection.constructor.extend({
                    url: "productReq/getChildReqList.shtml",
                    query: function () {
                        return this.fetch({
                            reset: true,
                            data: this.queryModel.toJSON()
                        });
                    }
                });
                this.childs = new childConstructor();
                this.childs.listenToQuery();
                this.childs.parent = this;

                var query = _.extend({}, {
                    'parentId': this.id,
                    'teamId': Global.get('team')
                });
                this.childs.queryModel.set(query, {silent: true});
                this.childs.listenTo(this, 'change', this.childs.parentChanged);

                this.listenTo(this.childs, 'destroy', this.childrenDestroy);
                this.listenTo(this.childs, 'change', this.childrenChange);
            }
        },

        childrenChange: function (model) {
            if (model.hasChanged('reqState')) this.set('reqState', !this.childs.where({reqState: 0}).length ? 1 : 0);
            if (model.hasChanged('comName')) {
                this.set('multiComName', this.getMultiComName(this.get('comName')));
            }
            if (model.hasChanged('state')) {
                this.debounceFetchBasicInfo();
            }
        },

        fetchDetail: function () {
            return this.fetch({
                data: {id: this.id}
            });
        },

        getMultiComName: function (comName) {
            comName || (comName = this.get('comName'));
            if (!this.childs) return '';
            var comNameList = this.childs.pluck('comName');
            comNameList = _.reject(comNameList, function (e) {
                return e === comName;
            });
            comNameList = _.unique(comNameList);
            return comNameList.join(',');
        },

        childrenDestroy: function (e) {
            var hasChild = this.childs.length > 0;
            var isVersioned = this.get('versionList').length;
            var isFromPMS = this.get('pmsId');
            var isItInSprint = this.get('reqState') != 0;

            if (!hasChild) this.set('isSplit', false);
            if (!hasChild && !isVersioned && !isFromPMS && !isItInSprint) {
                this.set('canDelete', true);
            }
        },

        validate: function (attrs, options) {
            if (!attrs.subject || attrs.subject.trim().length === 0) {
                layer.msg('请填写标题');
                return '请填写标题';
            }

            if (!attrs.comName || attrs.comName.trim().length === 0) {
                $("#component").val('');
                layer.msg('请选择组件');
                return '请选择组件';
            }
        },

        transformAttributesForServer: function (attributes) {
            function getNew(model) {
                return !model.id;
            }

            function getEdit(model) {
                return model.id;
            }

            function getDeleteArray(originalArray, targetArray) {
                var resultArray = [];
                resultArray = originalArray.filter(function (oriItem) {
                    var isDeleted = true;
                    targetArray.forEach(function (tarItem) {
                        if (oriItem.id === tarItem.id) isDeleted = false;
                    });
                    return isDeleted;
                });
                return resultArray;
            }

            attributes.addAcList = attributes.acList.filter(getNew);
            attributes.editAcList = attributes.acList.filter(getEdit);
            attributes.delAcList = getDeleteArray(this.get('acList'), attributes.acList);

            attributes.addAttachmentList = attributes.attachmentList.filter(getNew);
            attributes.editAttachmentList = attributes.attachmentList.filter(getEdit);
            attributes.delAttachmentList = getDeleteArray(this.get('attachmentList'), attributes.attachmentList);

            attributes.addReqCommentList = attributes.reqCommentList.filter(getNew);
            attributes.editReqCommentList = attributes.reqCommentList.filter(getEdit);
            attributes.delReqCommentList = getDeleteArray(this.get('reqCommentList'), attributes.reqCommentList);

            attributes.wikiLinkList = attributes.wikiLinkList;

            // 拆解List成 add、edit、del给服务端处理
            _.extend(attributes, {
                emergency: attributes.emergency ? 1 : 0,
                isMultiComponent: attributes.isMultiComponent ? 1 : 0
            });

            attributes.reqRelateList ?
                attributes.reqRelateList = attributes.reqRelateList.map(function (el) {
                    return {relateId: el};
                }) :
                attributes.reqRelateList = [];
            //拆解时若没有指派者，则使用当前登录用户；
            attributes.assignerId || (attributes.assignerId = window.secretUserId);
            attributes.assigner = teamMembers.getMemberName(attributes.assignerId);
            attributes.accountName = teamMembers.getAccountName(attributes.assignerId);
            attributes.planPublishDate || (attributes.planPublishDate = null);
            attributes.multiComName = this.getMultiComName(attributes.comName);
            return attributes;
        },

        deleteItem: function () {
            return this.destroy({
                data: {
                    productReqId: this.id
                },
                processData: true,
                wait: true,
                type: 'GET'
            });
        },

        //进入产品列表
        gettingIntoProductList: function () {
            var self = this;
            return this.sync("read", this, {
                url: 'productReq/dragProductReq.shtml',
                data: {productReqId: this.id, reqState: 1, teamId: Global.get('team')}
            });
        },

        //进入产品列表
        gettingIntoDemandPool: function () {
            var self = this;
            return this.sync("read", this, {
                url: 'productReq/dragProductReq.shtml',
                data: {productReqId: this.id, reqState: 0, teamId: Global.get('team')}
            });
        },

        getInPB: function () {
            return this.fetchBasicInfo();
        },

        fetchBasicInfo: function () {
            return this.fetch({
                data: {
                    id: this.id
                },
                url: this.getUrl('basic-info')
            })
        },

        debounceFetchBasicInfo: _.debounce(function () {
            return this.fetch({
                data: {
                    id: this.id
                },
                url: this.getUrl('basic-info')
            })
        }, 100),

        /**
         * 返回需求池里面可以进入产品列表的需求(数据结构 Object)
         */
        getLeafNodes: function () {
            var result = [];
            var teamComList = teamComponent.pluck("comId");
            if (this.childs) {
                result = this.childs.filter(function (model) {
                    return _.contains(teamComList, Number(model.get('comId')));
                })
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
            var teamComList = teamComponent.pluck("comId");
            if (this.childs) {
                result = this.childs.filter(function (model) {
                    return _.contains(teamComList, Number(model.get('comId')));
                })
                    .map(function (i) {
                        return i.getLeafModels();
                    });
            }

            if (!result.length) result = [this];
            return _.flatten(result);
        },

        fetch: function (options) {
            _.extend(options, {data: {id: this.id, teamId: Global.get('team')}});
            return Backbone.Model.prototype.fetch.call(this, options);
        }
    });

    return base;
});