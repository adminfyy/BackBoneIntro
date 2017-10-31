define('backbone-private', [
    'backbone'
], function (Backbone) {
    'use strict';

    /* 1、处理错误接口 (success: false) 调用layer.msg 显示错误的消息
    *  2、允许使用urlMap定义save、destory、fetch 对应的url接口
    *  3、允许使用resFilter处理 collection以及model接口返回的数据(提取数据)ps： Backbone.Collection 自身只能 处理 Array类型的接口
    * */
    var wrapMsg = function (model, options) {
        var businessSuccess = options.success;
        options.success = function (resp) {
            if (resp.hasOwnProperty('success') && !resp.success) {
                layer.msg(resp[ 'msg' ] || '操作失败');
                return false
            }
            businessSuccess && businessSuccess(options.resFilter ? options.resFilter(resp) : model.resFilter(resp))
        };
        options.fail = function (resp) {
            layer.msg('接口：' + options.url, '请求失败');
        }
    };

    _.extend(Backbone.Model.prototype, {
        urlMap: {
            /**
             * method could be:
             * create 新建地址
             * update 更新地址
             * patch
             * delete 删除地址
             * read 查详情地址
             */
        },

        getUrl: function (type) {
            return _.result(this.urlMap, type)
        },

        sync: function (method, model, options) {
            var methodUrl = this.getUrl(method) || model.url;
            options.url || (options.url = methodUrl);
            wrapMsg(model, options);
            return Backbone.sync.apply(this, arguments);
        },
        //需要子类覆盖
        resFilter: function (data) {
            return data;
        }
    });

    _.extend(Backbone.Collection.prototype, {

        sync: function (method, model, options) {
            wrapMsg(model, options);
            return Backbone.sync.apply(this, arguments);
        },

        //需要子类覆盖
        resFilter: function (data) {
            return data;
        }
    });

    return Backbone;
});