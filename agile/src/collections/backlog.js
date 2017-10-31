/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'models/product',
    'models/global',
    'common'
], function (BasicCollection, Model, Global, C) {
    'use strict';
    
    var Backlog = Backbone.Collection.extend({
        model: Model,
        
        url: rootPath + '/productReq/getWaitPlanningReqList.shtml',
        
        /**
         * 清空并且更新数据
         * @param options 附加请求参数
         * @returns {*} promise
         */
        refresh: function (options) {
            options = _.extend({
                reset: true,
                data: {
                    teamId: Global.get('team'),
                    orderType: 0
                }
            }, options);
            
            if (this.parentId) $.extend(options.data, {parentId: this.parentId});
            if (!options.silent) this.trigger('requesting');
            return this.fetch(options);
        },
        
        /**
         * 更新数据
         * @param options 请求参数
         * @returns {*} promise
         */
        update: function (options) {
            options = _.extend({
                data: {
                    teamId: Global.get('team'),
                    orderType: 0
                }
            }, options);
            
            if (this.parentId) $.extend(options.data, {parentId: this.parentId});
            if (!options.silent) this.trigger('requesting');
            return this.fetch(options);
        },
        
        resFilter: function (res) {
            if (!res[ C.SUCCESS ]) {
                layer.msg(res[ C.MSG ]);
                return [];
            }
            return res.waitPlanningReqList;
        },
        
        deadlineSort: function () {
            return this.fetch({
                reset: true,
                data: {
                    teamId: Global.get('team'),
                    orderType: 2
                }
            });
        },
        
        prioritySort: function () {
            return this.fetch({
                reset: true,
                data: {
                    teamId: Global.get('team'),
                    orderType: 1
                }
            });
        },
        
    });
    return new Backlog();
});