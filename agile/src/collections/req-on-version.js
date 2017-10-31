/**
 * Created by fuyy on 2017/3/28.
 */
define([
    'backbone',
    'models/product',
    'models/global',
    'common'
], function (Backbone, Model, Global, C) {
    'use strict';
    
    var Backlog = Backbone.Collection.extend({
        model: Model,
        
        url: rootPath + '/productReq/getVersionParentReqList.shtml',
        childUrl: rootPath + '/productReq/getVersionChildReqList.shtml',
        
        /**
         *  重置并且请求更新的数据
         * @param options
         * @returns {*}
         */
        refresh: function (options) {
            if (!this.versionId && !this.parentId) return;
            var data = {
                teamId: Global.get('team'),
                orderType: 0
            };
            
            options = _.extend({
                reset: true,
                data: data,
                url: this.parentId ? this.childUrl : this.url
            }, options);
            
            if (this.parentId) _.extend(options.data, {parentId: this.parentId});
            if (this.versionId) _.extend(options.data, {versionId: this.versionId});
            
            if (!options.silent) this.trigger('requesting');
            return this.fetch(options);
        },
        
        /**
         *  更新数据
         * @param options
         * @returns {*}
         */
        update: function (options) {
            if (!this.versionId && !this.parentId) return;
            var data = {
                teamId: Global.get('team'),
                orderType: 0
            };
            
            options = _.extend({
                data: data,
                url: this.parentId ? this.childUrl : this.url
            }, options);
            
            if (this.parentId) _.extend(options.data, {parentId: this.parentId});
            if (this.versionId) _.extend(options.data, {versionId: this.versionId});
            
            if (!options.silent) this.trigger('requesting');
            return this.fetch(options);
        },
        
        resFilter: function (res) {
            if (!res[ C.SUCCESS ]) {
                layer.msg(res[ C.MSG ]);
                return [];
            }
            return res.parentReqList || res.childReqList;
        },
        
        deadlineSort: function () {
            return this.fetch({
                reset: true,
                data: {
                    teamId: Global.get('team'),
                    versionId: this.versionId,
                    orderType: 2
                }
            });
        },
        
        prioritySort: function () {
            return this.fetch({
                reset: true,
                data: {
                    teamId: Global.get('team'),
                    versionId: this.versionId,
                    orderType: 1
                }
            });
        }
    });
    
    var back = new Backlog();
    return back;
});