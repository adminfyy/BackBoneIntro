/**
 * Created by fuyy on 2017/4/5.
 * @deprecated 不建议使用该文件
 */
define([
        'backbone',
        'jquery',
        'text!templates/modal-split.html',
        'common',
        'collections/task',
        'models/global',
        'models/product',
        'views/list-split-item',
        'simditor',
        'collections/tag',
        'collections/product',
        'views/list-ac',
        'views/list-attachment',
        'views/list-total-solution',
        'collections/user',
        'collections/team-member'
    ],
    function (Backbone, $, ModalTemplate, Common, Tasks, Global, ProductModel, splitItemView, Simditor,
              TagCollection, ProductCollection, acView, attachmentView, totalSolutionView, userCollection, TeamMemberCollection) {



        //模态框全局处理事件
        return Backbone.View.extend({

            el: '#split',

            template: _.template(ModalTemplate),

            url: {
                "save": 'productReq/saveSplitReq.shtml',
                'children': 'productReq/getSplitChildReqList.shtml'
            },

            //保存所使用的模型集合
            collection: new ProductCollection.constructor(),

            events: {
                "click [role='save']": "saveModel",
                "click [role='continue']": "continueSplit",
                "click #discard": "discardModify",
                "click #saveModify": "saveModify"
            },

            fields: [ {
                field: 'issueType',
                options: {
                    data: Common.issueTypeOptions
                }
            } ],

            initialize: function () {
                Backbone.off("splitDemandHandle").on("splitDemandHandle", this.gotModel, this);
                this.listenTo(this.collection, "view-item-detail", this.gotDetailModel.bind(this))
                this.listenTo(this.collection, "reset", this.addAll);
                this.listenTo(this.collection, "add", this.addOne);
                this.listenTo(this.collection, "destroy", this.renderFather);
                this.$el.on('hide.bs.modal', this.collection, this.hideSplit.bind(this));
            },

            addOne: function (item) {
                var $taskView = new splitItemView({model: item, id: item.get("id")});
                this.$('#childSplit').append($taskView.render().el);
            },

            addAll: function () {
                this.$('#childSplit').empty();
                this.collection.each(this.addOne, this);
            },

            gotModel: function (model) {
                this.model = model;
                this.listenToOnce(this.model, 'change', this.renderData.bind(this, this.model));
                this.render();

                this.collection.fetch({
                    reset: true,
                    wait: true,
                    data: {"parentId": this.model.get("id")},
                    url: this.url.children,
                    resFilter: function (res) {
                        res.reqList || (res.reqList = [])
                        return res.reqList
                    }
                })
            },

            gotDetailModel: function (detailModel) {
                this.detailModel = detailModel;
                var subject = detailModel.get('subject');
                if (detailModel.id == "" || !detailModel.id) {
                    if (subject == "子需求") {
                        this.discardModify();
                    } else {
                        this.$("#discard").show();
                        this.$("#saveModify").show();
                        this.$("#continueBtn").hide();
                        //使用模型,确保含有默认属性
                        this.renderData(detailModel);
                    }
                } else {
                    this.$("#discard").hide();
                    this.$("#saveModify").hide();
                    this.$("#continueBtn").hide();
                    var that = this;
                    Backbone
                        .ajax({
                            url: rootPath + "/productReq/productReqDetail.shtml",
                            data: {id: detailModel.id},
                            dataType: "json"
                        })
                        .success(function (data) {
                            var model = new ProductModel(data.productReqFormMap || data);
                            that.renderData(model);
                        }.bind(this))
                }
            },


            /**
             * 重置左侧子需求列表的颜色状态
             */
            resetColor: function () {
                $("#childSplit li").each(function () {
                    $(this).text().replace('×', '').trim() == "子需求" ?
                        $(this).css("background", Common.SELECTED_COLOR) :
                        $(this).css("background", Common.UNSELECTED_COLOR);
                });
            },

            discardModify: function () {
                this.$("#discard").hide();
                this.$("#saveModify").hide();
                this.$("#continueBtn").show();
                this.resetColor();
                this.renderData(this.model);
            },

            saveModify: function () {
                var json = this.getPageJson();
                if (json.subject == "" || json.subject == null) {
                    return layer.msg("标题不能为空！");
                }
                this.$("#discard").hide();
                this.$("#saveModify").hide();
                this.$("#continueBtn").show();
                this.detailModel.set(json);
                this.resetColor();
                this.renderData(this.model);
            },

            initPlugins: function () {
                var self = this;
                flatpickr("[plugin='date-picker']", {
                    locale: 'zh'
                });

                //类型
                this.fields.forEach(function (i) {
                    self
                        .$('#' + i.field)
                        .select2(i.options)
                });

                //标签部分内容
                var tags = TagCollection.toJSON();
                this.$('#reqTagList').select2($.extend({}, Common.TAG_SELECT2_OPT, {data: tags}));

                var thisProductId = this.model.get("id");
                var data = ProductCollection.toJSON().filter(function (product) {
                    return product.id !== thisProductId
                });
                this.$("#reqRelateList").select2($.extend({}, Common.REL_OPT, {data: data}));

                //参与者部分
                // var data = userCollection.toJSON().filter(function (item) {
                //     return !!item
                // });
                this.$('#reqPartyList').select2(Common.USER_AJAX_OPT);


                //执行者
                var data = TeamMemberCollection.toJSON().filter(function (item) {
                    return !!item
                }).map(function (user) {
                    return {
                        id: user.name,
                        text: user.name
                    }
                });
                this.$('#assigner').select2({data: data, placeholder: "未指派"});

                //    acList data
                this.acList = new Backbone.Collection();
                new acView({collection: this.acList, el: this.$('.acList')});

                // attachment list
                this.attachmentList = new Backbone.Collection();
                new attachmentView({collection: this.attachmentList, el: this.$('.attachmentList')});

                // wikiLinkList list
                this.wikiLinkList = new Backbone.Collection();
                new totalSolutionView({collection: this.wikiLinkList, el: this.$('.totalSolution')});

                //initial editor
                this.$description = new Simditor(
                    _.extend({
                        textarea: this.$("#description")
                    }, Common.simditorDefaultConf)
                )
            },

            renderFather: function () {
                this.gotDetailModel(this.model);
                return false;
            },

            renderData: function (model) {
                var self = this;
                var getData = function (key) {
                    var data;
                    if (key === 'reqTagList') {
                        data = model.get(key);
                        data = data.map(function (i) {
                            return i.smTagId
                        });
                        return data;
                    }

                    if (key === 'reqRelateList') {
                        data = model.get(key);
                        data = data.map(function (el) {
                            return el.relateId
                        });
                        return data;
                    }

                    if (key === 'reqPartyList') {
                        data = model.get(key);
                        data = data.map(function (el) {
                            return el.userId
                        });
                        return data;
                    }
                    if (key === 'parentId') {
                        return self.model.id
                    }
                    return model.get(key)
                };
                [
                    "subject",
                    "assigner",
                    "planPublishDate",
                    "priority",
                    "storyNum",
                    "issueType",
                    "submitter",
                    "reqTagList",
                    "reqRelateList",
                    "reqPartyList",
                    "parentId",
                    "issueKey",
                    "teamId"
                ].forEach(function (key) {
                    self.$('#' + key)
                        .val(getData(key))
                        .trigger('change')
                });
                this.acList.reset(getData('acList'));
                this.attachmentList.reset(getData('attachmentList'));
                this.$description.setValue(getData('description'))
            },

            //关闭窗口
            hideSplit: function (thatCollection) {
                var self = this;
                if (thatCollection.data.length == 0) {
                    //剔除 hide.bs.modal 监听事件
                    this.$el.off('hide.bs.modal');
                    this.$el.modal("hide");
                    return true;
                }

                layer.confirm("关闭将不保存拆解的任务，请确认是否关闭？", function (index) {
                    layer.close(index);
                    //剔除 hide.bs.modal 监听事件
                    self.$el.off('hide.bs.modal');
                    self.$el.modal("hide");
                });
                return false;
            },

            render: function () {
                this.$el.modal("show");
                this.$el.html(this.template(this.model.toJSON()));
                this.undelegateEvents().delegateEvents();
                this.initPlugins();
                this.renderData(this.model);
            },

            //继续拆解按钮
            continueSplit: function () {
                var json = this.getPageJson();
                if (json.subject == "" || json.subject == null) {
                    layer.msg("标题不能为空！");
                    return false
                }
                this.collection.push(new ProductModel(json));
                this.renderData(this.model);
            },

            getPageJson: function () {
                var dataJson = this.$el.find("form").serializeJson();
                var issueType = $('#issueType').val();

                dataJson.issueType = issueType;
                dataJson.reqTagList = this.reformatTagList(dataJson.reqTagList);
                dataJson.acList = this.acList.toJSON();

                dataJson.addAcList = dataJson.acList.filter(function (el) {
                    return !el.id
                });
                dataJson.editAcList = dataJson.acList.filter(function (el) {
                    return el.id;
                });
                dataJson.delAcList = this.model.get('acList').filter(function (item) {
                    var exist = false;
                    dataJson.acList.filter(function (el) {
                        if (el.id == item.id) exist = true
                    });
                    return !exist
                });

                dataJson.attachmentList = this.attachmentList.toJSON();
                dataJson.addAttachmentList = dataJson.attachmentList.filter(function (el) {
                    return !el.id
                });
                dataJson.editAttachmentList = dataJson.attachmentList.filter(function (el) {
                    return el.id;
                });
                dataJson.delAttachmentList = this.model.get('attachmentList').filter(function (item) {
                    var exist = false;
                    dataJson.attachmentList.filter(function (el) {
                        if (el.id == item.id) exist = true
                    });
                    return !exist
                });

                dataJson.reqRelateList = _.flatten([ dataJson.reqRelateList ])
                    .filter(function (el) {
                        return !!el
                    })
                    .map(function (el) {
                        return {relateId: el}
                    });

                dataJson.reqPartyList = _.flatten([ dataJson.reqPartyList ])
                    .filter(function (el) {
                        return !!el
                    })
                    .map(function (item) {
                        return {
                            userId: item,
                            smReqId: dataJson.id
                        }
                    });

                return dataJson;
            },

            reformatTagList: function (tagList) {

                var newList = [];

                if (!tagList) {
                    return newList
                }

                if (!_.isArray(tagList)) {
                    tagList = [ tagList ]
                }


                var model, key;
                for (var i in tagList) {

                    key = tagList[ i ];
                    model = TagCollection.get(key);

                    if (!model) model = {name: key};

                    model.toJSON && (model = model.toJSON());

                    model.id && (model[ "smTagId" ] = model.id);

                    model[ "smReqId" ] = this.model.get('id');

                    newList.push(model);
                }


                return newList;
            },

            saveModel: function () {
                var that = this;

                var data = this.collection.filter(function (model) {
                    return model.get('subject') !== '子需求' && model.isNew()
                });

                data = data.map(function (model) {
                    model.set('teamId', Global.get('team'));
                    model.set('isReady', 1);//产品列表拆分需求的时候，子需求的isReady还是就绪
                    return model.toJSON();
                });
                $.ajax({
                    url: this.url.save,
                    type: "post",
                    dataType: "json",
                    contentType: "application/json",
                    data: JSON.stringify(data)
                })
                    .success(function () {
                        //layer.msg("创建成功");
                        //剔除 hide.bs.modal 监听事件
                        TagCollection.refresh();
                        that.$el.off('hide.bs.modal');
                        that.$el.modal("hide");
                        Backbone.trigger("PRODUCT-LIST-REFRESH");
                    }.bind(this));
            }
        });
    });