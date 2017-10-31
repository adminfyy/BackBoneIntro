/**
 * Created by fuyy on 2017/4/5.
 */
define([
        'backbone',
        'jquery',
        'text!templates/backlog-card.html',
        'models/global',
        'common',
        'collections/req-on-version',
        'views/modal-opt-product',
        'views/list-backlog-item'
    ],
    function (Backbone, $, Template, Global,
              Common, ChildCollection, ProductDetailOpt, BacklogItemView) {
        
        var backlogCard = BacklogItemView.extend({
            
            collectionConstructor: ChildCollection.__proto__.constructor,
            
            initialize: function (options) {
                this.listenTo(this.model, 'change', _.debounce(this.render, 200));
                this.listenTo(this.model, 'change', this.setUpDisabled);
                this.listenTo(this.model, 'change', this.checkShouldThisBeRemoved);
                this.listenTo(this.model, 'destroy', this.remove);
                this.$el.attr("data-id", this.model.id);
                this.$el.attr("data-parent-id", this.model.get('parentId'));
                this.$el.data("model", this.model);
                this.collectionConstructor = options.collectionConstructor;
                this.isChild = options.isChild;
                if (options.isChild) this.$el.attr("child-card", true);
//                if (!this.model.get('isSplit') && this.model.get('parentId') && (this.model.get('showType') == '1'))
// this.$el.attr("child-card", true);
                if (this.model.get('isSplit')) {
                    this.model.children = new ((this.model.collection.constructor))();
                    this.setUpCollectionParam(this.model.children);
                    this.listenTo(this.model.children, 'reset', this.addAllChild);
                }
                
                this.setUpDisabled();
            },
            
            setUpDisabled: function () {
                var isDisabled = this.model.get('planNum') == 0 ?
                    'addClass' :
                    'removeClass';
                this.$el[ isDisabled ]('disabled');
            },
            
            checkShouldThisBeRemoved: function () {
                if (!this.isChild && (this.model.get('planNum') === 0)) {
                    this.model.collection.remove(this.model);
                    this.removeChild();
                    this.remove();
                } else if (!this.isChild) {
                    this.updatePlanNum();
                }
            },
            
            updatePlanNum: function () {
                var inThisVersion = false;
                var currentVersionId = JSON.parse(Global.get('currVer')).id;
                var versionedList = this.model.get('versionList');
                //没有VersionList字段则不进行操作
                if (_.isUndefined(versionedList) || !currentVersionId) return;
                for (var i = 0, version; i < versionedList.length; i++) {
                    version = versionedList[ i ];
                    if (version.id === currentVersionId) {
                        inThisVersion = true;
                        break;
                    }
                }
                this.model.set('planNum', inThisVersion ? 1 : 0);
            },
            
            setUpCollectionParam: function (Collection) {
                Collection.parentId = this.model.id;
                var currVer = JSON.parse(Global.get("currVer"));
                Collection.versionId = currVer.id;
            },
            
            addOneChild: function (model) {
                var view = new backlogCard({model: model, id: model.get("id"), isChild: true});
                view.$el.hide();
                this.$el.after(view.render().$el);
            }
        });
        
        return backlogCard;
    });