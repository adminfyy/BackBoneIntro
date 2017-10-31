/**
 * Created by fuyy on 2017/4/5.
 */
define([
        'backbone',
        'jquery',
        'text!templates/backlog-card.html',
        'models/global',
        'collections/backlog',
        'views/modal-opt-product'
    ],
    function (Backbone, $, Template, Global, ChildCollection, ProductModalOpt) {
        
        var backlogCard = Backbone.View.extend({
            
            tagName: 'li',
            
            className: 'task-list-item',
            
            template: _.template(Template),
            
            collectionConstructor: ChildCollection.__proto__.constructor,
            
            events: {
                "click": "getModelDetail",
                "click .child-toggle": "childToggle",
                "fetch": "fetch",
                "refresh-children-data": "updateChildData",
                "model-change": 'forceModelChange',
                "position-changed": "positionChanged"
            },
            
            forceModelChange: function () {
                this.model.trigger('change');
            },
            
            initialize: function (options) {
                this.listenTo(this.model, 'change', _.debounce(this.render, 200));
                this.listenTo(this.model, 'change', this.setUpDisabled);
                this.listenTo(this.model, 'change', this.checkShouldThisBeRemoved);
                this.listenTo(this.model, 'destroy', this.remove);
                this.collectionConstructor = options.collectionConstructor;
                //区分是否为子节点
                this.isChild = options.isChild;
                if (options.isChild) this.$el.attr("child-card", true);

//                if (!this.model.get('isSplit') && this.model.get('parentId') && (this.model.get('showType') == '1'))
// this.$el.attr("child-card", true);
                this.$el.attr("data-id", this.model.id);
                this.$el.attr("data-parent-id", this.model.get('parentId'));
                this.$el.data("model", this.model);
                this.setUpDisabled();
                
                if (this.model.get('isSplit')) {
                    this.model.children = new ((this.model.collection.constructor))();
                    this.setUpCollectionParam(this.model.children);
                    //延迟200毫秒，避免这个$el并未插入Dom,导致子节点也无法渲染
                    this.listenTo(this.model.children, 'reset', _.debounce(this.addAllChild, 200));
                }
            },
            
            setUpDisabled: function () {
                var isDisabled = this.model.get('isAllPlan') ?
                    'addClass' :
                    'removeClass';
                this.$el[ isDisabled ]('disabled');
            },
            
            /**
             * 检查一级卡片是否应该被删除
             */
            checkShouldThisBeRemoved: function () {
                if (!this.isChild && this.model.get('isAllPlan') === 1) {
                    this.model.collection.remove(this.model);
                    this.removeChild();
                    this.remove();
                }
            },
            
            getModelDetail: function () {
                this.model.fetch({data: {id: this.model.id}})
                    .success(_.bind(this.viewDetail, this));
            },
            
            viewDetail: function () {
                Backbone.trigger("setModal", ProductModalOpt(this.model));
            },
            
            render: function () {
                this.$el.html(this.template(this.model.toJSON()));
                return this;
            },
            
            /**
             * 加载 子Model数据
             */
            loadChild: function () {
                this.model.children && this.model.children.refresh();
                return this;
            },
            
            
            /**
             * 刷新子节点数据
             * @returns {boolean} false
             */
            updateChildData: function () {
                this.model.children && this.model.children.update();
                return false;
            },
            
            /**
             * 设定model.collection的属性 用于子属性请求
             * @param Collection
             */
            setUpCollectionParam: function (Collection) {
                Collection.parentId = this.model.id;
            },
            
            removeChild: function () {
                //删除原来相关的子节点，重新获取一次；
                this.$el.siblings('[data-parent-id=' + this.model.id + ']').remove();
            },
            
            addAllChild: function () {
                this.removeChild();
                this.model.children && this.model.children.each(this.addOneChild, this);
            },
            
            addOneChild: function (model) {
                var view = new backlogCard({model: model, id: model.get("id"), isChild: true});
                view.render()
                    .$el.hide();
                this.$el.after(view.render().$el);
            },
            
            childToggle: function () {
                this.$el.toggleClass('children-open');
                var action = this.$el.hasClass('children-open') ? 'show' : 'hide';
                var selector = '[data-parent-id=' + this.model.id + ']';
                this.$el.siblings(selector)[ action ]();
                return false;
            },
            
            clear: function () {
                this.model.destroy();
                return this;
            },
            
            fetch: function () {
                this.model.fetch();
                return this;
            },
            
            //这个Dom被移动，子需求跟随在之后
            positionChanged: function () {
                var childrenSelector = '[data-parent-id=' + this.model.id + ']';
                this.$el.siblings(childrenSelector).detach().insertAfter(this.$el);
            }
            
        });
        
        return backlogCard;
    });