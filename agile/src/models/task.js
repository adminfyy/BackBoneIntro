/**
 * Created by fuyy on 2017/4/5.
 */
define([
    'backbone'
], function (Backbone, _) {
    'use strict';
    var task = Backbone.Model.extend({
        defaults: {
            "blockNum": 0,
            "createTime": 0,
            "description": "",
            estimatedTime: "",
            isBug: 0,
            taskType: 0,
            party: "",
            smReqId: -1,
            smSprintId: -1,
            state: "",
            swimlaneId: -1,
            title: ""
        }
    });

    return task;
});