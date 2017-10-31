/**
 * Created by fuyy on 2017/4/5.
 */
define([
        'backbone',
        'jquery',
        'text!templates/product.html',
        'views/list-demand-item',
        'views/modal-opt-product',
        'models/product',
        'views/modal-opt-split-product',
        'models/global'
    ],
    function (Backbone, $, Template, demandView, ProductDetailView, ProductModel, ModalSplitProduct, Global) {
        
        var product = demandView.extend({
            
            template: _.template(Template),
            
            events: {
                "click ": "getModelDetail",
                "click .split": "showSplitView",
                "click .parent": "viewParent",
                "click .fa-angle-double-down": "bottom",
                "click .fa-angle-double-up": "top"
            },
            
            getModelDetail: function () {
                this.model
                    .fetch({data: {id: this.model.id}})
                    .success(this.viewDetail.bind(this));
                return false;
            },
            
            showSplitView: function () {
                // debugger
                var that = this;
                this.model
                    .fetch({data: {id: this.model.id}})
                    .done(function () {
                        that.showSplit();
                    });
                return false;
            },
            
            viewParent: function () {
                var parentId = this.model.get('parentId');
                var that = this;
                Backbone.ajax({
                    url: rootPath + "/productReq/productReqDetail.shtml",
                    data: {id: this.model.get('parentId')},
                    dataType: "json",
                    method: 'get'
                }).success(
                    function (res) {
                        //通过reqState来 控制[拆分]按钮的显示
                        var data = res.productReqFormMap || res;
                        _.extend(data, {reqState: that.model.get('reqState')});
                        
                        //用model覆盖 避免某些字段没有默认值
                        data = new ProductModel(data);
                        
                        Backbone.trigger("setModal", ProductDetailView(data));
                    }
                ).error(function (data) {
                    console.log(data);
                });
                return false;
            },
            
            viewDetail: function () {
                Backbone.trigger("setModal", ProductDetailView(this.model));
                return this;
            },
            
            showSplit: function () {
//                Backbone.trigger("splitDemandHandle", this.model);
                var jiraUrl = Global.defaults.jiraUrl;
                this.model.set('jiraUrl',jiraUrl)
                Backbone.trigger('setModal', ModalSplitProduct(this.model));
                return this;
            }
            
        });
        
        return product;
    });