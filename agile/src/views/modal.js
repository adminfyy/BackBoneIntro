/**
 * Created by fuyy on 2017/4/5.
 */
define([
    'backbone',
    'views/modal-create-demand-opt'
], function (Backbone, createDemandOpt) {
    
    //模态框全局处理事件
    //作为 modal.js 与backbone的 适配使用
    return Backbone.View.extend({
        
        el: '#taskDetail',
        
        initialize: function () {
            Backbone
                .off("setModal")
                .on("setModal", this.setModal, this)
                .off('create-demand')
                .on('create-demand', this.createDemand, this);
        },
        
        render: function () {
            this.show();
            this.$el.html(this.template(this.getTemplateData()));
            this.stopListening();
            this.undelegateEvents().delegateEvents();
            this.initPlugins();
        },
        
        show: function () {
            this.$el.modal("show");
            return this;
        },
        
        hide: function () {
            this.$el.modal("hide");
        },
        
        //modal 抽离精简部分
        setModal: function (option) {
            _.extend(this, option);
            this.render();
        },
        
        createDemand: function () {
            this.setModal(createDemandOpt());
        },
        
        /***
         * 获取模板需要使用数据
         */
        getTemplateData: function () {
            return this.model.toJSON();
        }
        
    });
});