/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'collections/demand-business',
    'models/demand-pool'
], function (Collection, Model) {
    'use strict';
    var constructor = Collection.constructor.extend({
        model: Model,
        url: 'productReq/getProductReqList.shtml',
        // schema: {
        //     "success": true,
        //     "msg": "@paragraph",
        //     "reqList|0-20": [{
        //         "id|+1": 2,
        //         "subject": "@name",
        //         "planPublishDate": "@date",
        //         "issueType|1": [1, 2, 3],
        //         "storyNum|1-200": 1,
        //         'priority|1': [1, 2, 3, 4],
        //         "teamRank|1-200": 1,
        //         "assigner": "@name",
        //         'state|1': ['新建', '进行中', '开发中', '待验收'],
        //         "versionName": "@name",
        //         "buslineName": "业务线@integer(1,20)",
        //         "isMultiComponent": "是否跨组件",
        //         "isNew|1": [0, 1],
        //         "isSplit|1": [0, 1],
        //         "canSplit|1": [0, 1],
        //         "canBack|1": [0, 1],
        //         "canCancel|1": [0, 1],
        //         "canDelete|1": [0, 1],
        //         "tagName": "@name"
        //     }]
        // },

        //高亮
        highlight: function (term) {
            var firstMatchModel;
            this.each(function (model) {
                model.trigger('cancel-highlight');
                var subject = model.get('subject');
                if (term.length && subject.indexOf(term) !== -1) {
                    firstMatchModel || (firstMatchModel = model);
                    model.trigger('highlight');
                    model.set('highlight', true)
                }
            });
            firstMatchModel && firstMatchModel.trigger('scrollToThis')
        },

        parentChanged: function (model) {
            if (model.hasChanged('isMultiComponent')) this.invoke('set', 'isMultiComponent', model.get('isMultiComponent'))
        }
    });
    var instance = new constructor();
    instance.listenToQuery();
    return instance;
})