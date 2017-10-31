/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'collections/team-member'
], function (Backbone, teamMembers) {
    'use strict';
    var base = Backbone.Model.extend({
        url: 'productReq/multiProductReqDetail.shtml',
        urlMap: {
            'read': 'productReq/multiProductReqDetail.shtml',
            'create': 'productReq/saveReq.shtml',
            'update': 'productReq/editReq.shtml',
            'delete': 'productReq/delProductReq.shtml'
        },
        defaults: {
            "isBusinessBoard": 1,
            "parentId": null,
            "state": "",
            "isNew": 0,
            "isHasChild": 0,
            "isVip3": 0,
            "isSensive": 0,
            "isKeyBusiness": 0,
            "isCompetition": 0,
            "isPotential": 0,
            "isOther": 0,
            "id": "",
            "subject": "",
            "planPublishDate": "",
            "issueType": "",
            "priority": 4,
            "description": "",
            "multiComName": '',
            "comName": '',
            "mainComponent": "",
            "mainComponentId": "",
            'isMultiComponent': 0,
            "relateComponentId": "",
            "createTime": "",
            "buslaneRank": "",
            "assigner": "",
            "storyNum": 0,
            "emergency": "",
            'submitter': '',
            "gradeArea": "",
            "sensiveReason": "",
            "keyBusinessReason": "",
            "competitionSituation": "",
            "potentialReason": "",
            "otherReason": "",
            "solutionWikiUrl": "",
            "reqCommentList": [],
            "reqTagList": [],
            "reqRelateList": [],
            // "versionList": [],

            //todo
            "buslineName": ''
        },

        initialize: function () {
            Backbone.Model.prototype.initialize.call(this);
            if (this.get('isSplit')) {
                if (!this.hasOwnProperty('collection')) return;
                var childsConstructor = this.collection.constructor.extend({
                    url: 'productReq/getMultiChildReqList.shtml',
                    query: function () {
                        return this.fetch({
                            reset: true,
                            data: this.queryModel.toJSON()
                        })
                    }
                });

                this.childs = new childsConstructor();
                this.childs.listenToQuery();
                this.childs.parent = this;

                var query = _.extend({}, {
                    'parentId': this.id
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
                this.set('multiComName', this.getMultiComName(this.get('comName')))
            }
        },

        schema: {
            'success|1': true,
            'msg': '@paragraph',
            'businessReqFormMap': {}
        },

        childrenDestroy: function (e) {
            var hasChild = this.childs.length > 0;
            if (!this.childs.length) {
                this.set('isSplit', false);
            }
            if (!hasChild) {
                this.set('canDelete', true);
            }
        },

        validate: function (attrs, options) {
            if (!attrs.subject || attrs.subject.trim().length === 0) {
                layer.msg('请填写标题');
                return '请填写标题'
            }

            if (!attrs.comName || attrs.comName.trim().length === 0) {
                $("#component").val('');
                layer.msg('请选择组件');
                return '请选择组件'
            }
        },

        getMultiComName: function (comName) {
            comName || (comName = this.get('comName'));
            if (!this.childs) return '';
            var comNameList = this.childs.pluck('comName');
            comNameList = _.reject(comNameList, function (e) {
                return e === comName
            });
            return comNameList.join(',')
        },

        transformAttributesForServer: function (attributes) {
            function getNew(model) {
                return !model.id
            }

            function getEdit(model) {
                return model.id
            }

            function getDeleteArray(originalArray, targetArray) {
                // debugger
                var resultArray = [];
                resultArray = originalArray.filter(function (oriItem) {
                    var isDeleted = true;
                    targetArray.forEach(function (tarItem) {
                        if (oriItem.id === tarItem.id) isDeleted = false;
                    })
                    return isDeleted;
                });
                return resultArray
            }

            attributes.acList = attributes.acList;
            attributes.attachmentList = attributes.attachmentList;
            attributes.reqCommentList = attributes.reqCommentList;
            attributes.wikiLinkList = attributes.wikiLinkList;

            // 拆解List成 add、edit、del给服务端处理
            _.extend(attributes, {
                emergency: attributes.emergency ? 1 : 0,
                isMultiComponent: attributes.isMultiComponent ? 1 : 0
            });

            attributes.reqRelateList ?
                attributes.reqRelateList = attributes.reqRelateList.map(function (el) {
                    return {relateId: el}
                }) :
                attributes.reqRelateList = [];

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
            })
        },

        resFilter: function (res) {
            return res.productReqFormMap || {}
        }
    });

    /*
    * base.childs 可以访问子节点collection
    * */

    return base;
});