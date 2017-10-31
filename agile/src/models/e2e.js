define([
    'backbone',
    'models/global'
], function (Backbone, Global) {
    'use strict';
    var base = Backbone.Model.extend({
        initialize: function () {

            Backbone.Model.prototype.initialize.call(this);
        },

        defaults: {
            "subject": "需求标题",
            "pmsId": "-",
            "po": "主导PO",
            "isMultiVersion": null,
            "versionName": "版本名",
            "isMultiComponent": null,
            "comName": "主导组件",
            "comId": null,
            "multiComName": "涉及组件(逗号隔开)",
            "state": "需求状态",
            "emergency": null,
            "isVip3": null,
            "planPublishDate": null, //"客户期望时间",
            "pmsCreateTime": null, //"客户提出(创建日期)",
            "pmsAuditTime": null, //"需求审核日期",
            "createTime": null, //"需求确认日期",
            "readyTime": null, //"需求就绪日期",
            "planVersionTime": null, //'版本规划日期',
            "developingTime": null, //"需求研发日期",
            "releaseTime": null, //"发布日期",
            "deployStartTime": null, //"部署上线(升级开始)",
            "deployEndTime": null, //"部署上线(升级结束)",
            "customerCheckTime": null, //"客户验收日期",
            "pmsAuditPeriod": null, //"需求审核时间",
            "planReqPeriod": null, //"需求规划时间",
            "handleReqPeriod": null, //"需求处理时间",
            "deployPeriod": null, //"需求部署上线时间",
            "customerCheckPeriod": null, //"客户验收时间",
            "observationPeriod": null, //"观察期时间",
            "isObservation": null,
            "childReqList": [],
            "pmsUrl": 'javascript:void 0'
        }
    });

    // __MOCK__ && $.mockjax({
    //     url: 'end2end/getEnd2EndReqList.shtml',
    //     type: 'get',
    //     response: function (settings) {
    //         this.responseText = {
    //             success: true,
    //             msg: '操作成功'
    //         }
    //     }
    // });
    return base;
});