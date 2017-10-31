/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'models/product',
    'models/global'
], function (Backbone, Model, Global) {
    'use strict';
    var StageCollections = Backbone.Collection.extend({
        model: Model,

        url: rootPath + '/productReq/getReqListWithOutParent.shtml',

        refresh: function (options) {
            options = _.extend({
                reset: true,
                data: {
                    teamId: Global.get('team'),
                    reqState: "1"
                }
            },options)

            //do not using 'request'
            //cause diff from model
            if(!options.silent)this.trigger('requesting')
            return this.fetch(options)
        },

        prioritySort: function () {
            var opt = {
                data: {
                    teamId: Global.get('team'),
                    reqState: "1",
                    orderType: "priority"
                }
            }
            return this.refresh(opt)
        },

        deadlineSort: function () {
            var opt = {
                data: {
                    teamId: Global.get('team'),
                    reqState: "1",
                    orderType: "deadline"
                }
            }
            return this.refresh(opt)
        },

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
        }

    });

    return new StageCollections();
})